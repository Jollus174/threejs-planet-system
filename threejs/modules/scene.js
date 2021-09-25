'use strict';
import * as THREE from 'three';

const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const materialPaths = [
	'img/textures/space_ft.png',
	'img/textures/space_bk.png',
	'img/textures/space_up.png',
	'img/textures/space_dn.png',
	'img/textures/space_rt.png',
	'img/textures/space_lt.png'
];
const materialArray = materialPaths.map((image) => {
	const texture = textureLoader.load(image);
	texture.encoding = THREE.sRGBEncoding;
	return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
});

const skyboxGeometry = new THREE.BoxGeometry(1200, 1200, 1200);
const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
scene.add(skybox);

export { scene };
