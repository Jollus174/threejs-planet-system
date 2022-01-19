import { hsl } from './utilities/strings';

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
		default: hsl(0, 0, 89.4),
		dwarfPlanet: hsl(0, 0, 78.4),
		_sun: hsl(38.8, 95, 62.5),
		_mercury: hsl(22.8, 95, 62.5),
		_venus: hsl(29.4, 95, 62.5),
		_earth: hsl(193.8, 95, 62.5),
		_mars: hsl(14.3, 95, 62.5),
		_jupiter: hsl(29.1, 95, 62.5),
		_saturn: hsl(48.5, 95, 62.5),
		_uranus: hsl(184.6, 95, 62.5),
		_neptune: hsl(215.3, 95, 62.5),

		_io: hsl(51, 53.1, 55.7),
		_europa: hsl(35, 58.1, 87.8),
		_ganymede: hsl(50, 4.8, 75.7),
		_callisto: hsl(324.7, 7.1, 46.9),
		_titan: hsl(47.6, 95.6, 64.3),
		_triton: hsl(338.2, 10.1, 78.6),

		_136199eris: hsl(16, null, 70),
		_136472makemake: hsl(28, 32, 70),
		_136108haumea: hsl(357, 55, 74),
		_90482orcus: hsl(0, 0, 66)
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
		'_90482orcus'
		// '_gonggong',
		// '_50000quaoar'
	],
	navigationEntities: [] // hydrated by API
};

export { settings };
