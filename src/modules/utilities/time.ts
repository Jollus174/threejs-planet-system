const currentDateTime = () => {
	const currDate = new Date();
	const day = currDate.getDate();
	const month = currDate.getMonth();
	const year = currDate.getFullYear();

	// const d = 367 * year - (7 * (year + (month + 9) / 12)) / 4 + (275 * month) / 9 + day - 730530; // days since 2000
	// 7981.444444444496
	const d =
		367 * year -
		(7 * (year + (month + 9) / 12)) / 4 -
		(3 * ((year + (month - 9) / 7) / 100 + 1)) / 4 +
		(275 * month) / 9 +
		day -
		730515; // days since 2000 (should work for all time)
	// 7980

	return d;
};

export { currentDateTime };
