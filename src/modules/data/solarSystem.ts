import { FrontSide, DoubleSide } from 'three';

import textureSun from '/img/textures/sun-min.jpg';

const sunData = {
	material: {}
};

export type MaterialDataType = {
	segments?: number;
	map: string;
	emissive?: string;
	emissiveMap?: string;
	emissiveIntensity?: number;
	bumpMap?: string;
	clouds?: string;
	cloudsRotateX?: number;
	cloudsRotateY?: number;
	cloudsAlpha?: string;
	normalMap?: string;
	shininess?: number;
	side?: typeof FrontSide | typeof DoubleSide;
	rings?: {
		map: string;
		alphaMap: string;
		opacity?: number;
		emissive?: { r: number; g: number; b: number };
		side: typeof DoubleSide;
	}[];
};

type MaterialDataSet = {
	[key: string]: MaterialDataType;
};

export type RingDataTypes = {
	opacity: number;
	side: typeof DoubleSide;
	map: string;
	alphaMap: string;
	emissive?: {
		r: number;
		g: number;
		b: number;
	};
}[];

const materialData: MaterialDataSet = {
	_sun: {
		segments: 128,
		map: textureSun,
		emissive: '#ffe484',
		emissiveMap: textureSun,
		emissiveIntensity: 1
	},

	_mercury: {
		map: '/img/textures/mercury-2k.jpg',
		bumpMap: '/img/textures/mercury-bump-2k.jpg',
		segments: 64
	},
	_venus: {
		map: '/img/textures/venus-2k.jpg',
		clouds: '/img/textures/venus-clouds-2k.jpg',
		cloudsRotateX: 0.01,
		cloudsRotateY: 0.03,
		segments: 64
	},

	_earth: {
		map: '/img/textures/earth-4k.jpg',
		bumpMap: '/img/textures/earth-bump-4k.jpg',
		clouds: '/img/textures/earth-clouds-4k.jpg',
		cloudsAlpha: '/img/textures/earth-clouds-alpha-4k.jpg',
		cloudsRotateX: 0.005,
		cloudsRotateY: 0.0,
		segments: 64
	},
	_moon: {
		map: '/img/textures/moon-2k.jpg',
		bumpMap: '/img/textures/moon-bump-2k.jpg'
	},

	_mars: {
		map: '/img/textures/mars-2k.jpg',
		normalMap: '/img/textures/mars-normal-2k.jpg',
		segments: 64
	},

	_jupiter: {
		map: '/img/textures/jupiter-2k.jpg',
		shininess: 10,
		segments: 64,
		rings: [
			{
				map: '/img/textures/uranus-rings-color.png',
				alphaMap: '/img/textures/uranus-rings-alpha.png',
				opacity: 0.1,
				side: DoubleSide
			}
		] as RingDataTypes
	},
	_callisto: {
		map: '/img/textures/moon-callisto-2k.jpg'
	},
	_europa: {
		map: '/img/textures/moon-europa.jpg'
	},
	_ganymede: {
		map: '/img/textures/moon-ganymede-2k.jpg'
	},
	_io: {
		map: '/img/textures/moon-io.jpg'
	},

	_saturn: {
		map: '/img/textures/saturn-2k.jpg',
		shininess: 10,
		segments: 64,
		rings: [
			{
				map: '/img/textures/saturn-rings-color.png',
				alphaMap: '/img/textures/saturn-rings-alpha.png',
				emissive: { r: 0.2, g: 0.2, b: 0.17 },
				side: DoubleSide
			}
		] as RingDataTypes
	},
	_uranus: {
		map: '/img/textures/uranus-2k.jpg',
		segments: 64,
		rings: [
			{
				map: '/img/textures/uranus-rings-color.png',
				alphaMap: '/img/textures/uranus-rings-alpha.png',
				opacity: 0.3,
				side: DoubleSide
			}
		] as RingDataTypes
	},
	_neptune: {
		map: '/img/textures/neptune-2k.jpg',
		segments: 64,
		rings: [
			{
				map: '/img/textures/neptune-rings-color.png',
				alphaMap: '/img/textures/neptune-rings-alpha.png',
				opacity: 0.3,
				side: DoubleSide
			}
		] as RingDataTypes
	},

	_1ceres: {
		map: '/img/textures/ceres-2k.jpg'
	},
	_136199eris: {
		map: '/img/textures/eris.jpg'
	},
	_136108haumea: {
		map: '/img/textures/haumea.jpg'
	},
	_136472makemake: {
		map: '/img/textures/makemake.jpg',
		shininess: 10
	},
	_90482orcus: {
		map: '/img/textures/orcus-2k.jpg',
		shininess: 5
	},
	_pluto: {
		map: '/img/textures/pluto-4k.jpg'
	}
};

export { materialData, sunData };
