// returns a value that should be iterated over
// chuck this in the render() function for it to work
// eg: xFrom += easeTo({ from: xFrom, to: xTo });
const easeTo = ({ from = 0, to = 0, incrementer = 10 } = {}) => {
	return (to - from) / incrementer;
};

export { easeTo };
