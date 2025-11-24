// returns a value that should be iterated over
// chuck this in the render() function for it to work
// eg: xFrom += easeTo({ from: xFrom, to: xTo });
interface EaseToOptions {
	from?: number | null;
	to?: number | null;
	incrementer?: number;
}

const easeTo = ({ from = null, to = null, incrementer = 10 }: EaseToOptions = {}): number => {
	if (from === null || to === null) return 0;
	return (to - from) / incrementer;
};

export { easeTo };


