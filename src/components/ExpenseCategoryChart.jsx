import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { updateEntryCategory } from "../services/api";
import { CATEGORIES } from "../utils/constants";

const COLORS = [
	"#6366f1", // indigo-500
	"#8b5cf6", // violet-500
	"#ec4899", // pink-500
	"#f43f5e", // rose-500
	"#f97316", // orange-500
	"#eab308", // yellow-500
	"#10b981", // emerald-500
	"#06b6d4", // cyan-500
	"#3b82f6", // blue-500
	"#84cc16", // lime-500
];

const ALL_EXPENSE_CATEGORIES = CATEGORIES.EXPENSE || [];

const ExpenseCategoryChart = ({ entries, onEntryUpdated }) => {
	const [chartType, setChartType] = useState("pie");
	const [topN, setTopN] = useState(5);
	const [sortOrder, setSortOrder] = useState("amount"); // "amount" | "az"
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [editingId, setEditingId] = useState(null);

	// 1. Filter EXPENSE entries only
	const expenses = useMemo(
		() => entries.filter((e) => e.type === "EXPENSE"),
		[entries],
	);

	const totalExpenses = useMemo(
		() => expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
		[expenses],
	);

	// 2. Aggregate by category with count
	const aggregated = useMemo(() => {
		const map = {};
		for (const e of expenses) {
			const cat = e.category || "Uncategorized";
			if (!map[cat]) map[cat] = { value: 0, count: 0 };
			map[cat].value += parseFloat(e.amount) || 0;
			map[cat].count += 1;
		}
		return Object.entries(map)
			.map(([name, { value, count }]) => ({ name, value, count }))
			.filter((item) => item.value > 0);
	}, [expenses]);

	// 3. Sort
	const sorted = useMemo(() => {
		const copy = [...aggregated];
		if (sortOrder === "az") copy.sort((a, b) => a.name.localeCompare(b.name));
		else copy.sort((a, b) => b.value - a.value);
		return copy;
	}, [aggregated, sortOrder]);

	// 4. Top N bucketing
	const topNNames = useMemo(
		() =>
			new Set(
				sorted
					.slice(0, Number.isFinite(topN) ? topN : sorted.length)
					.map((d) => d.name),
			),
		[sorted, topN],
	);

	const chartData = useMemo(() => {
		if (!Number.isFinite(topN) || sorted.length <= topN) return sorted;
		const top = sorted.slice(0, topN);
		const rest = sorted.slice(topN);
		const otherValue = rest.reduce((s, i) => s + i.value, 0);
		const otherCount = rest.reduce((s, i) => s + i.count, 0);
		if (otherValue > 0)
			top.push({ name: "Other", value: otherValue, count: otherCount });
		return top;
	}, [sorted, topN]);

	// 5. % share
	const dataWithShare = useMemo(
		() =>
			chartData.map((item) => ({
				...item,
				share: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0,
			})),
		[chartData, totalExpenses],
	);

	// 6. Drill-down transactions
	const drilldownTransactions = useMemo(() => {
		if (!selectedCategory) return [];
		return expenses
			.filter((e) => {
				const cat = e.category || "Uncategorized";
				if (selectedCategory === "Other") return !topNNames.has(cat);
				return cat === selectedCategory;
			})
			.sort((a, b) => new Date(b.date) - new Date(a.date));
	}, [selectedCategory, expenses, topNNames]);

	// 7. Sparkline data — last 6 months spend for selected category
	const sparklineData = useMemo(() => {
		if (!selectedCategory) return [];
		const now = new Date();
		const months = [];
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			months.push({
				key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
				label: d.toLocaleString("default", { month: "short" }),
			});
		}

		// All entries (not just filtered ones) — we want the full 6-month window
		const relevant = entries.filter((e) => {
			if (e.type !== "EXPENSE") return false;
			const cat = e.category || "Uncategorized";
			if (selectedCategory === "Other") return !topNNames.has(cat);
			return cat === selectedCategory;
		});

		return months.map(({ key, label }) => {
			const total = relevant
				.filter((e) => e.date?.startsWith(key))
				.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
			return { month: label, amount: total };
		});
	}, [selectedCategory, entries, topNNames]);

	// --- Handlers ---
	const handlePieClick = (data) => {
		if (!data?.name) return;
		setSelectedCategory((prev) => (prev === data.name ? null : data.name));
		setEditingId(null);
	};
	const handleBarClick = (data) => {
		if (!data?.activeLabel) return;
		setSelectedCategory((prev) =>
			prev === data.activeLabel ? null : data.activeLabel,
		);
		setEditingId(null);
	};

	const handleCategoryChange = async (entryId, newCategory) => {
		try {
			await updateEntryCategory(entryId, newCategory);
			if (onEntryUpdated) onEntryUpdated();
		} catch (err) {
			console.error("Failed to update category:", err);
		} finally {
			setEditingId(null);
		}
	};

	// --- Custom tooltip ---
	const CustomTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			const d = payload[0];
			const name = d.payload?.name ?? d.name;
			const value = d.value;
			const count = d.payload?.count ?? 0;
			const pct =
				totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0.0";
			return (
				<div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-lg">
					<p className="font-bold text-slate-900 dark:text-gray-100 mb-1">
						{name}
					</p>
					<p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
						$
						{value.toLocaleString(undefined, {
							minimumFractionDigits: 2,
						})}
					</p>
					<p className="text-xs text-slate-400 mt-0.5">
						{pct}% · {count} transaction{count !== 1 ? "s" : ""}
					</p>
				</div>
			);
		}
		return null;
	};

	// Render % label inside pie slices
	const renderPieLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}) => {
		if (percent < 0.04) return null;
		const RADIAN = Math.PI / 180;
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);
		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor="middle"
				dominantBaseline="central"
				fontSize={11}
				fontWeight="bold"
			>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	// --- Custom legend showing count badges ---
	const renderLegend = (props) => {
		const { payload } = props;
		return (
			<ul className="space-y-1.5 text-xs">
				{payload.map((entry) => {
					const item = dataWithShare.find((d) => d.name === entry.value);
					return (
						<li key={entry.value} className="flex items-center gap-1.5">
							<span
								className="w-2.5 h-2.5 rounded-full shrink-0"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-slate-700 dark:text-slate-300 truncate">
								{entry.value}
							</span>
							{item && (
								<span className="text-slate-400 shrink-0">
									({item.count})
								</span>
							)}
						</li>
					);
				})}
			</ul>
		);
	};

	if (chartData.length === 0) {
		return (
			<div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
				No categorized expenses found.
			</div>
		);
	}

	return (
		<div>
			{/* Controls */}
			<div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
				{/* Chart type toggle */}
				<fieldset className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border-0 m-0">
					<legend className="sr-only">Chart type</legend>
					{["pie", "bar"].map((type) => (
						<button
							key={type}
							type="button"
							onClick={() => setChartType(type)}
							aria-pressed={chartType === type}
							className={`px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
								chartType === type
									? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
									: "text-slate-500 dark:text-slate-400"
							}`}
						>
							{type}
						</button>
					))}
				</fieldset>

				<div className="flex items-center gap-3">
					{/* Sort toggle */}
					<fieldset className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border-0 m-0">
						<legend className="sr-only">Sort order</legend>
						<button
							type="button"
							onClick={() => setSortOrder("amount")}
							aria-pressed={sortOrder === "amount"}
							className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
								sortOrder === "amount"
									? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
									: "text-slate-500 dark:text-slate-400"
							}`}
						>
							Amount ↓
						</button>
						<button
							type="button"
							onClick={() => setSortOrder("az")}
							aria-pressed={sortOrder === "az"}
							className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
								sortOrder === "az"
									? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
									: "text-slate-500 dark:text-slate-400"
							}`}
						>
							A–Z
						</button>
					</fieldset>

					{/* Top N picker */}
					<div className="flex items-center gap-1.5">
						<label
							htmlFor="top-n-filter"
							className="text-xs font-semibold text-slate-500 dark:text-slate-400"
						>
							Show
						</label>
						<select
							id="top-n-filter"
							value={Number.isFinite(topN) ? topN : "all"}
							onChange={(e) => {
								setTopN(
									e.target.value === "all"
										? Number.POSITIVE_INFINITY
										: Number(e.target.value),
								);
								setSelectedCategory(null);
							}}
							className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value={5}>Top 5</option>
							<option value={10}>Top 10</option>
							<option value="all">All</option>
						</select>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="h-80 w-full">
				<ResponsiveContainer width="100%" height="100%">
					{chartType === "pie" ? (
						<PieChart>
							<Pie
								data={dataWithShare}
								cx="50%"
								cy="50%"
								innerRadius={70}
								outerRadius={110}
								paddingAngle={3}
								dataKey="value"
								stroke="none"
								labelLine={false}
								label={renderPieLabel}
								onClick={handlePieClick}
								style={{ cursor: "pointer" }}
							>
								{dataWithShare.map((entry, index) => (
									<Cell
										key={`cell-${entry.name}`}
										fill={COLORS[index % COLORS.length]}
										opacity={
											selectedCategory && selectedCategory !== entry.name
												? 0.35
												: 1
										}
									/>
								))}
							</Pie>
							<Tooltip content={<CustomTooltip />} />
							<Legend
								layout="vertical"
								verticalAlign="middle"
								align="right"
								content={renderLegend}
							/>
						</PieChart>
					) : (
						<BarChart
							data={dataWithShare}
							margin={{ top: 20, right: 8, left: 8, bottom: 56 }}
							onClick={handleBarClick}
							style={{ cursor: "pointer" }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis
								dataKey="name"
								tick={{ fontSize: 11 }}
								angle={-35}
								textAnchor="end"
								interval={0}
							/>
							<YAxis
								tickFormatter={(v) =>
									`$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
								}
								tick={{ fontSize: 11 }}
								width={48}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Bar dataKey="value" radius={[4, 4, 0, 0]}>
								{dataWithShare.map((entry, index) => (
									<Cell
										key={`bar-${entry.name}`}
										fill={COLORS[index % COLORS.length]}
										opacity={
											selectedCategory && selectedCategory !== entry.name
												? 0.3
												: 1
										}
									/>
								))}
								<LabelList
									dataKey="share"
									position="top"
									formatter={(v) => `${v.toFixed(0)}%`}
									style={{ fontSize: "10px", fontWeight: 600 }}
								/>
							</Bar>
						</BarChart>
					)}
				</ResponsiveContainer>
			</div>

			{/* Drill-down panel */}
			{selectedCategory && (
				<section
					aria-label={`${selectedCategory} transactions`}
					className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-4"
				>
					<div className="flex items-start justify-between mb-3">
						<div>
							<h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
								{selectedCategory}
							</h4>
							<p className="text-xs text-slate-400 mt-0.5">
								{drilldownTransactions.length} transaction
								{drilldownTransactions.length !== 1 ? "s" : ""} ·{" "}
								<span className="font-semibold text-rose-500">
									$
									{drilldownTransactions
										.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
										.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</span>
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setSelectedCategory(null);
								setEditingId(null);
							}}
							className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
							aria-label="Close drill-down"
						>
							✕ Close
						</button>
					</div>

					{/* Sparkline: 6-month trend */}
					{sparklineData.length > 0 && (
						<div className="mb-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
							<p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
								6-Month Trend
							</p>
							<div className="h-16 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={sparklineData}>
										<XAxis
											dataKey="month"
											tick={{ fontSize: 9 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis hide domain={[0, "auto"]} />
										<Tooltip
											formatter={(v) => [
												`$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
												"Spent",
											]}
											contentStyle={{
												fontSize: "11px",
												borderRadius: "8px",
												border: "none",
											}}
										/>
										<Line
											type="monotone"
											dataKey="amount"
											stroke="#6366f1"
											strokeWidth={2}
											dot={{ r: 3 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
					)}

					{/* Transaction list */}
					<ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
						{drilldownTransactions.map((t) => (
							<li
								key={t.id}
								className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
							>
								<div className="min-w-0 mr-3 flex-1">
									<p className="font-medium text-slate-800 dark:text-slate-100 truncate">
										{t.note || "—"}
									</p>
									<p className="text-xs text-slate-400 mt-0.5">
										{t.date} · {t.account}
									</p>
									{/* Quick edit category */}
									<div className="mt-1">
										{editingId === t.id ? (
											<select
												defaultValue={t.category || "Uncategorized"}
												onChange={(e) =>
													handleCategoryChange(t.id, e.target.value)
												}
												onBlur={() => setEditingId(null)}
												className="text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
												aria-label={`Change category for ${t.note || "transaction"}`}
											>
												{ALL_EXPENSE_CATEGORIES.map((cat) => (
													<option key={cat} value={cat}>
														{cat}
													</option>
												))}
											</select>
										) : (
											<button
												type="button"
												onClick={() => setEditingId(t.id)}
												className="text-[10px] text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline"
												aria-label={`Edit category for ${t.note || "transaction"}`}
											>
												✏ {t.category || "Uncategorized"}
											</button>
										)}
									</div>
								</div>
								<span className="font-bold text-rose-500 shrink-0">
									-$
									{parseFloat(t.amount).toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
};

export default ExpenseCategoryChart;
