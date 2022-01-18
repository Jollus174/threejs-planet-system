'use strict';
const getRandomArbitrary = (min, max) => {
	return Math.random() * (max - min) + min;
};

const numberWithCommas = (n) => {
	if (!n) return;
	return n.toLocaleString();
};

export { getRandomArbitrary, numberWithCommas };
