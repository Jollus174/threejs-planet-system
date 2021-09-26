import { SphereGeometry, TextureLoader } from 'three';

const mercury = {
	geometry: new SphereGeometry(0.3, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/mercury.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	},
	orbitRadius: 5
};

const venus = {
	geometry: new SphereGeometry(0.8, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/venus.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	},
	orbitRadius: 8
};

const earth = {
	geometry: new SphereGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/earth.jpg'),
		normalMap: new TextureLoader().load('img/textures/earth-normal.jpg')
	},
	orbitRadius: 11,
	moons: [
		{
			geometry: new SphereGeometry(1, 32, 32),
			material: {
				map: new TextureLoader().load('img/textures/moon.jpg'),
				normalMap: new TextureLoader().load('img/textures/normal.jpg')
			}
		}
	]
};

const mars = {
	geometry: new SphereGeometry(0.6, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/mars.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	},
	orbitRadius: 15
};

const jupiter = {
	geometry: new SphereGeometry(2.4, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/jupiter.jpg')
	},
	orbitRadius: 20
};

const saturn = {
	geometry: new SphereGeometry(2.2, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/saturn.jpg')
	},
	orbitRadius: 28
};

const uranus = {
	geometry: new SphereGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/uranus.jpg')
	},
	orbitRadius: 35
};

const neptune = {
	geometry: new SphereGeometry(1.4, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/neptune.jpg')
	},
	orbitRadius: 45
};

export { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune };
