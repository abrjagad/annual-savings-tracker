import { generateObject } from "ai";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import db from "./db.js";
import app from "./index.js";

// Mock the dependencies
vi.mock("./db.js", () => ({
	default: {
		all: vi.fn(),
		prepare: vi.fn(),
		serialize: vi.fn((cb) => cb()),
		run: vi.fn(),
	},
}));

vi.mock("ai", () => ({
	generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
	google: vi.fn(),
}));

describe("Auto-categorize Endpoint", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 200 and a message when no uncategorized entries are found", async () => {
		db.all.mockImplementation((sql, params, cb) => {
			cb(null, []);
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("No uncategorized entries found.");
		expect(response.body.categorizedCount).toBe(0);
	});

	it("should return 500 if database fails to fetch entries", async () => {
		db.all.mockImplementation((sql, params, cb) => {
			cb(new Error("Database error"));
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("Database error");
	});

	it("should successfully categorize entries using AI", async () => {
		const mockRows = [
			{ id: 1, note: "Target Purchase" },
			{ id: 2, note: "Shell Gas Station" },
		];

		const mockCategorizations = [
			{ id: 1, category: "Shopping" },
			{ id: 2, category: "Transport" },
		];

		db.all.mockImplementation((sql, params, cb) => {
			cb(null, mockRows);
		});

		generateObject.mockResolvedValue({
			object: { categorizations: mockCategorizations },
		});

		const mockStmt = {
			run: vi.fn(),
			finalize: vi.fn((cb) => {
				if (cb) cb();
			}),
		};
		db.prepare.mockReturnValue(mockStmt);

		db.run.mockImplementation((sql, params, cb) => {
			if (sql === "COMMIT" && typeof params === "function") {
				params(null);
			} else if (typeof params === "function") {
				params(null);
			}
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("Successfully categorized 2 entries.");
		expect(response.body.categorizedCount).toBe(2);
		expect(response.body.updates).toEqual(mockCategorizations);

		expect(db.prepare).toHaveBeenCalledWith(
			"UPDATE entries SET category = ? WHERE id = ?",
		);
		expect(mockStmt.run).toHaveBeenCalledTimes(2);
		expect(db.run).toHaveBeenCalledWith("BEGIN TRANSACTION");
		expect(db.run).toHaveBeenCalledWith("COMMIT", expect.any(Function));
	});

	it("should return 500 if AI generation fails", async () => {
		const mockRows = [{ id: 1, note: "Target Purchase" }];
		db.all.mockImplementation((sql, params, cb) => {
			cb(null, mockRows);
		});

		generateObject.mockRejectedValue(new Error("AI generation failed"));

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("AI generation failed");
	});

	it("should return 500 if database fails to commit transaction", async () => {
		const mockRows = [{ id: 1, note: "Target Purchase" }];
		const mockCategorizations = [{ id: 1, category: "Shopping" }];

		db.all.mockImplementation((sql, params, cb) => {
			cb(null, mockRows);
		});

		generateObject.mockResolvedValue({
			object: { categorizations: mockCategorizations },
		});

		const mockStmt = {
			run: vi.fn(),
			finalize: vi.fn(),
		};
		db.prepare.mockReturnValue(mockStmt);

		db.run.mockImplementation((sql, params, cb) => {
			if (sql === "COMMIT" && typeof params === "function") {
				params(new Error("Commit failed"));
			}
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("Commit failed");
	});
});
