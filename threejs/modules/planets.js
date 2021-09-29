import { DoubleSide, SphereBufferGeometry, TextureLoader } from 'three';
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

const mercury = {
	name: 'mercury',
	geometry: new SphereBufferGeometry(0.3, 32, 32),
	material: {
		map: new TextureLoader().load(textureMercury),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 5
};

const venus = {
	name: 'venus',
	geometry: new SphereBufferGeometry(0.8, 32, 32),
	material: {
		map: new TextureLoader().load(textureVenus),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 8
};

const earth = {
	name: 'earth',
	geometry: new SphereBufferGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load(textureEarth),
		normalMap: new TextureLoader().load(normalEarth)
	},
	orbitRadius: 11,
	moons: [
		{
			name: 'luna',
			geometry: new SphereBufferGeometry(0.4, 32, 32),
			orbitRadius: 2.2,
			material: {
				map: new TextureLoader().load(textureMoon),
				normalMap: new TextureLoader().load(normal)
			}
		}
	]
};

const mars = {
	name: 'mars',
	geometry: new SphereBufferGeometry(0.6, 32, 32),
	material: {
		map: new TextureLoader().load(textureMars),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 15
};

const jupiter = {
	name: 'jupiter',
	geometry: new SphereBufferGeometry(2.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureJupiter),
		normalMap: ''
	},
	orbitRadius: 30
};

const saturn = {
	name: 'saturn',
	geometry: new SphereBufferGeometry(2.2, 32, 32),
	material: {
		map: new TextureLoader().load(textureSaturn),
		normalMap: ''
	},
	orbitRadius: 40,
	rings: [
		{
			name: 'saturn ring',
			material: {
				color: 0xffffff,
				transparent: true,
				map: new TextureLoader().load(textureSaturnRing),
				side: DoubleSide
			}
		}
	]
};

const uranus = {
	name: 'uranus',
	geometry: new SphereBufferGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureUranus),
		normalMap: ''
	},
	orbitRadius: 49
};

const neptune = {
	name: 'neptune',
	geometry: new SphereBufferGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureNeptune),
		normalMap: ''
	},
	orbitRadius: 59
};

export { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
