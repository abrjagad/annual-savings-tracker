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

test.describe("Period Filter", () => {
	test("year/month filter controls work correctly", async ({ page }) => {
		await page.goto("/");

		const currentYear = String(new Date().getFullYear());

		// Year filter defaults to the current year
		const yearSelect = page.locator("#year-filter");
		await expect(yearSelect).toBeVisible();
		await expect(yearSelect).toHaveValue(currentYear);

		// Month filter is enabled when a year is selected
		const monthSelect = page.locator("#month-filter");
		await expect(monthSelect).toBeEnabled();
		await expect(monthSelect).toHaveValue("all");

		// Switching to "All Years" disables the month filter
		await yearSelect.selectOption("all");
		await expect(monthSelect).toBeDisabled();

		// Switching back to current year re-enables month filter
		await yearSelect.selectOption(currentYear);
		await expect(monthSelect).toBeEnabled();

		// Selecting a specific month works
		await monthSelect.selectOption("01");
		await expect(monthSelect).toHaveValue("01");

		// "This Year" reset button appears and resets the month
		const resetBtn = page.getByRole("button", { name: "This Year" });
		await expect(resetBtn).toBeVisible();
		await resetBtn.click();
		await expect(monthSelect).toHaveValue("all");
		await expect(yearSelect).toHaveValue(currentYear);
		// Reset button should now be hidden (already at current year + all months)
		await expect(resetBtn).not.toBeVisible();
	});
});
