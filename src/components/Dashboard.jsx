import { Home, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import EntryForm from "./EntryForm";
import StatCard from "./StatCard";

const Dashboard = ({
	entries,
	accounts,
	totals,
	netSavings,
	savingsRate,
	formData,
	setFormData,
	handleAddEntry,
	setActiveTab,
}) => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
			{/* Left Column: Form and Stats */}
			<div className="lg:col-span-4 space-y-6">
				{/* Entry Form */}
				<EntryForm
					formData={formData}
					setFormData={setFormData}
					accounts={accounts}
					handleAddEntry={handleAddEntry}
				/>

				{/* Account Management Summary */}
				<div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
					<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
						Accounts Tracking
					</h3>
					<div className="space-y-3">
						{accounts.map((acc) => {
							const accTotal = entries
								.filter((e) => e.account === acc)
								.reduce((sum, e) => {
									if (e.type === "INCOME") return sum + e.amount;
									return sum - e.amount;
								}, 0);
							return (
								<div
									key={acc}
									className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
								>
									<span className="text-sm font-semibold">{acc}</span>
									<span
										className={`text-sm font-bold ${accTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
									>
										${accTotal.toLocaleString()}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Right Column: Visualizations & Overview */}
			<div className="lg:col-span-8 space-y-6">
				{/* Top Stats Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<StatCard
						title="Total Income"
						value={totals.income}
						icon={TrendingUp}
						colorClass="bg-emerald-500"
					/>
					<StatCard
						title="Total Outflow"
						value={totals.expenses + totals.mortgages}
						icon={TrendingDown}
						colorClass="bg-rose-500"
					/>
				</div>

				{/* Net Savings Hero */}
				<div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
					<div className="relative z-10">
						<p className="text-indigo-100 font-medium mb-1">
							Projected Annual Savings
						</p>
						<h2 className="text-5xl font-black mb-4">
							$
							{netSavings.toLocaleString(undefined, {
								minimumFractionDigits: 2,
							})}
						</h2>
						<div className="flex items-center gap-4">
							<div className="bg-white dark:bg-slate-800/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
								<span className="text-sm font-bold">
									{savingsRate.toFixed(1)}% Savings Rate
								</span>
							</div>
							<div className="text-indigo-100 text-sm">
								Including{" "}
								<span className="font-bold text-white">
									${totals.mortgages.toLocaleString()}
								</span>{" "}
								in Mortgage payments.
							</div>
						</div>
					</div>
					{/* Decorative circles */}
					<div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white dark:bg-slate-800/10 rounded-full blur-3xl" />
					<div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
				</div>

				{/* Breakdowns */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
						<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
							<PieChart size={18} className="text-indigo-600" />
							Spending Breakdown
						</h3>
						<div className="space-y-4">
							{[
								{
									label: "General Expenses",
									val: totals.expenses,
									color: "bg-rose-400",
								},
								{
									label: "Mortgage Payments",
									val: totals.mortgages,
									color: "bg-amber-400",
								},
							].map((item) => (
								<div key={item.label}>
									<div className="flex justify-between text-sm mb-1">
										<span className="font-medium text-slate-600 dark:text-slate-400">
											{item.label}
										</span>
										<span className="font-bold">
											${item.val.toLocaleString()}
										</span>
									</div>
									<div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
										<div
											className={`h-full ${item.color}`}
											style={{
												width: `${(item.val / (totals.expenses + totals.mortgages || 1)) * 100}%`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
						<div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
							<Home className="text-indigo-600" size={32} />
						</div>
						<h3 className="font-bold text-slate-900 dark:text-slate-100">
							Mortgage Concentration
						</h3>
						<p className="text-slate-500 dark:text-slate-400 text-sm mt-1 px-4">
							Your mortgages account for{" "}
							{(
								(totals.mortgages / (totals.expenses + totals.mortgages || 1)) *
								100
							).toFixed(0)}
							% of your total spending.
						</p>
					</div>
				</div>

				{/* Recent Entries */}
				<div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
					<div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
						<h3 className="font-bold">Recent Activity</h3>
						<button
							type="button"
							onClick={() => setActiveTab("entries")}
							className="text-xs font-bold text-indigo-600 hover:underline"
						>
							View All
						</button>
					</div>
					<div className="divide-y divide-slate-50 dark:divide-slate-800">
						{entries.slice(0, 5).map((entry) => (
							<div
								key={entry.id}
								className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center ${
											entry.type === "INCOME"
												? "bg-emerald-50 text-emerald-600"
												: entry.type === "MORTGAGE"
													? "bg-amber-50 text-amber-600"
													: "bg-rose-50 text-rose-600"
										}`}
									>
										{entry.type === "INCOME" ? (
											<TrendingUp size={18} />
										) : entry.type === "MORTGAGE" ? (
											<Home size={18} />
										) : (
											<TrendingDown size={18} />
										)}
									</div>
									<div>
										<p className="text-sm font-bold text-slate-900 dark:text-slate-100">
											{entry.category}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											{entry.account} • {entry.date}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p
										className={`text-sm font-bold ${entry.type === "INCOME" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}
									>
										{entry.type === "INCOME" ? "+" : "-"}$
										{entry.amount.toLocaleString()}
									</p>
									{entry.note && (
										<p className="text-[10px] text-slate-400 italic">
											{entry.note}
										</p>
									)}
								</div>
							</div>
						))}
						{entries.length === 0 && (
							<div className="p-12 text-center text-slate-400">
								No entries yet. Start adding your transactions!
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
