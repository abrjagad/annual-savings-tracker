export const API_BASE =
	import.meta.env.VITE_API_BASE || "http://localhost:3002/api";

export const CATEGORIES = {
	INCOME: ["Salary", "Refund", "Investment", "Other Income"],
	EXPENSE: [
		"Groceries",
		"Food & Dining",
		"Fuel",
		"Insurance",
		"Subscription",
		"Transfer",
		"Bank Fee",
		"Healthcare",
		"Travel",
		"Shopping",
		"Uncategorized",
	],
	MORTGAGE: ["Principal", "Interest", "Escrow/Taxes", "Utilities"],
};
