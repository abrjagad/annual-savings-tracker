export const parseDateValue = (val) => {
	if (val === undefined || val === null || val === "") return "";
	if (val instanceof Date) {
		return new Date(val.getTime() - val.getTimezoneOffset() * 60000)
			.toISOString()
			.split("T")[0];
	}
	const num = Number(val);
	if (
		!Number.isNaN(num) &&
		num > 30000 &&
		num < 80000 &&
		String(val).trim() !== ""
	) {
		const excelEpoch = new Date(1899, 11, 30);
		return new Date(excelEpoch.getTime() + num * 86400000)
			.toISOString()
			.split("T")[0];
	}
	if (typeof val === "string") {
		const parsed = new Date(val);
		if (!Number.isNaN(parsed) && val.trim() !== "") {
			return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
				.toISOString()
				.split("T")[0];
		}
	}
	return String(val);
};
