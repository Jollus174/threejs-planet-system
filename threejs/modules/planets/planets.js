import { SphereGeometry, TextureLoader } from 'three';

const moon = {
	geometry: new SphereGeometry(1, 32, 32),
	material: {
		map: new TextureLoader().load('moon.jpg'),
		normalMap: new TextureLoader().load('normal.jpg')
	}
};

export { moon };
