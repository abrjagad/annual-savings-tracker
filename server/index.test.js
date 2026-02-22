import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import db from "./db.js";
import app from "./index.js";

describe("Accounts API", () => {
	afterAll(async () => {
		await new Promise((resolve, reject) => {
			db.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	});

	it("should return a list of accounts on GET /api/accounts", async () => {
		const response = await request(app).get("/api/accounts");
		expect(response.status).toBe(200);
		expect(Array.isArray(response.body)).toBe(true);
	});
});
