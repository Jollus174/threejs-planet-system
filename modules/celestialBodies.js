import { DoubleSide, SphereBufferGeometry } from 'three';
import textureSun from './../img/textures/sun.jpg';
import textureMercury from './../img/textures/mercury.jpg';
import textureVenus from './../img/textures/venus.jpg';
import textureEarth from './../img/textures/earth.jpg';
import textureMoon from './../img/textures/moon.jpg';
import textureMars from './../img/textures/mars.jpg';
import textureJupiter from './../img/textures/jupiter.jpg';
import textureSaturn from './../img/textures/saturn.jpg';
import textureSaturnRing from './../img/textures/saturn-ring-alpha.png';
import textureUranus from './../img/textures/uranus.jpg';
import textureNeptune from './../img/textures/neptune.jpg';
// import normal from './../img/textures/normal.jpg';
import normalMercury from './../img/textures/normal-mercury.jpg';
import normalVenus from './../img/textures/normal-venus.jpg';
import normalEarth from './../img/textures/normal-earth.jpg';
import normalMoon from './../img/textures/normal-moon.jpg';
import normalMars from './../img/textures/normal-mars.jpg';
import sunFragment from './../shaders/sun/fragment.glsl';
import sunVertex from './../shaders/sun/vertex.glsl';
import sunSpecialFragment from './../shaders/sun/shaderSun/fragment.glsl';
import sunSpecialVertex from './../shaders/sun/shaderSun/vertex.glsl';
import sunAtmosphereFragment from './../shaders/sun/shaderAtmosphere/fragment.glsl';
import sunAtmosphereVertex from './../shaders/sun/shaderAtmosphere/vertex.glsl';
import earthFragmentShader from './../shaders/earthFragment.glsl';
import earthVertexShader from './../shaders/earthVertex.glsl';
import earthAtmosphereFragmentShader from './../shaders/earthAtmosphereFragment.glsl';
import earthAtmosphereVertexShader from './../shaders/earthAtmosphereVertex.glsl';

const sun = {
	name: 'the sun',
	orbitRadius: 0.001,
	size: 8,
	segments: 32,
	labelColour: '#ffb01f',
	zoomTo: 26,
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
	},
	specialSunShader: {
		vertexShader: sunSpecialVertex,
		fragmentShader: sunSpecialFragment
	}
};

const mercury = {
	name: 'mercury',
	orbitRadius: 20,
	size: 0.3,
	segments: 32,
	zoomTo: 10,
	labelColour: '#b78668',
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
};

const venus = {
	name: 'venus',
	orbitRadius: 34,
	size: 0.8,
	segments: 32,
	labelColour: '#f3b3b3',
	zoomTo: 10,
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
};

const earth = {
	name: 'earth',
	orbitRadius: 48,
	size: 1,
	segments: 32,
	labelColour: '#6dcbe7',
	zoomTo: 10,
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
			zoomTo: 10,
			statsScale: 1,
			stats: {
				diameter: 3478.8,
				spinTime: 27,
				orbitTime: 27,
				gravity: 0.1654
			},
			material: {
				map: textureMoon
				// normalMap: normalMoon
			}
		}
	]
};

const mars = {
	name: 'mars',
	orbitRadius: 65,
	size: 0.6,
	segments: 32,
	labelColour: '#fe9657',
	zoomTo: 10,
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
};

const jupiter = {
	name: 'jupiter',
	orbitRadius: 130,
	size: 2.4,
	segments: 64,
	labelColour: '#e0ab79',
	zoomTo: 10,
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
};

const saturn = {
	name: 'saturn',
	orbitRadius: 170,
	size: 2.2,
	segments: 64,
	labelColour: '#ffe577',
	zoomTo: 10,
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
			name: 'saturn ring',
			material: {
				color: 0xffffff,
				transparent: true,
				map: textureSaturnRing,
				side: DoubleSide
			}
		}
	]
};

const uranus = {
	name: 'uranus',
	orbitRadius: 210,
	size: 1.4,
	segments: 64,
	zoomTo: 10,
	statsScale: 1,
	stats: {
		distanceToSun: 2870658186,
		diameter: 51118,
		spinTime: 0.718,
		orbitTime: 84,
		gravity: 1.11
	},
	labelColour: '#c8ecef',
	material: {
		map: textureUranus
	}
};

const neptune = {
	name: 'neptune',
	orbitRadius: 260,
	size: 1.4,
	segments: 64,
	zoomTo: 10,
	statsScale: 1,
	stats: {
		distanceToSun: 4496976000,
		diameter: 49532,
		spinTime: 0.6715,
		orbitTime: 164.8,
		gravity: 1.21
	},
	labelColour: '#3b54d2',
	material: {
		map: textureNeptune
	}
};

export { sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
