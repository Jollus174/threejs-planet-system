const settings = {
	camera: {
		_fov: 55,
		_aspect: window.innerWidth / window.innerHeight,
		_near: 300,
		_far: 1000000000000
	},
	controls: {
		_minDistance: 0.1,
		_maxDistance: 100000000000,
		_enableDamping: true,
		_dampingFactor: 0.05,
		_enableKeys: true,
		_minPolarAngle: 0.5,
		_maxPolarAngle: 2.5,

		_dollySpeedMax: 0.93,
		_dollySpeedMin: 0.999
	},
	mouse: {
		_mouseHoverTimeoutDefault: 5, // for queueing up planet hovers
		_mouseClickTimeoutDefault: 500 // for determining whether it's a click mouse press or a held one
	},
	text: {
		_textOpacityDefault: 0,
		_fontSettings: {
			bevelEnabled: false,
			curveSegments: 4,
			bevelThickness: 2,
			bevelSize: 1.5,
			height: 0
		}
	},
	orbitLines: {
		_orbitVisibilityCheckbox: document.querySelector('#orbit-lines')
	},
	domTarget: document.querySelector('#bg'),
	planetColours: {
		default: '#8c8c8b',
		sun: '#ffb01f',
		mercury: '#b78668',
		venus: '#f3b3b3',
		earth: '#6dcbe7',
		mars: '#fe9657',
		jupiter: '#e0ab79',
		saturn: '#ffe577',
		uranus: '#c8ecef',
		neptune: '#3b54d2'
	}
};

export { settings };