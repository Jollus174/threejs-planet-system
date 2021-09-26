import { SphereGeometry, TextureLoader } from 'three';

const moon = {
	geometry: new SphereGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/moon.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	}
};

const mercury = {
	geometry: new SphereGeometry(0.3, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/mercury.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	}
};

const venus = {
	geometry: new SphereGeometry(0.8, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/venus.jpg'),
		normalMap: new TextureLoader().load('img/textures/normal.jpg')
	}
};

const earth = {
	geometry: new SphereGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load('img/textures/earth.jpg'),
		normalMap: new TextureLoader().load('img/textures/earth-normal.jpg')
	}
};

export { moon, mercury, venus, earth };
