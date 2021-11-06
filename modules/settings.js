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

		_dollySpeedMax: 0.95,
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
	domTarget: document.querySelector('#bg')
};

export { settings };
