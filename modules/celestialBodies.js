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
import normal from './../img/textures/normal.jpg';
import normalEarth from './../img/textures/normal-earth.jpg';

const sun = {
	name: 'sun',
	geometry: new SphereBufferGeometry(2, 40, 40),
	material: {
		map: textureSun
	}
};

const mercury = {
	name: 'mercury',
	orbitRadius: 5,
	geometry: new SphereBufferGeometry(0.3, 32, 32),
	material: {
		map: textureMercury,
		normalMap: normal
	}
};

const venus = {
	name: 'venus',
	orbitRadius: 8,
	geometry: new SphereBufferGeometry(0.8, 32, 32),
	material: {
		map: textureVenus,
		normalMap: normal
	}
};

const earth = {
	name: 'earth',
	orbitRadius: 11,
	geometry: new SphereBufferGeometry(1, 32, 32),
	material: {
		map: textureEarth,
		normalMap: normalEarth
	},
	moons: [
		{
			name: 'luna',
			orbitRadius: 2.2,
			geometry: new SphereBufferGeometry(0.4, 32, 32),
			material: {
				map: textureMoon,
				normalMap: normal
			}
		}
	]
};

const mars = {
	name: 'mars',
	orbitRadius: 15,
	geometry: new SphereBufferGeometry(0.6, 32, 32),
	material: {
		map: textureMars,
		normalMap: normal
	}
};

const jupiter = {
	name: 'jupiter',
	orbitRadius: 30,
	geometry: new SphereBufferGeometry(2.4, 32, 32),
	material: {
		map: textureJupiter,
		normalMap: ''
	}
};

const saturn = {
	name: 'saturn',
	orbitRadius: 40,
	geometry: new SphereBufferGeometry(2.2, 32, 32),
	material: {
		map: textureSaturn,
		normalMap: ''
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
	orbitRadius: 49,
	geometry: new SphereBufferGeometry(1.4, 32, 32),
	material: {
		map: textureUranus,
		normalMap: ''
	}
};

const neptune = {
	name: 'neptune',
	orbitRadius: 59,
	geometry: new SphereBufferGeometry(1.4, 32, 32),
	material: {
		map: textureNeptune,
		normalMap: ''
	}
};

export { sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
