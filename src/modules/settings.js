const settings = {
	camera: {
		_fov: 50,
		_aspect: window.innerWidth / window.innerHeight,
		_near: 1,
		_far: 1000000000000
	},
	controls: {
		_minDistance: 0.1,
		_maxDistance: 100000000000,
		_enableDamping: true,
		_dampingFactor: 0.05,
		_enableKeys: false, // could potentially eat search inputs...
		_minPolarAngle: 0.5,
		_maxPolarAngle: 2.5,

		_dollySpeedMax: 0.93,
		_dollySpeedMin: 0.999
	},
	mouse: {
		_mouseHoverTimeoutDefault: 5, // for queueing up planet hovers
		_mouseClickTimeoutDefault: 500 // for determining whether it's a click mouse press or a held one
	},
	orbitLines: {
		_orbitVisibilityCheckbox: document.querySelector('#orbit-lines')
	},
	domTarget: document.querySelector('#bg'),
	// shoutouts to F-Zero GX
	planetColours: {
		default: '#e4e4e4',
		dwarfPlanet: '#c8c8c8',
		_sun: '#ffb01f',
		_mercury: '#b78668',
		_venus: '#ff7d00',
		_earth: '#6dcbe7',
		_mars: '#fc6f43',
		_jupiter: '#e0ab79',
		_saturn: '#ffe577',
		_uranus: '#c8ecef',
		_neptune: '#94c0ff',
		_io: '#cab852',
		_europa: '#f2e3ce',
		_ganymede: '#c4c3be',
		_callisto: '#806f79',
		_titan: '#fbd74d',
		_triton: '#cec3c7'
	},
	systemZoomDistanceThresholds: [1800000000, 5000000000],
	navigationSystems: [
		'_sun',

		'_mercury',
		'_venus',
		'_earth',
		'_mars',
		'_jupiter',
		'_saturn',
		'_uranus',
		'_neptune',

		'_pluto',
		'_1ceres',
		'_136199eris',
		'_136472makemake',
		'_136108haumea',
		'_90482orcus',
		// '_gonggong',
		'_50000quaoar'
	],
	navigationEntities: [] // hydrated by API
};

export { settings };
