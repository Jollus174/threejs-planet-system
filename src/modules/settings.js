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
		default: hsl(0, 0, 89),
		dwarfPlanet: hsl(0, 0, 78),
		_sun: hsl(38.8, 95, 62),
		_mercury: hsl(23, 95, 62),
		_venus: hsl(29, 95, 62),
		_earth: hsl(194, 95, 62),
		_mars: hsl(14, 95, 62),
		_jupiter: hsl(29, 95, 62),
		_saturn: hsl(48, 95, 62),
		_uranus: hsl(185, 95, 62),
		_neptune: hsl(215, 95, 62),

		_io: hsl(51, 53, 56),
		_europa: hsl(35, 58, 88),
		_ganymede: hsl(50, 5, 76),
		_callisto: hsl(325, 7, 47),
		_titan: hsl(48, 96, 64),
		_triton: hsl(338, 10, 79),

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
