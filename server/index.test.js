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
});
