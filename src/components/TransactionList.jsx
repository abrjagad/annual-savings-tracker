import { Download, Sparkles, Trash2, Upload } from "lucide-react";

const TransactionList = ({
	entries,
	selectedIds,
	toggleSelectAll,
	toggleSelect,
	setShowImportModal,
	handleBulkDelete,
	deleteEntry,
	handleAutoCategorize,
	isCategorizing,
}) => {
	const hasUncategorized = entries.some(
		(e) => e.category === "Uncategorized" || !e.category || e.category === "",
	);

	return (
		<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
			<div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
				<h2 className="text-xl font-bold">Transaction History</h2>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setShowImportModal(true)}
						className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-indigo-600 border border-indigo-600 rounded-lg text-white hover:bg-indigo-700"
					>
						<Upload size={14} /> Import File
					</button>
					{selectedIds.length > 0 && (
						<button
							type="button"
							onClick={handleBulkDelete}
							className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-rose-600 border border-rose-600 rounded-lg text-white hover:bg-rose-700 transition-all font-bold"
						>
							<Trash2 size={14} /> Delete Selected ({selectedIds.length})
						</button>
					)}
					{hasUncategorized && (
						<button
							type="button"
							onClick={handleAutoCategorize}
							disabled={isCategorizing}
							className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border rounded-lg transition-all ${isCategorizing ? "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed" : "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"}`}
						>
							<Sparkles
								size={14}
								className={isCategorizing ? "text-slate-400" : "text-amber-500"}
							/>
							{isCategorizing ? "Categorizing..." : "Auto Categorize"}
						</button>
					)}
					<button
						type="button"
						onClick={() => {
							const dataStr =
								"data:text/json;charset=utf-8," +
								encodeURIComponent(JSON.stringify(entries));
							const downloadAnchorNode = document.createElement("a");
							downloadAnchorNode.setAttribute("href", dataStr);
							downloadAnchorNode.setAttribute("download", "savings_data.json");
							document.body.appendChild(downloadAnchorNode);
							downloadAnchorNode.click();
							downloadAnchorNode.remove();
						}}
						className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700"
					>
						<Download size={14} /> Export JSON
					</button>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						<tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100 dark:border-slate-700">
							<th className="px-6 py-4 w-10">
								<input
									type="checkbox"
									checked={
										entries.length > 0 && selectedIds.length === entries.length
									}
									onChange={toggleSelectAll}
									className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
								/>
							</th>
							<th className="px-6 py-4">Date</th>
							<th className="px-6 py-4">Account</th>
							<th className="px-6 py-4">Type</th>
							<th className="px-6 py-4">Category</th>
							<th className="px-6 py-4">Notes</th>
							<th className="px-6 py-4 text-right">Amount</th>
							<th className="px-6 py-4 text-center">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{entries.map((entry) => (
							<tr
								key={entry.id}
								className={`hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 transition-colors group ${selectedIds.includes(entry.id) ? "bg-indigo-50/50" : ""}`}
							>
								<td className="px-6 py-4">
									<input
										type="checkbox"
										checked={selectedIds.includes(entry.id)}
										onChange={() => toggleSelect(entry.id)}
										className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
									/>
								</td>
								<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
									{entry.date}
								</td>
								<td className="px-6 py-4">
									<span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
										{entry.account}
									</span>
								</td>
								<td className="px-6 py-4">
									<span
										className={`text-[10px] font-black px-2 py-1 rounded-md ${
											entry.type === "INCOME"
												? "bg-emerald-100 text-emerald-700"
												: entry.type === "MORTGAGE"
													? "bg-amber-100 text-amber-700"
													: "bg-rose-100 text-rose-700"
										}`}
									>
										{entry.type}
									</span>
								</td>
								<td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
									{entry.category}
								</td>
								<td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
									{entry.note || "-"}
								</td>
								<td
									className={`px-6 py-4 text-sm font-bold text-right ${entry.type === "INCOME" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}
								>
									{entry.type === "INCOME" ? "+" : "-"}$
									{entry.amount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</td>
								<td className="px-6 py-4 text-center">
									<button
										type="button"
										onClick={() => deleteEntry(entry.id)}
										className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
									>
										<Trash2 size={16} />
									</button>
								</td>
							</tr>
						))}
						{entries.length === 0 && (
							<tr>
								<td
									colSpan="8"
									className="px-6 py-20 text-center text-slate-400 font-medium"
								>
									Your transaction list is empty.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TransactionList;
