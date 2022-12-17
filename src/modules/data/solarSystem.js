import { DoubleSide } from 'three';

import textureSun from './../../img/textures/sun-min.jpg';

import spaceFt from './../../img/textures/space_ft.jpg';
import spaceBk from './../../img/textures/space_bk.jpg';
import spaceUp from './../../img/textures/space_up.jpg';
import spaceDn from './../../img/textures/space_dn.jpg';
import spaceRt from './../../img/textures/space_rt.jpg';
import spaceLt from './../../img/textures/space_lt.jpg';

const skyboxTexturePaths = [spaceFt, spaceBk, spaceUp, spaceDn, spaceRt, spaceLt];

const sunData = {
	material: {}
};

const materialData = {
	_sun: {
		segments: 128,
		map: textureSun,
		emissive: '#ffe484',
		emissiveMap: textureSun,
		emissiveIntensity: 1
	},

	_mercury: {
		map: './../../img/textures/mercury-2k.jpg',
		bumpMap: './../../img/textures/mercury-bump-2k.jpg',
		segments: 64
	},
	_venus: {
		map: './../../img/textures/venus-2k.jpg',
		clouds: './../../img/textures/venus-clouds-2k.jpg',
		cloudsRotateX: 0.01,
		cloudsRotateY: 0.03,
		segments: 64
	},

	_earth: {
		map: './../../img/textures/earth-4k.jpg',
		bumpMap: './../../img/textures/earth-bump-4k.jpg',
		clouds: './../../img/textures/earth-clouds-4k.jpg',
		cloudsAlpha: './../../img/textures/earth-clouds-alpha-4k.jpg',
		cloudsRotateX: 0.005,
		cloudsRotateY: 0.0,
		segments: 64
	},
	_moon: {
		map: './../../img/textures/moon-2k.jpg',
		bumpMap: './../../img/textures/moon-bump-2k.jpg'
	},

	_mars: {
		map: './../../img/textures/mars-2k.jpg',
		normalMap: './../../img/textures/mars-normal-2k.jpg',
		segments: 64
	},

	// TODO: jupiter rings
	_jupiter: {
		map: './../../img/textures/jupiter-2k.jpg',
		shininess: 10,
		segments: 64
	},
	_callisto: {
		map: './../../img/textures/moon-callisto-2k.jpg'
	},
	_europa: {
		map: './../../img/textures/moon-europa.jpg'
	},
	_ganymede: {
		map: './../../img/textures/moon-ganymede-2k.jpg'
	},
	_io: {
		map: './../../img/textures/moon-io.jpg'
	},

	_saturn: {
		map: './../../img/textures/saturn-2k.jpg',
		normalMap: null,
		shininess: 10,
		segments: 64,
		rings: [
			{
				map: './../../img/textures/saturn-ring-alpha.png',
				emissive: '#FFF',
				emissiveMap: './../../img/textures/saturn-ring-alpha.png',
				emissiveIntensity: 1,
				normalMap: null,
				side: DoubleSide
			}
		]
	},
	_uranus: {
		map: './../../img/textures/uranus-2k.jpg',
		segments: 64
	},
	_neptune: {
		map: './../../img/textures/neptune-2k.jpg',
		segments: 64
	},

	_1ceres: {
		map: './../../img/textures/ceres-2k.jpg'
	},
	_136199eris: {
		map: './../../img/textures/eris.jpg'
	},
	_136108haumea: {
		map: './../../img/textures/haumea.jpg'
	},
	_136472makemake: {
		map: './../../img/textures/makemake.jpg',
		shininess: 10
	},
	_90482orcus: {
		map: './../../img/textures/orcus-2k.jpg',
		shininess: 5
	},
	_pluto: {
		map: './../../img/textures/pluto-4k.jpg'
	}
};

export { skyboxTexturePaths, materialData, sunData };
