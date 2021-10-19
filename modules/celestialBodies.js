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
	name: 'sun',
	orbitRadius: 0.001,
	size: 8,
	segments: 32,
	labelColour: '#ffb01f',
	material: {
		map: textureSun,
		normalMap: null,
		emissive: '#FFF',
		emissiveMap: textureSun,
		emissiveIntensity: 0.6,
		side: DoubleSide
		// vertexShader: sunVertex,
		// fragmentShader: sunFragment
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
	labelColour: '#b78668',
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
	material: {
		// vertexShader: earthVertexShader,
		// fragmentShader: earthFragmentShader,
		map: textureEarth,
		normalMap: normalEarth
	},
	// atmosphere: {
	// 	name: 'earth atmosphere',
	// 	material: {
	// 		vertexShader: earthAtmosphereVertexShader,
	// 		fragmentShader: earthAtmosphereFragmentShader
	// 	}
	// },
	moons: [
		{
			name: 'moon luna',
			orbitRadius: 2.2,
			size: 0.4,
			segments: 32,
			labelColour: '#dae0e0',
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
	labelColour: '#dae0e0',
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
	labelColour: '#3b54d2',
	material: {
		map: textureNeptune
	}
};

export { sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
