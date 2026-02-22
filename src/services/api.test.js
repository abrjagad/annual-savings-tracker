import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";

const API_BASE = "http://localhost:3002/api";

describe("API Service", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	it("fetchEntries should call fetch with correct URL", async () => {
		const mockEntries = [{ id: 1, amount: 10 }];
		fetch.mockResolvedValue({
			json: () => Promise.resolve(mockEntries),
		});

		const result = await api.fetchEntries();
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries`);
		expect(result).toEqual(mockEntries);
	});

	it("fetchAccounts should call fetch with correct URL", async () => {
		const mockAccounts = ["Main", "Joint"];
		fetch.mockResolvedValue({
			json: () => Promise.resolve(mockAccounts),
		});

		const result = await api.fetchAccounts();
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/accounts`);
		expect(result).toEqual(mockAccounts);
	});

	it("addEntry should call fetch with POST method and body", async () => {
		const entry = { amount: 100, category: "Food" };
		fetch.mockResolvedValue({
			json: () => Promise.resolve({ id: 1, ...entry }),
		});

		const result = await api.addEntry(entry);
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(entry),
		});
		expect(result).toEqual({ id: 1, ...entry });
	});

	it("deleteEntry should call fetch with DELETE method", async () => {
		fetch.mockResolvedValue({ ok: true });

		const result = await api.deleteEntry(1);
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries/1`, {
			method: "DELETE",
		});
		expect(result).toBe(true);
	});

	it("deleteEntry should throw error if response not ok", async () => {
		fetch.mockResolvedValue({ ok: false });
		await expect(api.deleteEntry(1)).rejects.toThrow("Failed to delete entry");
	});

	it("bulkDeleteEntries should call fetch with POST method and ids", async () => {
		fetch.mockResolvedValue({ ok: true });

		const ids = [1, 2, 3];
		const result = await api.bulkDeleteEntries(ids);
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries/bulk-delete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ids }),
		});
		expect(result).toBe(true);
	});

	it("addAccount should call fetch with POST method and name", async () => {
		const name = "New Account";
		fetch.mockResolvedValue({
			json: () => Promise.resolve({ id: 1, name }),
		});

		const result = await api.addAccount(name);
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/accounts`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});
		expect(result).toEqual({ id: 1, name });
	});

	it("bulkAddEntries should call fetch with POST method and entries", async () => {
		const entries = [{ amount: 10 }, { amount: 20 }];
		fetch.mockResolvedValue({
			json: () => Promise.resolve({ message: "Success" }),
		});

		const result = await api.bulkAddEntries(entries);
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries/bulk`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(entries),
		});
		expect(result).toEqual({ message: "Success" });
	});

	it("categorizeEntries should call fetch with POST method", async () => {
		fetch.mockResolvedValue({
			json: () => Promise.resolve({ message: "Done" }),
		});

		const result = await api.categorizeEntries();
		expect(fetch).toHaveBeenCalledWith(`${API_BASE}/entries/categorize`, {
			method: "POST",
		});
		expect(result).toEqual({ message: "Done" });
	});
});
