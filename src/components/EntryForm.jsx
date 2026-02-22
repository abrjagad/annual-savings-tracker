import { DollarSign, Plus, Save } from "lucide-react";
import { CATEGORIES } from "../utils/constants";

const EntryForm = ({ formData, setFormData, accounts, handleAddEntry }) => {
	return (
		<div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
			<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
				<Plus size={18} className="text-indigo-600" />
				Add Transaction
			</h3>
			<form onSubmit={handleAddEntry} className="space-y-4">
				<div>
					<span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
						Type
					</span>
					<div className="grid grid-cols-3 gap-2">
						{["INCOME", "EXPENSE", "MORTGAGE"].map((t) => (
							<button
								key={t}
								type="button"
								onClick={() =>
									setFormData({
										...formData,
										type: t,
										category: CATEGORIES[t][0],
									})
								}
								className={`py-2 text-xs font-bold rounded-lg border transition-all ${
									formData.type === t
										? "bg-indigo-50 border-indigo-600 text-indigo-700"
										: "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"
								}`}
							>
								{t}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="amount"
							className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
						>
							Amount
						</label>
						<div className="relative">
							<DollarSign
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
							/>
							<input
								id="amount"
								type="number"
								step="0.01"
								required
								value={formData.amount}
								onChange={(e) =>
									setFormData({ ...formData, amount: e.target.value })
								}
								className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
								placeholder="0.00"
							/>
						</div>
					</div>
					<div>
						<label
							htmlFor="account"
							className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
						>
							Account
						</label>
						<select
							id="account"
							value={formData.account}
							onChange={(e) =>
								setFormData({ ...formData, account: e.target.value })
							}
							className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
						>
							{accounts.map((acc) => (
								<option key={acc} value={acc}>
									{acc}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<label
						htmlFor="category"
						className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
					>
						Category
					</label>
					<select
						id="category"
						value={formData.category}
						onChange={(e) =>
							setFormData({ ...formData, category: e.target.value })
						}
						className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
					>
						{CATEGORIES[formData.type].map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="date"
						className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
					>
						Date
					</label>
					<input
						id="date"
						type="date"
						value={formData.date}
						onChange={(e) => setFormData({ ...formData, date: e.target.value })}
						className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
					/>
				</div>

				<div>
					<label
						htmlFor="note"
						className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1"
					>
						Note (Optional)
					</label>
					<input
						id="note"
						type="text"
						value={formData.note}
						onChange={(e) => setFormData({ ...formData, note: e.target.value })}
						className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
						placeholder="Groceries, Rent, etc."
					/>
				</div>

				<button
					type="submit"
					className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
				>
					<Save size={18} />
					Add Transaction
				</button>
			</form>
		</div>
	);
};

export default EntryForm;
