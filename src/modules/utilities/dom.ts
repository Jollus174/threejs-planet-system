const getBreakpoint = () =>
	window.getComputedStyle(document.body, '::before').getPropertyValue('content').replace(/["']/g, '');

const checkIfDesktop = () => ['screen-lg', 'screen-xl'].includes(getBreakpoint());

const checkDOMElementOverlap = (a: DOMRect, b: DOMRect, threshold: number) => {
	const overlapThreshold = threshold || 0;
	return !(
		a.right < b.left + overlapThreshold ||
		a.left + overlapThreshold > b.right ||
		a.bottom - overlapThreshold / 2 < b.top ||
		a.top + overlapThreshold / 2 > b.bottom
	);
};

export { getBreakpoint, checkIfDesktop, checkDOMElementOverlap };
