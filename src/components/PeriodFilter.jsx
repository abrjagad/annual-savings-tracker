const MONTHS = [
	{ value: "01", label: "January" },
	{ value: "02", label: "February" },
	{ value: "03", label: "March" },
	{ value: "04", label: "April" },
	{ value: "05", label: "May" },
	{ value: "06", label: "June" },
	{ value: "07", label: "July" },
	{ value: "08", label: "August" },
	{ value: "09", label: "September" },
	{ value: "10", label: "October" },
	{ value: "11", label: "November" },
	{ value: "12", label: "December" },
];

const PeriodFilter = ({
	availableYears,
	selectedYear,
	selectedMonth,
	onYearChange,
	onMonthChange,
	onResetToCurrentYear,
	currentYear,
}) => {
	const allYears = availableYears.includes(currentYear)
		? availableYears
		: [currentYear, ...availableYears];

	return (
		<fieldset className="flex flex-wrap items-center gap-2 border-0 p-0 m-0">
			<legend className="sr-only">Filter by period</legend>

			<div className="flex items-center gap-1.5">
				<label
					htmlFor="year-filter"
					className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
				>
					Year
				</label>
				<select
					id="year-filter"
					value={selectedYear}
					onChange={(e) => onYearChange(e.target.value)}
					className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					<option value="all">All Years</option>
					{allYears.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>
			</div>

			<div className="flex items-center gap-1.5">
				<label
					htmlFor="month-filter"
					className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
				>
					Month
				</label>
				<select
					id="month-filter"
					value={selectedMonth}
					onChange={(e) => onMonthChange(e.target.value)}
					disabled={selectedYear === "all"}
					className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<option value="all">All Months</option>
					{MONTHS.map(({ value, label }) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>

			{selectedYear !== String(currentYear) || selectedMonth !== "all" ? (
				<button
					type="button"
					onClick={onResetToCurrentYear}
					className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-1"
				>
					This Year
				</button>
			) : null}
		</fieldset>
	);
};

export default PeriodFilter;
