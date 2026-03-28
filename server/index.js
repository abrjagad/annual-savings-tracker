import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { ALL_CATEGORIES } from "../shared/categories.js";
import db from "./db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Get all entries
app.get("/api/entries", (_req, res) => {
	db.all(
		"SELECT * FROM entries ORDER BY date DESC, id DESC",
		[],
		(err, rows) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json(rows);
		},
	);
});

// Add a single entry
app.post("/api/entries", (req, res) => {
	const { type, category, amount, account, date, note } = req.body;
	db.run(
		"INSERT INTO entries (type, category, amount, account, date, note) VALUES (?, ?, ?, ?, ?, ?)",
		[type, category, amount, account, date, note],
		function (err) {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ id: this.lastID, ...req.body });
		},
	);
});

// Bulk add entries
app.post("/api/entries/bulk", (req, res) => {
	const entries = req.body;

	// Load existing entries to detect duplicates
	db.all(
		"SELECT date, amount, account, note FROM entries",
		[],
		(err, existing) => {
			if (err) return res.status(500).json({ error: err.message });

			const existingKeys = new Set(
				existing.map(
					(e) =>
						`${e.date}|${e.amount}|${e.account}|${(e.note || "").trim().toLowerCase()}`,
				),
			);

			// Deduplicate incoming entries against DB and within the batch itself
			const seen = new Set();
			const toInsert = [];
			for (const entry of entries) {
				const key = `${entry.date}|${entry.amount}|${entry.account}|${(entry.note || "").trim().toLowerCase()}`;
				if (!existingKeys.has(key) && !seen.has(key)) {
					toInsert.push(entry);
					seen.add(key);
				}
			}

			const skipped = entries.length - toInsert.length;

			if (toInsert.length === 0) {
				return res.json({
					message: `All ${entries.length} entries were duplicates and skipped.`,
					inserted: 0,
					skipped,
				});
			}

			const stmt = db.prepare(
				"INSERT INTO entries (type, category, amount, account, date, note) VALUES (?, ?, ?, ?, ?, ?)",
			);

			db.serialize(() => {
				toInsert.forEach((entry) => {
					stmt.run([
						entry.type,
						entry.category,
						entry.amount,
						entry.account,
						entry.date,
						entry.note,
					]);
				});
				stmt.finalize((finalErr) => {
					if (finalErr) return res.status(500).json({ error: finalErr.message });
					res.json({
						message:
							skipped > 0
								? `Successfully imported ${toInsert.length} entries, skipped ${skipped} duplicates.`
								: `Successfully imported ${toInsert.length} entries.`,
						inserted: toInsert.length,
						skipped,
					});
				});
			});
		},
	);
});

// Update an entry's category — also learns a rule and applies to similar entries
app.patch("/api/entries/:id/category", (req, res) => {
	const { category } = req.body;
	if (!category) {
		return res.status(400).json({ error: "Category is required" });
	}

	const entryId = req.params.id;

	// 1. Update the target entry
	db.run(
		"UPDATE entries SET category = ? WHERE id = ?",
		[category, entryId],
		function (updateErr) {
			if (updateErr) return res.status(500).json({ error: updateErr.message });
			if (this.changes === 0)
				return res.status(404).json({ error: "Entry not found" });

			// 2. Fetch the entry's note to create a rule
			db.get(
				"SELECT note FROM entries WHERE id = ?",
				[entryId],
				(fetchErr, row) => {
					if (fetchErr || !row || !row.note || !row.note.trim()) {
						// No note to learn from — just return the update
						return res.json({
							id: Number(entryId),
							category,
							rulesApplied: 0,
						});
					}

					const pattern = row.note.trim().toLowerCase();

					// 3. Upsert rule: pattern → category
					db.run(
						`INSERT INTO category_rules (pattern, category) VALUES (?, ?)
						 ON CONFLICT(pattern) DO UPDATE SET category = excluded.category, created_at = datetime('now')`,
						[pattern, category],
						(ruleErr) => {
							if (ruleErr) {
								// Rule save failed — still return the entry update
								return res.json({
									id: Number(entryId),
									category,
									rulesApplied: 0,
								});
							}

							// 4. Apply rule to all other matching uncategorized entries
							db.run(
								`UPDATE entries SET category = ? WHERE id != ? AND (category = 'Uncategorized' OR category IS NULL OR category = '') AND LOWER(note) LIKE ?`,
								[category, entryId, `%${pattern}%`],
								function (applyErr) {
									res.json({
										id: Number(entryId),
										category,
										rulesApplied: applyErr ? 0 : this.changes,
									});
								},
							);
						},
					);
				},
			);
		},
	);
});

// Delete an entry
app.delete("/api/entries/:id", (req, res) => {
	db.run("DELETE FROM entries WHERE id = ?", req.params.id, function (err) {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ deleted: this.changes });
	});
});

// Bulk delete entries
app.post("/api/entries/bulk-delete", (req, res) => {
	const { ids } = req.body;
	if (!Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ error: "Invalid or empty IDs array" });
	}

	const placeholders = ids.map(() => "?").join(",");
	const sql = `DELETE FROM entries WHERE id IN (${placeholders})`;

	db.run(sql, ids, function (err) {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ deleted: this.changes });
	});
});

// Get all accounts
app.get("/api/accounts", (_req, res) => {
	db.all("SELECT * FROM accounts", [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows.map((r) => r.name));
	});
});

// Add an account
app.post("/api/accounts", (req, res) => {
	const { name } = req.body;
	db.run("INSERT INTO accounts (name) VALUES (?)", [name], function (err) {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ id: this.lastID, name });
	});
});

// Get all category rules
app.get("/api/category-rules", (_req, res) => {
	db.all(
		"SELECT * FROM category_rules ORDER BY created_at DESC",
		[],
		(err, rows) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json(rows);
		},
	);
});

// Delete a category rule
app.delete("/api/category-rules/:id", (req, res) => {
	db.run(
		"DELETE FROM category_rules WHERE id = ?",
		req.params.id,
		function (err) {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ deleted: this.changes });
		},
	);
});

// Auto-categorize entries (applies rules first, then AI for remainder)
app.post("/api/entries/categorize", async (_req, res) => {
	try {
		// --- Phase 1: Apply saved rules to uncategorized entries ---
		const rules = await new Promise((resolve, reject) => {
			db.all("SELECT * FROM category_rules", [], (err, rows) => {
				if (err) reject(err);
				else resolve(rows || []);
			});
		});

		let ruleBasedCount = 0;
		for (const rule of rules) {
			const applied = await new Promise((resolve, reject) => {
				db.run(
					`UPDATE entries SET category = ? WHERE (category = 'Uncategorized' OR category IS NULL OR category = '') AND LOWER(note) LIKE ?`,
					[rule.category, `%${rule.pattern}%`],
					function (err) {
						if (err) reject(err);
						else resolve(this.changes);
					},
				);
			});
			ruleBasedCount += applied;
		}

		// --- Phase 2: Fetch remaining uncategorized entries for AI ---
		const fetchSql = `SELECT id, note FROM entries WHERE category = 'Uncategorized' OR category IS NULL OR category = '' LIMIT 50`;

		db.all(fetchSql, [], async (err, rows) => {
			if (err) return res.status(500).json({ error: err.message });

			if (!rows || rows.length === 0) {
				return res.json({
					message:
						ruleBasedCount > 0
							? `Applied rules to ${ruleBasedCount} entries. No remaining uncategorized entries for AI.`
							: "No uncategorized entries found.",
					categorizedCount: ruleBasedCount,
					ruleBasedCount,
				});
			}

			try {
				// Create a payload for the AI
				const transactions = rows.map((r) => ({
					id: r.id,
					description: r.note || "",
				}));

				// Categories from shared module (single source of truth).
				const validCategories = ALL_CATEGORIES;

				let object;
				try {
					const response = await generateObject({
						model: google("gemini-2.5-flash"),
						schema: z.object({
							categorizations: z.array(
								z.object({
									id: z.number(),
									category: z.enum(ALL_CATEGORIES),
								}),
							),
						}),
						prompt: `You are an expert financial categorizer. Categorize the following bank transactions into the most appropriate category.
			Valid Categories: ${validCategories.join(", ")}

			Transactions to categorize:
			${JSON.stringify(transactions, null, 2)}`,
					});
					object = response.object;
				} catch (geminiError) {
					console.warn(
						"Gemini categorization failed (possibly quota exceeded), falling back to Ollama:",
						geminiError.message,
					);

					// Dynamic import to avoid runtime errors if not strictly necessary initially
					const { createOllama } = await import("ollama-ai-provider-v2");
					const ollama = createOllama();

					const response = await generateObject({
						model: ollama("gemma3:270m"),
						schema: z.object({
							categorizations: z.array(
								z.object({
									id: z.number(),
									category: z.enum(ALL_CATEGORIES),
								}),
							),
						}),
						prompt: `You are an expert financial categorizer. Categorize the following bank transactions into the most appropriate category.
			Valid Categories: ${validCategories.join(", ")}

			Transactions to categorize:
			${JSON.stringify(transactions, null, 2)}`,
					});
					object = response.object;
				}

				const updates = object.categorizations;

				// Execute batch update
				db.serialize(() => {
					const stmt = db.prepare(
						"UPDATE entries SET category = ? WHERE id = ?",
					);
					let successCount = 0;

					db.run("BEGIN TRANSACTION");

					updates.forEach((update) => {
						stmt.run([update.category, update.id]);
						successCount++;
					});

					stmt.finalize();

					db.run("COMMIT", (commitErr) => {
						if (commitErr) {
							return res.status(500).json({ error: commitErr.message });
						}
						res.json({
							message: `Successfully categorized ${successCount + ruleBasedCount} entries (${ruleBasedCount} by rules, ${successCount} by AI).`,
							categorizedCount: successCount + ruleBasedCount,
							ruleBasedCount,
							aiCount: successCount,
							updates,
						});
					});
				});
			} catch (err) {
				console.error("AI Categorization error:", err);
				res.status(500).json({ error: err.message });
			}
		});
	} catch (error) {
		console.error("Categorization error:", error);
		res.status(500).json({ error: error.message });
	}
});

if (process.env.NODE_ENV !== "test") {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT} - VERIFICATION_V2`);
	});
}

export default app;
