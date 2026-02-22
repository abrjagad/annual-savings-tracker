import { expect, test } from "@playwright/test";

test.describe("App Integration", () => {
	test("loads dashboard and adds a transaction", async ({ page }) => {
		// Navigate to the app
		await page.goto("/");

		// Check title/header
		await expect(
			page.getByRole("heading", { name: /Annual Savings Tracker/i }),
		).toBeVisible();

		// Verify Dashboard tab is active
		await expect(page.getByRole("button", { name: "Dashboard" })).toHaveClass(
			/bg-indigo-600/,
		);

		// Initial check for 'Add Transaction' heading
		await expect(
			page.getByRole("heading", { name: /Add Transaction/i }),
		).toBeVisible();

		// Fill the transaction form
		// Amount
		await page.getByPlaceholder("0.00").fill("150.75");

		// Select Account (e.g., Main Account)
		await page.locator("select").first().selectOption("Main Account");

		// Category
		await page.locator("select").nth(1).selectOption("Groceries");

		// Note
		const uniqueNote = `Groceries for the week ${Date.now()}`;
		await page.getByPlaceholder("Groceries, Rent, etc.").fill(uniqueNote);

		// Submit form
		await page.getByRole("button", { name: "Add Transaction" }).click();

		// The transaction should appear in Recent Activity
		await expect(page.getByText(uniqueNote)).toBeVisible();

		// Check if the amount -150.75 (Expense) is visible
		await expect(page.getByText("-$150.75").first()).toBeVisible();
	});
});
