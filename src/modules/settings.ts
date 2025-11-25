import { hsl } from './utilities/strings';
import type { Settings } from '../types';

const settings: Settings = {
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
		_orbitVisibilityCheckbox: document.querySelector('#orbit-lines') as HTMLInputElement | null
	},
	// shoutouts to F-Zero GX
	planetColours: {
		default: hsl({ h: 0, s: 0, l: 89 }),
		dwarfPlanet: hsl({ h: 0, s: 0, l: 78 }),
		_sun: hsl({ h: 38.8, s: 95, l: 62 }),
		_mercury: hsl({ h: 23, s: 95, l: 62 }),
		_venus: hsl({ h: 29, s: 95, l: 62 }),
		_earth: hsl({ h: 194, s: 95, l: 62 }),
		_mars: hsl({ h: 14, s: 95, l: 62 }),
		_jupiter: hsl({ h: 29, s: 95, l: 62 }),
		_saturn: hsl({ h: 48, s: 95, l: 62 }),
		_uranus: hsl({ h: 185, s: 95, l: 62 }),
		_neptune: hsl({ h: 215, s: 95, l: 62 }),

		_io: hsl({ h: 51, s: 53, l: 56 }),
		_europa: hsl({ h: 35, s: 58, l: 88 }),
		_ganymede: hsl({ h: 50, s: 5, l: 76 }),
		_callisto: hsl({ h: 325, s: 7, l: 47 }),
		_titan: hsl({ h: 48, s: 96, l: 64 }),
		_triton: hsl({ h: 338, s: 10, l: 79 }),

		_136199eris: hsl({ h: 16, l: 70 }),
		_136472makemake: hsl({ h: 28, s: 32, l: 70 }),
		_136108haumea: hsl({ h: 357, s: 55, l: 74 }),
		_90482orcus: hsl({ h: 0, s: 0, l: 66 })
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
