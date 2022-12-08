import { DoubleSide } from 'three';
import textureSun from './../../img/textures/sun-min.jpg';

import textureMercury from './../../img/textures/mercury-2k.jpg';
import bumpMercury from './../../img/textures/mercury-2k-bump.jpg';

import textureVenus from './../../img/textures/venus-2k.jpg';
import textureVenusAtmosphere from './../../img/textures/venus-2k-atmosphere.jpg';

import textureEarth from './../../img/textures/earth.jpg';
import textureMoon from './../../img/textures/moon.jpg';
import textureMars from './../../img/textures/mars.jpg';

import textureJupiter from './../../img/textures/jupiter.jpg';
import textureCallisto from './../../img/textures/moon-callisto.jpg';
import textureEuropa from './../../img/textures/moon-europa.jpg';
import textureGanymede from './../../img/textures/moon-ganymede.jpg';
import textureIo from './../../img/textures/moon-io.jpg';

import textureSaturn from './../../img/textures/saturn.jpg';

import textureUranus from './../../img/textures/uranus.jpg';
import textureNeptune from './../../img/textures/neptune.jpg';

// for smol boys
import textureCeres from './../../img/textures/ceres.jpg';
import textureEris from './../../img/textures/eris.jpg';
import textureHaumea from './../../img/textures/haumea.jpg';
import textureMakemake from './../../img/textures/makemake.jpg';
import textureOrcus from './../../img/textures/orcus.jpg';
import texturePluto from './../../img/textures/pluto.jpg';

import textureSaturnRing from './../../img/textures/saturn-ring-alpha.png';
// import textureSaturnRing from './../../img/textures/saturn-rings.jpg';
// import textureRing from './../../img/textures/texture-ring.jpg';

// import modelDeimos from './../../img/models/deimos.glb';

// import normalMercury from './../../img/textures/normal-mercury.jpg';
// import normalVenus from './../../img/textures/normal-venus.jpg';
// import normalEarth from './../../img/textures/normal-earth.jpg';
// import normalMoon from './../../img/textures/normal-moon.jpg';
// import normalMars from './../../img/textures/normal-mars.jpg';

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
		map: textureMercury,
		bump: bumpMercury,
		segments: 64
	},
	_venus: {
		map: textureVenus,
		clouds: textureVenusAtmosphere,
		segments: 64
	},
	_earth: {
		map: textureEarth,
		segments: 64
	},
	_mars: {
		map: textureMars,
		segments: 64
	},

	_jupiter: {
		map: textureJupiter,
		segments: 64
	},
	_callisto: {
		map: textureCallisto
	},
	_europa: {
		map: textureEuropa
	},
	_ganymede: {
		map: textureGanymede
	},
	_io: {
		map: textureIo
	},

	_saturn: {
		map: textureSaturn,
		normalMap: null,
		segments: 64,
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
	_uranus: {
		map: textureUranus,
		segments: 64
	},
	_neptune: {
		map: textureNeptune,
		segments: 64
	},

	_1ceres: {
		map: textureCeres
	},
	_136199eris: {
		map: textureEris
	},
	_136108haumea: {
		map: textureHaumea
	},
	_136472makemake: {
		map: textureMakemake
	},
	_90482orcus: {
		map: textureOrcus
	},
	_pluto: {
		map: texturePluto
	},

	_moon: {
		map: textureMoon
	}
};

export { skyboxTexturePaths, materialData, sunData };
