const StatCard = ({ title, value, icon: Icon, colorClass }) => (
	<div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
		<div className={`p-3 rounded-xl ${colorClass}`}>
			<Icon size={24} className="text-white" />
		</div>
		<div>
			<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
				{title}
			</p>
			<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
				$
				{value.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}
			</p>
		</div>
	</div>
);

export default StatCard;
