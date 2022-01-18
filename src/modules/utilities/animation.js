'use strict';
// returns a value that we should iterate over
// chuck this in the render() function for it to work
// eg: xFrom += easeTo({ from: xFrom, to: xTo });
const easeTo = ({ from = null, to = null, incrementer = 10 } = {}) => {
	return (to - from) / incrementer;
};

export { easeTo };
