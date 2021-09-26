'use strict';
import { TorusGeometry, Mesh, MeshStandardMaterial, SphereGeometry, TextureLoader, AdditiveBlending } from 'three';

const torus = new Mesh(new TorusGeometry(10, 3, 16, 100), new MeshStandardMaterial({ color: 0xff6347 }));

const moon = new Mesh(
	new SphereGeometry(3, 32, 32),
	new MeshStandardMaterial({
		map: new TextureLoader().load('moon.jpg'),
		normalMap: new TextureLoader().load('normal.jpg')
	})
);

const star = {
	// geometry: new SphereGeometry(0.02, 16, 16),
	geometry: new SphereGeometry(1, 16, 16),
	material: new MeshStandardMaterial({
		// color: 0xffffff,
		blending: AdditiveBlending,
		transparent: true
	})
};

export { torus, moon, star };
