import { tool } from "ai";
import { z } from "zod";
import { ALL_CATEGORIES } from "../../shared/categories.js";
import { dbAll, dbGet } from "./dbUtils.js";

// Helper to filter out incomes/mortgage if answering about "expenses" only? 
// The user asks "top 5 expenses". "type" in DB is usually 'expense', 'income'. Let's check DB schema.
// No 'type' in DB schema shown in db.js, wait yes there is: "type TEXT NOT NULL"

export const agentTools = {
	sum_by_category: tool({
		description: "Get the total sum of money spent on a specific category, optionally within a specific month and year.",
		parameters: z.object({
			category: z.enum(ALL_CATEGORIES).describe("The transaction category to sum."),
			month: z.number().min(1).max(12).optional().describe("The month number (1-12) to filter by. Must be used with year."),
			year: z.number().min(2000).optional().describe("The 4-digit year to filter by. Must be used with month.")
		}),
		execute: async ({ category, month, year }) => {
			try {
				let sql = "SELECT SUM(amount) as total FROM entries WHERE category = ?";
				const params = [category];

				if (month && year) {
					// In SQLite, date is typically stored as YYYY-MM-DD or similar text.
					// We'll use SQLite's LIKE for simple matching: 'YYYY-MM-%'
					const monthStr = month.toString().padStart(2, '0');
					sql += " AND date LIKE ?";
					params.push(`${year}-${monthStr}-%`);
				}

				const result = await dbGet(sql, params);
				const total = result?.total || 0;
				return { category, total, month, year };
			} catch (error) {
				return { error: `Database error: ${error.message}` };
			}
		}
	}),

	top_expenses: tool({
		description: "Get the top N largest expense transactions, optionally filtered by month and year. Useful for finding what the largest purchases were.",
		parameters: z.object({
			limit: z.number().min(1).max(20).describe("How many top expenses to return."),
			month: z.number().min(1).max(12).optional().describe("The month number (1-12) to filter by. Must be used with year."),
			year: z.number().min(2000).optional().describe("The 4-digit year to filter by. Must be used with month.")
		}),
		execute: async ({ limit, month, year }) => {
			try {
				let sql = "SELECT id, date, note, category, amount FROM entries WHERE type = 'expense'";
				const params = [];

				if (month && year) {
					const monthStr = month.toString().padStart(2, '0');
					sql += " AND date LIKE ?";
					params.push(`${year}-${monthStr}-%`);
				}

				sql += " ORDER BY amount DESC LIMIT ?";
				params.push(limit);

				const results = await dbAll(sql, params);
				return { expenses: results, month, year };
			} catch (error) {
				return { error: `Database error: ${error.message}` };
			}
		}
	}),

	compare_months: tool({
		description: "Compare total spending between two specific months to see if spending increased or decreased.",
		parameters: z.object({
			month1: z.number().min(1).max(12).describe("The first month number (1-12) to compare."),
			year1: z.number().min(2000).describe("The first year to compare."),
			month2: z.number().min(1).max(12).describe("The second month number (1-12) to compare."),
			year2: z.number().min(2000).describe("The second year to compare.")
		}),
		execute: async ({ month1, year1, month2, year2 }) => {
			try {
				const m1Str = month1.toString().padStart(2, '0');
				const m2Str = month2.toString().padStart(2, '0');

				const result1 = await dbGet(
					"SELECT SUM(amount) as total FROM entries WHERE type = 'expense' AND date LIKE ?", 
					[`${year1}-${m1Str}-%`]
				);
				const result2 = await dbGet(
					"SELECT SUM(amount) as total FROM entries WHERE type = 'expense' AND date LIKE ?", 
					[`${year2}-${m2Str}-%`]
				);

				const total1 = result1?.total || 0;
				const total2 = result2?.total || 0;
				const difference = total2 - total1;

				return {
					month1: `${year1}-${m1Str}`,
					total1,
					month2: `${year2}-${m2Str}`,
					total2,
					difference,
					trend: difference > 0 ? "increased" : difference < 0 ? "decreased" : "same"
				};
			} catch (error) {
				return { error: `Database error: ${error.message}` };
			}
		}
	})
};
