import { DoubleSide } from 'three';
import textureSun from './../../img/textures/sun.jpg';
import textureMercury from './../../img/textures/mercury.jpg';
import textureVenus from './../../img/textures/venus.jpg';
import textureEarth from './../../img/textures/earth.jpg';
import textureMoon from './../../img/textures/moon.jpg';
import textureMars from './../../img/textures/mars.jpg';
import textureJupiter from './../../img/textures/jupiter.jpg';
import textureSaturn from './../../img/textures/saturn.jpg';
import textureSaturnRing from './../../img/textures/saturn-ring-alpha.png';
import textureUranus from './../../img/textures/uranus.jpg';
import textureNeptune from './../../img/textures/neptune.jpg';

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

const sunData = {
	name: 'the sun',
	orbitRadius: 0.001,
	size: 8,
	segments: 32,
	labelColour: '#ffb01f',
	textColour: '#ffb01f',
	zoomTo: 26,
	includeOrbitLine: false,
	includeLabelLine: false,
	includeTargetLine: false,
	statsScale: 2.2,
	stats: {
		diameter: 1391980
	},
	material: {
		map: textureSun,
		normalMap: null,
		emissive: '#FFF',
		emissiveMap: textureSun,
		emissiveIntensity: 0.6,
		side: DoubleSide
	}
};

const planetData = [
	{
		name: 'mercury',
		orbitRadius: 20,
		size: 0.3,
		segments: 32,
		zoomTo: 10,
		labelColour: '#b78668',
		textColour: '#b78668',
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 57900000,
			diameter: 4878,
			spinTime: 59,
			orbitTime: 88,
			gravity: 0.38
		},
		material: {
			map: textureMercury,
			normalMap: normalMercury
		}
	},
	{
		name: 'venus',
		orbitRadius: 34,
		size: 0.8,
		segments: 32,
		labelColour: '#f3b3b3',
		textColour: '#f3b3b3',
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 108160000,
			diameter: 12104,
			spinTime: 243,
			orbitTime: 224,
			gravity: 0.9
		},
		material: {
			map: textureVenus,
			normalMap: normalVenus
		}
	},
	{
		name: 'earth',
		orbitRadius: 48,
		size: 1,
		segments: 32,
		labelColour: '#6dcbe7',
		textColour: '#6dcbe7',
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 149600000,
			diameter: 12756,
			spinTime: 1,
			orbitTime: 365.25,
			gravity: 1
		},
		material: {
			map: textureEarth,
			normalMap: normalEarth
		},
		moons: [
			{
				name: 'Luna',
				orbitRadius: 2.2,
				size: 0.4,
				segments: 32,
				labelColour: '#dae0e0',
				textColour: '#dae0e0',
				zoomTo: 10,
				includeOrbitLine: true,
				includeLabelLine: true,
				includeTargetLine: true,
				statsScale: 1,
				stats: {
					diameter: 3478.8,
					spinTime: 27,
					orbitTime: 27,
					gravity: 0.1654
				},
				material: {
					map: textureMoon,
					normalMap: normalMoon
				}
			}
		]
	},
	{
		name: 'mars',
		orbitRadius: 65,
		size: 0.6,
		segments: 32,
		labelColour: '#fe9657',
		textColour: '#fe9657',
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 227936640,
			diameter: 6794,
			spinTime: 1.0257,
			orbitTime: 687,
			gravity: 0.38
		},
		material: {
			map: textureMars,
			normalMap: normalMars
		}
	},
	{
		name: 'jupiter',
		orbitRadius: 130,
		size: 2.4,
		segments: 64,
		labelColour: '#e0ab79',
		textColour: '#e0ab79',
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 778369000,
			diameter: 142984,
			spinTime: 0.4132,
			orbitTime: 11.86,
			gravity: 2.64
		},
		material: {
			map: textureJupiter
		}
	},
	{
		name: 'saturn',
		orbitRadius: 170,
		size: 2.2,
		segments: 64,
		labelColour: '#ffe577',
		textColour: '#ffe577',
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 14278034000,
			diameter: 120536,
			spinTime: 0.4438,
			orbitTime: 29,
			gravity: 1.11
		},
		material: {
			map: textureSaturn
		},
		rings: [
			{
				material: {
					color: 0xffffff,
					transparent: true,
					map: textureSaturnRing,
					side: DoubleSide
				}
			}
		]
	},
	{
		name: 'uranus',
		orbitRadius: 210,
		size: 1.4,
		segments: 64,
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 2870658186,
			diameter: 51118,
			spinTime: 0.718,
			orbitTime: 84,
			gravity: 1.11
		},
		labelColour: '#c8ecef',
		textColour: '#c8ecef',
		material: {
			map: textureUranus
		}
	},
	{
		name: 'neptune',
		orbitRadius: 260,
		size: 1.4,
		segments: 64,
		zoomTo: 10,
		includeOrbitLine: true,
		includeLabelLine: true,
		includeTargetLine: true,
		statsScale: 1,
		stats: {
			distanceToSun: 4496976000,
			diameter: 49532,
			spinTime: 0.6715,
			orbitTime: 164.8,
			gravity: 1.21
		},
		labelColour: '#3b54d2',
		textColour: '#3b54d2',
		material: {
			map: textureNeptune
		}
	}
];

export { skyboxTexturePaths, sunData, planetData };
