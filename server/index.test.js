import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import db from "./db.js";
import app from "./index.js";

describe("API Endpoints", () => {
	beforeEach(async () => {
		// Clear tables before each test for isolation
		await new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run("DELETE FROM entries", (err) => {
					if (err) reject(err);
				});
				db.run("DELETE FROM accounts", (err) => {
					if (err) reject(err);
				});
				db.run("DELETE FROM category_rules", (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		});
	});

	afterAll(async () => {
		await new Promise((resolve, reject) => {
			db.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	});

	describe("Accounts API", () => {
		it("should return a list of accounts on GET /api/accounts", async () => {
			// Insert some data first
			await new Promise((resolve) => {
				db.run("INSERT INTO accounts (name) VALUES ('Test Account')", () =>
					resolve(),
				);
			});

			const response = await request(app).get("/api/accounts");
			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body).toContain("Test Account");
		});

		it("should add a new account on POST /api/accounts", async () => {
			const response = await request(app)
				.post("/api/accounts")
				.send({ name: "New Test Account" });

			expect(response.status).toBe(200);
			expect(response.body.name).toBe("New Test Account");
			expect(response.body.id).toBeDefined();
		});
	});

	describe("Entries API", () => {
		it("should add a new entry on POST /api/entries", async () => {
			const entry = {
				type: "expense",
				category: "Food",
				amount: 50,
				account: "Test Account",
				date: "2024-03-20",
				note: "Dinner",
			};

			const response = await request(app).post("/api/entries").send(entry);

			expect(response.status).toBe(200);
			expect(response.body.id).toBeDefined();
			expect(response.body.amount).toBe(50);
		});

		it("should return all entries on GET /api/entries", async () => {
			await request(app).post("/api/entries").send({
				type: "income",
				category: "Salary",
				amount: 1000,
				account: "Test Account",
				date: "2024-03-19",
				note: "Payday",
			});

			const response = await request(app).get("/api/entries");
			expect(response.status).toBe(200);
			expect(response.body.length).toBe(1);
			expect(response.body[0].category).toBe("Salary");
		});

		it("should delete an entry on DELETE /api/entries/:id", async () => {
			const res = await request(app).post("/api/entries").send({
				type: "expense",
				category: "Transport",
				amount: 20,
				account: "Test Account",
				date: "2024-03-18",
				note: "Bus",
			});

			const id = res.body.id;
			const deleteRes = await request(app).delete(`/api/entries/${id}`);
			expect(deleteRes.status).toBe(200);
			expect(deleteRes.body.deleted).toBe(1);

			const finalRes = await request(app).get("/api/entries");
			expect(finalRes.body.length).toBe(0);
		});

		it("should bulk delete entries on POST /api/entries/bulk-delete", async () => {
			const r1 = await request(app).post("/api/entries").send({
				type: "expense",
				category: "Food",
				amount: 10,
				account: "A",
				date: "D",
			});
			const r2 = await request(app).post("/api/entries").send({
				type: "expense",
				category: "Food",
				amount: 20,
				account: "A",
				date: "D",
			});

			const response = await request(app)
				.post("/api/entries/bulk-delete")
				.send({ ids: [r1.body.id, r2.body.id] });

			expect(response.status).toBe(200);
			expect(response.body.deleted).toBe(2);
		});

		it("should bulk add entries on POST /api/entries/bulk", async () => {
			const entries = [
				{
					type: "expense",
					category: "Food",
					amount: 10,
					account: "A",
					date: "D",
				},
				{
					type: "expense",
					category: "Food",
					amount: 20,
					account: "A",
					date: "D",
				},
			];

			const response = await request(app)
				.post("/api/entries/bulk")
				.send(entries);

			expect(response.status).toBe(200);
			expect(response.body.message).toMatch(/Successfully imported 2 entries/);
		});
	});

	describe("Category Rules API", () => {
		it("should learn a rule when a category is manually edited", async () => {
			// Create an entry
			const entry = await request(app).post("/api/entries").send({
				type: "EXPENSE",
				category: "Uncategorized",
				amount: 50,
				account: "Main",
				date: "2024-03-20",
				note: "WALMART SUPERCENTER",
			});

			// Manually edit the category
			const patchRes = await request(app)
				.patch(`/api/entries/${entry.body.id}/category`)
				.send({ category: "Shopping" });

			expect(patchRes.status).toBe(200);
			expect(patchRes.body.category).toBe("Shopping");

			// Verify rule was created
			const rulesRes = await request(app).get("/api/category-rules");
			expect(rulesRes.status).toBe(200);
			expect(rulesRes.body.length).toBe(1);
			expect(rulesRes.body[0].pattern).toBe("walmart supercenter");
			expect(rulesRes.body[0].category).toBe("Shopping");
		});

		it("should apply a learned rule to matching uncategorized entries", async () => {
			// Create 3 entries with same note, all uncategorized
			await request(app).post("/api/entries").send({
				type: "EXPENSE",
				category: "Uncategorized",
				amount: 30,
				account: "Main",
				date: "2024-03-18",
				note: "SHELL GAS",
			});
			await request(app).post("/api/entries").send({
				type: "EXPENSE",
				category: "Uncategorized",
				amount: 40,
				account: "Main",
				date: "2024-03-19",
				note: "SHELL GAS STATION",
			});
			const r3 = await request(app).post("/api/entries").send({
				type: "EXPENSE",
				category: "Uncategorized",
				amount: 50,
				account: "Main",
				date: "2024-03-20",
				note: "SHELL GAS",
			});

			// Edit one entry's category
			const patchRes = await request(app)
				.patch(`/api/entries/${r3.body.id}/category`)
				.send({ category: "Fuel" });

			expect(patchRes.status).toBe(200);
			// The other 2 entries should have been updated (both contain "shell gas")
			expect(patchRes.body.rulesApplied).toBe(2);

			// Verify all entries are now categorized
			const allRes = await request(app).get("/api/entries");
			const fuelEntries = allRes.body.filter((e) => e.category === "Fuel");
			expect(fuelEntries.length).toBe(3);
		});

		it("should return category rules on GET /api/category-rules", async () => {
			const response = await request(app).get("/api/category-rules");
			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
		});

		it("should delete a category rule on DELETE /api/category-rules/:id", async () => {
			// Create an entry and edit to create a rule
			const entry = await request(app).post("/api/entries").send({
				type: "EXPENSE",
				category: "Uncategorized",
				amount: 10,
				account: "A",
				date: "D",
				note: "Test Note",
			});
			await request(app)
				.patch(`/api/entries/${entry.body.id}/category`)
				.send({ category: "Shopping" });

			// Get the rule id
			const rulesRes = await request(app).get("/api/category-rules");
			const ruleId = rulesRes.body[0].id;

			// Delete it
			const delRes = await request(app).delete(`/api/category-rules/${ruleId}`);
			expect(delRes.status).toBe(200);
			expect(delRes.body.deleted).toBe(1);

			// Verify it's gone
			const finalRes = await request(app).get("/api/category-rules");
			expect(finalRes.body.length).toBe(0);
		});
	});
});
