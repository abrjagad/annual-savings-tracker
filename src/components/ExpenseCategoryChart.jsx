import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

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

const ExpenseCategoryChart = ({ entries }) => {
	// 1. Filter only general expenses (not MUST be income/mortgage, usually "EXPENSE")
	const expenses = entries.filter((e) => e.type === "EXPENSE");

	// 2. Aggregate amounts by category
	const aggregatedData = expenses.reduce((acc, curr) => {
		const category = curr.category || "Uncategorized";
		const amount = parseFloat(curr.amount) || 0;

		if (acc[category]) {
			acc[category] += amount;
		} else {
			acc[category] = amount;
		}
		return acc;
	}, {});

	// 3. Convert object to array and sort descending by value
	const chartData = Object.entries(aggregatedData)
		.map(([name, value]) => ({
			name,
			value,
		}))
		.filter((item) => item.value > 0)
		.sort((a, b) => b.value - a.value);

	if (chartData.length === 0) {
		return (
			<div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
				No categorized expenses found.
			</div>
		);
	}

	const CustomTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-lg">
					<p className="font-bold text-slate-900 dark:text-gray-100 mb-1">
						{payload[0].name}
					</p>
					<p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
						$
						{payload[0].value.toLocaleString(undefined, {
							minimumFractionDigits: 2,
						})}
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<div className="h-80 w-full mt-4">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						innerRadius={80}
						outerRadius={110}
						paddingAngle={5}
						dataKey="value"
						stroke="none"
					>
						{chartData.map((_, index) => (
							<Cell
								key={`cell-${
									// biome-ignore lint/suspicious/noArrayIndexKey: it's perfectly fine here
									index
								}`}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip content={<CustomTooltip />} />
					<Legend
						layout="vertical"
						verticalAlign="middle"
						align="right"
						wrapperStyle={{
							fontSize: "12px",
							fontFamily: "inherit",
							color: "inherit",
						}}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
};

export default ExpenseCategoryChart;
