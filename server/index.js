import cors from "cors";
import dotenv from "dotenv";
import express from "express";
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
	const stmt = db.prepare(
		"INSERT INTO entries (type, category, amount, account, date, note) VALUES (?, ?, ?, ?, ?, ?)",
	);

	db.serialize(() => {
		entries.forEach((entry) => {
			stmt.run([
				entry.type,
				entry.category,
				entry.amount,
				entry.account,
				entry.date,
				entry.note,
			]);
		});
		stmt.finalize((err) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ message: `Successfully imported ${entries.length} entries` });
		});
	});
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

// Auto-categorize entries
app.post("/api/entries/categorize", async (_req, res) => {
	try {
		// Fetch uncategorized entries mapping to a category like 'Uncategorized' or where empty.
		// For now, we will assume 'Uncategorized' or '' or null
		const fetchSql = `SELECT id, note FROM entries WHERE category = 'Uncategorized' OR category IS NULL OR category = '' LIMIT 5`;

		db.all(fetchSql, [], async (err, rows) => {
			if (err) return res.status(500).json({ error: err.message });

			if (!rows || rows.length === 0) {
				return res.json({
					message: "No uncategorized entries found.",
					categorizedCount: 0,
				});
			}

			// Create a payload for the AI
			const _transactions = rows.map((r) => ({
				id: r.id,
				description: r.note || "",
			}));

			// The categories based on your frontend constants.
			const _validCategories = [
				"Salary",
				"Bonus",
				"Investment",
				"Gift",
				"Other Income",
				"Food",
				"Transport",
				"Utilities",
				"Insurance",
				"Entertainment",
				"Shopping",
				"Healthcare",
				"Travel",
				"Other Expense",
				"Principal",
				"Interest",
				"Escrow/Taxes",
				"Uncategorized",
			];

			const { object } = await generateObject({
				model: google("gemini-2.5-flash"), // Or your preferred model
				schema: z.object({
					categorizations: z.array(
						z.object({
							id: z.number(),
							category: z.enum([
								"Salary",
								"Bonus",
								"Investment",
								"Gift",
								"Other Income",
								"Food",
								"Transport",
								"Utilities",
								"Insurance",
								"Entertainment",
								"Shopping",
								"Healthcare",
								"Travel",
								"Other Expense",
								"Principal",
								"Interest",
								"Escrow/Taxes",
								"Uncategorized",
							]),
						}),
					),
				}),
				prompt: `You are an expert financial categorizer. Categorize the following bank transactions into the most appropriate category.
			Valid Categories: ${validCategories.join(", ")}

			Transactions to categorize:
			${JSON.stringify(transactions, null, 2)}`,
			});

			const updates = object.categorizations;

			// Execute batch update
			db.serialize(() => {
				const stmt = db.prepare("UPDATE entries SET category = ? WHERE id = ?");
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
						message: `Successfully categorized ${successCount} entries.`,
						categorizedCount: successCount,
						updates,
					});
				});
			});
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
