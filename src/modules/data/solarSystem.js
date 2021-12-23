import { DoubleSide, FrontSide } from 'three';
import textureSun from './../../img/textures/sun-min.jpg';
import textureMercury from './../../img/textures/mercury.jpg';
import textureVenus from './../../img/textures/venus.jpg';
import textureEarth from './../../img/textures/earth.jpg';
import textureMoon from './../../img/textures/moon.jpg';
import textureMars from './../../img/textures/mars.jpg';

import textureJupiter from './../../img/textures/jupiter.jpg';
import textureIo from './../../img/textures/io.jpg';

import textureSaturn from './../../img/textures/saturn.jpg';

import textureUranus from './../../img/textures/uranus.jpg';
import textureNeptune from './../../img/textures/neptune.jpg';
import texturePluto from './../../img/textures/pluto.jpg';

// import textureSaturnRing from './../../img/textures/saturn-ring-alpha.png';
import textureSaturnRing from './../../img/textures/saturn-rings.jpg';
import textureRing from './../../img/textures/texture-ring.jpg';

// import modelDeimos from './../../img/models/deimos.glb';

import normalMercury from './../../img/textures/normal-mercury.jpg';
import normalVenus from './../../img/textures/normal-venus.jpg';
import normalEarth from './../../img/textures/normal-earth.jpg';
import normalMoon from './../../img/textures/normal-moon.jpg';
import normalMars from './../../img/textures/normal-mars.jpg';

import spaceFt from './../../img/textures/space_ft.jpg';
import spaceBk from './../../img/textures/space_bk.jpg';
import spaceUp from './../../img/textures/space_up.jpg';
import spaceDn from './../../img/textures/space_dn.jpg';
import spaceRt from './../../img/textures/space_rt.jpg';
import spaceLt from './../../img/textures/space_lt.jpg';

const skyboxTexturePaths = [spaceFt, spaceBk, spaceUp, spaceDn, spaceRt, spaceLt];

let isLive = false; // HA HAHA this is so shit
const domainPath = isLive ? 'https://joeldoesdigital.com/web-experiments/planet-system/' : './../../img/';

const sunData = {
	material: {}
};

const materialData = {
	sun: {
		segments: 128,
		map: textureSun,
		normalMap: null,
		emissive: '#FFF',
		emissiveMap: textureSun,
		emissiveIntensity: 1,
		side: FrontSide
	},

	mercury: {
		map: textureMercury,
		normalMap: null,
		// emissive: '#FFF',
		// emissiveMap: textureMercury,
		// emissiveIntensity: 0.8,
		side: FrontSide
	},
	venus: {
		map: textureVenus,
		normalMap: null,
		side: FrontSide
	},
	earth: {
		map: textureEarth,
		normalMap: null,
		side: FrontSide
	},
	mars: {
		map: textureMars,
		normalMap: null,
		side: FrontSide
	},
	jupiter: {
		map: textureJupiter,
		normalMap: null,
		side: FrontSide
	},
	saturn: {
		map: textureSaturn,
		normalMap: null,
		side: FrontSide,
		rings: [
			{
				map: textureSaturnRing,
				emissive: '#FFF',
				emissiveMap: textureSaturnRing,
				emissiveIntensity: 1,
				normalMap: null,
				side: DoubleSide
			}
		]
	},
	uranus: {
		map: textureUranus,
		normalMap: null,
		side: FrontSide
	},
	neptune: {
		map: textureNeptune,
		normalMap: null,
		side: FrontSide
	},
	pluto: {
		map: texturePluto,
		normalMap: null,
		side: FrontSide
	},
	moon: {
		map: textureMoon,
		normalMap: null,
		side: FrontSide
	}
};

export { skyboxTexturePaths, materialData, sunData };
