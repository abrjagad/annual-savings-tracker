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

	// Helper: set up db.all to return empty rules first, then the given rows for entries
	const setupDbAll = (entryRows) => {
		let callCount = 0;
		db.all.mockImplementation((sql, params, cb) => {
			callCount++;
			if (callCount === 1) {
				// Phase 1: rules query — return empty rules
				cb(null, []);
			} else {
				// Phase 2: entries query
				cb(null, entryRows);
			}
		});
	};

	// Helper: set up db.run to handle Phase 1 rule-apply UPDATEs as no-ops
	const setupDbRun = (overrides = {}) => {
		db.run.mockImplementation(function (sql, params, cb) {
			if (
				overrides.onCommit &&
				sql === "COMMIT" &&
				typeof params === "function"
			) {
				return overrides.onCommit(params);
			}
			// For Phase 1 rule UPDATEs and BEGIN TRANSACTION — call cb if provided
			if (typeof params === "function") {
				params.call({ changes: 0 }, null);
			} else if (typeof cb === "function") {
				cb.call({ changes: 0 }, null);
			}
		});
	};

	it("should return 200 and a message when no uncategorized entries are found", async () => {
		setupDbAll([]);

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("No uncategorized entries found.");
		expect(response.body.categorizedCount).toBe(0);
	});

	it("should return 500 if database fails to fetch entries", async () => {
		let callCount = 0;
		db.all.mockImplementation((sql, params, cb) => {
			callCount++;
			if (callCount === 1) {
				// Rules query succeeds with empty
				cb(null, []);
			} else {
				// Entries query fails
				cb(new Error("Database error"));
			}
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

		setupDbAll(mockRows);

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

		setupDbRun({
			onCommit: (cb) => cb(null),
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(200);
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
		setupDbAll(mockRows);

		generateObject.mockRejectedValue(new Error("AI generation failed"));

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("AI generation failed");
	});

	it("should return 500 if database fails to commit transaction", async () => {
		const mockRows = [{ id: 1, note: "Target Purchase" }];
		const mockCategorizations = [{ id: 1, category: "Shopping" }];

		setupDbAll(mockRows);

		generateObject.mockResolvedValue({
			object: { categorizations: mockCategorizations },
		});

		const mockStmt = {
			run: vi.fn(),
			finalize: vi.fn(),
		};
		db.prepare.mockReturnValue(mockStmt);

		setupDbRun({
			onCommit: (cb) => cb(new Error("Commit failed")),
		});

		const response = await request(app).post("/api/entries/categorize");

		expect(response.status).toBe(500);
		expect(response.body.error).toBe("Commit failed");
	});
});
