import { API_BASE } from "../utils/constants";

export const fetchEntries = async () => {
	const res = await fetch(`${API_BASE}/entries`);
	return await res.json();
};

export const fetchAccounts = async () => {
	const res = await fetch(`${API_BASE}/accounts`);
	return await res.json();
};

export const addEntry = async (entry) => {
	const res = await fetch(`${API_BASE}/entries`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(entry),
	});
	return await res.json();
};

export const deleteEntry = async (id) => {
	const res = await fetch(`${API_BASE}/entries/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error("Failed to delete entry");
	return true;
};

export const bulkDeleteEntries = async (ids) => {
	const res = await fetch(`${API_BASE}/entries/bulk-delete`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ids }),
	});
	if (!res.ok) throw new Error("Failed to perform bulk delete");
	return true;
};

export const addAccount = async (name) => {
	const res = await fetch(`${API_BASE}/accounts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return await res.json();
};

export const bulkAddEntries = async (entries) => {
	const res = await fetch(`${API_BASE}/entries/bulk`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(entries),
	});
	return await res.json();
};

export const categorizeEntries = async () => {
	const res = await fetch(`${API_BASE}/entries/categorize`, {
		method: "POST",
	});
	return await res.json();
};

export const updateEntryCategory = async (id, category) => {
	const res = await fetch(`${API_BASE}/entries/${id}/category`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ category }),
	});
	if (!res.ok) throw new Error("Failed to update category");
	return await res.json();
};
