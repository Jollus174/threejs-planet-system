'use strict';
import * as THREE from 'three';

const torus = new THREE.Mesh(
	new THREE.TorusGeometry(10, 3, 16, 100),
	new THREE.MeshStandardMaterial({ color: 0xff6347 })
);

const moon = new THREE.Mesh(
	new THREE.SphereGeometry(3, 32, 32),
	new THREE.MeshStandardMaterial({
		map: new THREE.TextureLoader().load('moon.jpg'),
		normalMap: new THREE.TextureLoader().load('normal.jpg')
	})
);

const star = {
	geometry: new THREE.SphereGeometry(0.25, 24, 24),
	material: new THREE.MeshStandardMaterial({ color: 0xffffff })
};

export { torus, moon, star };
