const getBreakpoint = (): string => {
	const body = document.querySelector('body');
	if (!body) return '';
	const content = window.getComputedStyle(body, '::before').getPropertyValue('content');
	return content.replace(/["']/g, '');
};

const checkIfDesktop = (): boolean => {
	return ['screen-lg', 'screen-xl'].includes(getBreakpoint());
};

const checkDOMElementOverlap = (a: DOMRect, b: DOMRect, threshold?: number): boolean => {
	const overlapThreshold = threshold || 0;
	return !(
		a.right < b.left + overlapThreshold ||
		a.left + overlapThreshold > b.right ||
		a.bottom - overlapThreshold / 2 < b.top ||
		a.top + overlapThreshold / 2 > b.bottom
	);
};

export { getBreakpoint, checkIfDesktop, checkDOMElementOverlap };
