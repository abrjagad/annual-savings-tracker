import { Check, FileText, Upload, X } from "lucide-react";

const ImportModal = ({
	setShowImportModal,
	accounts,
	mapping,
	setMapping,
	csvData,
	setCsvData,
	fileInputRef,
	handleFileChange,
	handleImport,
}) => {
	return (
		<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
				<div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
					<h3 className="text-xl font-bold flex items-center gap-2">
						<Upload size={20} className="text-indigo-600" />
						Import Bank File
					</h3>
					<button
						type="button"
						onClick={() => setShowImportModal(false)}
						className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
					>
						<X size={24} />
					</button>
				</div>

				<div className="p-8">
					{!csvData ? (
						<div className="space-y-6">
							<div>
								<label
									htmlFor="importAccount"
									className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2"
								>
									Select Account for Import
								</label>
								<select
									id="importAccount"
									value={mapping.account}
									onChange={(e) =>
										setMapping({ ...mapping, account: e.target.value })
									}
									className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 dark:text-slate-300 font-medium"
								>
									{accounts.map((acc) => (
										<option key={acc} value={acc}>
											{acc}
										</option>
									))}
								</select>
							</div>
							<button
								type="button"
								onClick={() => fileInputRef.current.click()}
								className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group"
							>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept=".csv,.xlsx,.xls"
									className="hidden"
								/>
								<div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
									<FileText className="text-indigo-600" size={32} />
								</div>
								<p className="font-bold text-slate-800 dark:text-slate-200">
									Click to upload bank CSV or Excel
								</p>
								<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
									Files should contain at least Date and Amount columns.
								</p>
							</button>
						</div>
					) : (
						<div className="space-y-6">
							<div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3">
								<Check size={20} />
								<span className="text-sm font-bold">
									Successfully parsed {csvData.length} rows. Please map your
									columns below:
								</span>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="dateColumn"
										className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
									>
										Date Column
									</label>
									<select
										id="dateColumn"
										value={mapping.date}
										onChange={(e) =>
											setMapping({ ...mapping, date: e.target.value })
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<option value="">Select Column</option>
										{Object.keys(csvData[0]).map((col) => (
											<option key={col} value={col}>
												{col}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="amountColumn"
										className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
									>
										Amount Column
									</label>
									<select
										id="amountColumn"
										value={mapping.amount}
										onChange={(e) =>
											setMapping({ ...mapping, amount: e.target.value })
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<option value="">Select Column</option>
										{Object.keys(csvData[0]).map((col) => (
											<option key={col} value={col}>
												{col}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="noteColumn"
										className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
									>
										Note/Description
									</label>
									<select
										id="noteColumn"
										value={mapping.note}
										onChange={(e) =>
											setMapping({ ...mapping, note: e.target.value })
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<option value="">Select Column</option>
										{Object.keys(csvData[0]).map((col) => (
											<option key={col} value={col}>
												{col}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="assignAccount"
										className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
									>
										Assign to Account
									</label>
									<select
										id="assignAccount"
										value={mapping.account}
										onChange={(e) =>
											setMapping({ ...mapping, account: e.target.value })
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
									>
										{accounts.map((acc) => (
											<option key={acc} value={acc}>
												{acc}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setCsvData(null)}
									className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 transition-all"
								>
									Reset
								</button>
								<button
									type="button"
									disabled={!mapping.date || !mapping.amount}
									onClick={handleImport}
									className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 transition-all"
								>
									Import {csvData.length} Transactions
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ImportModal;
