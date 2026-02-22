import { Moon, Sun, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Dashboard from "./components/Dashboard";
import ImportModal from "./components/ImportModal";
import TransactionList from "./components/TransactionList";
import {
	addAccount as apiAddAccount,
	addEntry as apiAddEntry,
	deleteEntry as apiDeleteEntry,
	bulkAddEntries,
	bulkDeleteEntries,
	categorizeEntries,
	fetchAccounts,
	fetchEntries,
} from "./services/api";
import { parseDateValue } from "./utils/dateUtils";

const App = () => {
	// --- State Management ---
	const [entries, setEntries] = useState([]);
	const [accounts, setAccounts] = useState(["Main Account", "Joint Account"]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCategorizing, setIsCategorizing] = useState(false);

	const [formData, setFormData] = useState({
		type: "EXPENSE",
		category: "",
		amount: "",
		account: "Main Account",
		date: new Date().toISOString().split("T")[0],
		note: "",
	});

	const [theme, setTheme] = useState(() => {
		return localStorage.getItem("theme") || "light";
	});

	useEffect(() => {
		const root = window.document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);

	const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, entries, settings
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedIds, setSelectedIds] = useState([]);

	// --- Data Fetching ---
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [entriesData, accountsData] = await Promise.all([
					fetchEntries(),
					fetchAccounts(),
				]);

				setEntries(entriesData);
				if (accountsData.length > 0) setAccounts(accountsData);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// --- Calculations ---
	const totals = useMemo(() => {
		return entries.reduce(
			(acc, curr) => {
				const amt = parseFloat(curr.amount) || 0;
				if (curr.type === "INCOME") acc.income += amt;
				else if (curr.type === "EXPENSE") acc.expenses += amt;
				else if (curr.type === "MORTGAGE") acc.mortgages += amt;
				return acc;
			},
			{ income: 0, expenses: 0, mortgages: 0 },
		);
	}, [entries]);

	const netSavings = totals.income - totals.expenses - totals.mortgages;
	const savingsRate =
		totals.income > 0 ? (netSavings / totals.income) * 100 : 0;

	// --- Handlers ---
	const handleAddEntry = async (e) => {
		e.preventDefault();
		if (!formData.amount || parseFloat(formData.amount) <= 0) return;

		const entry = {
			...formData,
			amount: parseFloat(formData.amount),
		};

		try {
			const newEntry = await apiAddEntry(entry);
			setEntries([newEntry, ...entries]);
			setFormData({ ...formData, amount: "", note: "" });
		} catch (error) {
			console.error("Error adding entry:", error);
		}
	};

	const deleteEntry = async (id) => {
		try {
			await apiDeleteEntry(id);
			setEntries(entries.filter((e) => e.id !== id));
			setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
		} catch (error) {
			console.error("Error deleting entry:", error);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedIds.length === 0) return;
		if (
			!confirm(
				`Are you sure you want to delete ${selectedIds.length} transactions?`,
			)
		)
			return;

		try {
			await bulkDeleteEntries(selectedIds);
			setEntries(entries.filter((e) => !selectedIds.includes(e.id)));
			setSelectedIds([]);
		} catch (error) {
			console.error("Error performing bulk delete:", error);
		}
	};

	const toggleSelect = (id) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		);
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === entries.length && entries.length > 0) {
			setSelectedIds([]);
		} else {
			setSelectedIds(entries.map((e) => e.id));
		}
	};

	const _addAccount = async (name) => {
		if (name && !accounts.includes(name)) {
			try {
				const newAcc = await apiAddAccount(name);
				setAccounts([...accounts, newAcc.name]);
			} catch (error) {
				console.error("Error adding account:", error);
			}
		}
	};

	const handleAutoCategorize = async () => {
		setIsCategorizing(true);
		try {
			const data = await categorizeEntries();
			if (data.categorizedCount > 0) {
				const updatedEntries = await fetchEntries();
				setEntries(updatedEntries);
				alert(`Successfully categorized ${data.categorizedCount} entries!`);
			} else {
				alert("No uncategorized entries found or AI categorization failed.");
			}
		} catch (error) {
			console.error("Error during auto-categorization:", error);
			alert("An error occurred during auto-categorization.");
		} finally {
			setIsCategorizing(false);
		}
	};

	// --- CSV Import ---
	const [csvData, setCsvData] = useState(null);
	const [mapping, setMapping] = useState({
		date: "",
		amount: "",
		note: "",
		account: accounts[0],
	});
	const fileInputRef = useRef();

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
		const firstSheetName = workbook.SheetNames[0];
		const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
			header: 1,
		});

		// Filter out empty rows
		const data = rawData.filter(
			(row) =>
				row.length > 0 &&
				row.some((cell) => cell !== undefined && cell !== null && cell !== ""),
		);
		if (data.length === 0) return;

		const firstRowStr = data[0].map(String).join(" ").toLowerCase();
		const hasHeaderMarkers = [
			"date",
			"amount",
			"desc",
			"value",
			"transaction",
			"memo",
			"credit",
			"debit",
		].some((h) => firstRowStr.includes(h));

		if (!hasHeaderMarkers && data[0].length >= 5) {
			// Assume 5-column format: Date, Description, Debit, Credit, Balance
			const parsedData = data.map((row) => {
				const debit =
					parseFloat(String(row[2] || "0").replace(/[^0-9.-]+/g, "")) || 0;
				const credit =
					parseFloat(String(row[3] || "0").replace(/[^0-9.-]+/g, "")) || 0;
				const amount = credit > 0 ? credit : -debit;

				return {
					Date: parseDateValue(row[0]),
					Description: String(row[1] || ""),
					Amount: amount,
					Debit: debit,
					Credit: credit,
					Balance: row[4],
				};
			});
			setCsvData(parsedData);
			setMapping({
				...mapping,
				date: "Date",
				amount: "Amount",
				note: "Description",
			});
		} else {
			const headers = hasHeaderMarkers
				? data[0].map(String)
				: data[0].map((_, i) => `Column ${i + 1}`);
			const rows = hasHeaderMarkers ? data.slice(1) : data;

			const parsedData = rows.map((row) => {
				const obj = {};
				headers.forEach((h, i) => {
					let val = row[i];
					if (h.toLowerCase().includes("date")) {
						val = parseDateValue(val);
					} else if (val instanceof Date) {
						val = parseDateValue(val);
					}
					obj[h] = val;
				});
				return obj;
			});

			setCsvData(parsedData);

			const newMapping = { ...mapping };
			headers.forEach((col) => {
				const lower = col.toLowerCase();
				if (lower.includes("date")) newMapping.date = col;
				if (lower.includes("amount") || lower.includes("value"))
					newMapping.amount = col;
				if (
					lower.includes("desc") ||
					lower.includes("note") ||
					lower.includes("memo")
				)
					newMapping.note = col;
			});
			setMapping(newMapping);
		}
	};

	const handleImport = async () => {
		if (!csvData || !mapping.date || !mapping.amount) return;

		const processedEntries = csvData.map((row) => {
			const amountStr = String(row[mapping.amount] || "0").replace(
				/[^0-9.-]+/g,
				"",
			);
			const amount = parseFloat(amountStr) || 0;
			const formattedDate =
				parseDateValue(row[mapping.date]) ||
				new Date().toISOString().split("T")[0];
			return {
				type: amount >= 0 ? "INCOME" : "EXPENSE",
				category: "",
				amount: Math.abs(amount),
				account: mapping.account,
				date: formattedDate,
				note: row[mapping.note] || "",
			};
		});

		try {
			await bulkAddEntries(processedEntries);
			const data = await fetchEntries();
			setEntries(data);
			setShowImportModal(false);
			setCsvData(null);
		} catch (error) {
			console.error("Error importing CSV:", error);
		}
	};

	if (isLoading)
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
				Loading your finances...
			</div>
		);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 transition-colors duration-200">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
					<div>
						<h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
							<Wallet className="text-indigo-600 dark:text-indigo-400" />
							Annual Savings Tracker
						</h1>
						<p className="text-slate-500 dark:text-slate-400">
							Track your income, expenses, and mortgage with real database
							persistence.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
							aria-label="Toggle Theme"
						>
							{theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
						</button>
						<div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
							<button
								type="button"
								onClick={() => setActiveTab("dashboard")}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
							>
								Dashboard
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("entries")}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "entries" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
							>
								All Transactions
							</button>
						</div>
					</div>
				</header>

				{activeTab === "dashboard" ? (
					<Dashboard
						entries={entries}
						accounts={accounts}
						totals={totals}
						netSavings={netSavings}
						savingsRate={savingsRate}
						formData={formData}
						setFormData={setFormData}
						handleAddEntry={handleAddEntry}
						setActiveTab={setActiveTab}
					/>
				) : (
					<TransactionList
						entries={entries}
						selectedIds={selectedIds}
						toggleSelectAll={toggleSelectAll}
						toggleSelect={toggleSelect}
						setShowImportModal={setShowImportModal}
						handleBulkDelete={handleBulkDelete}
						deleteEntry={deleteEntry}
						handleAutoCategorize={handleAutoCategorize}
						isCategorizing={isCategorizing}
					/>
				)}
			</div>

			{/* Import Modal */}
			{showImportModal && (
				<ImportModal
					setShowImportModal={setShowImportModal}
					accounts={accounts}
					mapping={mapping}
					setMapping={setMapping}
					csvData={csvData}
					setCsvData={setCsvData}
					fileInputRef={fileInputRef}
					handleFileChange={handleFileChange}
					handleImport={handleImport}
				/>
			)}
		</div>
	);
};

export default App;
