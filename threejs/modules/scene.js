'use strict';
import * as THREE from 'three';

const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const materialPaths = [
	'img/textures/pz.jpg',
	'img/textures/nz.jpg',
	'img/textures/py.jpg',
	'img/textures/ny.jpg',
	'img/textures/px.jpg',
	'img/textures/nx.jpg'
];
const materialArray = materialPaths.map((image) => {
	const texture = textureLoader.load(image);
	// texture.encoding = THREE.sRGBEncoding;
	return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
});

const skyboxGeometry = new THREE.BoxGeometry(1200, 1200, 1200);
const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
scene.add(skybox);

export { scene };
