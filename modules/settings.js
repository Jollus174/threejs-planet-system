const settings = {
	controls: {
		_dollySpeedMax: 0.95,
		_dollySpeedMin: 0.999
	},
	mouse: {
		_mouseHoverTimeoutDefault: 30, // for queueing up planet hovers
		_mouseClickTimeoutDefault: 500 // for determining whether it's a click mouse press or a held one
	},
	text: {
		_textOpacityDefault: 0,
		_fontSettings: {
			bevelEnabled: false,
			curveSegments: 4,
			bevelThickness: 2,
			bevelSize: 1.5
		}
	},
	orbitLines: {
		_orbitVisibilityCheckbox: document.querySelector('#orbit-lines'),
		_orbitVisibilityDefault: 0.06
	},
	domTarget: document.querySelector('#bg')
};

export { settings };
