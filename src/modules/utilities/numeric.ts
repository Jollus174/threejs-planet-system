const getRandomArbitrary = (min: number, max: number): number => {
	return Math.random() * (max - min) + min;
};

const numberWithCommas = (n: number | undefined | null): string | undefined => {
	if (!n) return;
	return n.toLocaleString();
};

export { getRandomArbitrary, numberWithCommas };


