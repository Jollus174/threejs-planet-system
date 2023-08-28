const getRandomArbitrary = (min: number, max: number) => {
	return Math.random() * (max - min) + min;
};

const numberWithCommas = (n: number) => {
	if (!n) return;
	return n.toLocaleString();
};

export { getRandomArbitrary, numberWithCommas };
