/**
 * Single source of truth for transaction categories.
 * Imported by both the frontend (via constants.js) and the backend (server/index.js).
 */

export const CATEGORIES = {
	INCOME: ["Salary", "Bonus", "Refund", "Investment", "Gift", "Other Income"],
	EXPENSE: [
		"Groceries",
		"Food & Dining",
		"Fuel",
		"Transport",
		"Utilities",
		"Insurance",
		"Subscription",
		"Entertainment",
		"Shopping",
		"Healthcare",
		"Travel",
		"Transfer",
		"Bank Fee",
		"Other Expense",
		"Uncategorized",
	],
	MORTGAGE: ["Principal", "Interest", "Escrow/Taxes", "Utilities"],
};

/** Flat array of every category — useful for z.enum() in the backend schema. */
export const ALL_CATEGORIES = [
	...CATEGORIES.INCOME,
	...CATEGORIES.EXPENSE,
	...CATEGORIES.MORTGAGE,
];
