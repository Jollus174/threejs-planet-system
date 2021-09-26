import { CircleGeometry, SphereGeometry, TextureLoader } from 'three';
import textureMercury from './../img/textures/mercury.jpg';
import textureVenus from './../img/textures/venus.jpg';
import textureEarth from './../img/textures/earth.jpg';
import textureMoon from './../img/textures/moon.jpg';
import textureMars from './../img/textures/mars.jpg';
import textureJupiter from './../img/textures/jupiter.jpg';
import textureSaturn from './../img/textures/saturn.jpg';
import textureUranus from './../img/textures/uranus.jpg';
import textureNeptune from './../img/textures/neptune.jpg';
import normal from './../img/textures/normal.jpg';
import normalEarth from './../img/textures/normal-earth.jpg';

const mercury = {
	geometry: new SphereGeometry(0.3, 32, 32),
	material: {
		map: new TextureLoader().load(textureMercury),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 5
};

const venus = {
	geometry: new SphereGeometry(0.8, 32, 32),
	material: {
		map: new TextureLoader().load(textureVenus),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 8
};

const earth = {
	geometry: new SphereGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load(textureEarth),
		normalMap: new TextureLoader().load(normalEarth)
	},
	orbitRadius: 11,
	moons: [
		{
			geometry: new SphereGeometry(1, 32, 32),
			material: {
				map: new TextureLoader().load(textureMoon),
				normalMap: new TextureLoader().load(normal)
			}
		}
	]
};

const mars = {
	geometry: new SphereGeometry(0.6, 32, 32),
	material: {
		map: new TextureLoader().load(textureMars),
		normalMap: new TextureLoader().load(normal)
	},
	orbitRadius: 15
};

const jupiter = {
	geometry: new SphereGeometry(2.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureJupiter)
	},
	orbitRadius: 20
};

const saturn = {
	geometry: new SphereGeometry(2.2, 32, 32),
	material: {
		map: new TextureLoader().load(textureSaturn)
	},
	orbitRadius: 28,
	rings: [
		{
			material: {
				// geometry: new CircleGeometry(30, 90),
				// geometry: new Lin
				// material: {
				// 	color: 0xffffff,
				// 	transparent: true
				// }
			}
		}
	]
};

const uranus = {
	geometry: new SphereGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureUranus)
	},
	orbitRadius: 35
};

const neptune = {
	geometry: new SphereGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load(textureNeptune)
	},
	orbitRadius: 45
};

export { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
