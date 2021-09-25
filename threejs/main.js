/* globals requestAnimationFrame */
'use strict';
import './style.css';
import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { torus, moon } from './modules/objects';
// import { torus } from './modules/torus.js';
// import { star } from './modules/star.js';
// import { moon } from './modules/moon';

const scene = new THREE.Scene();

const aspectRatio = window.innerWidth / window.innerHeight;
const renderTarget = document.querySelector('#bg');

const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: renderTarget
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 30;

// const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
// const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
// const torus = new THREE.Mesh(geometry, material);

// const addStars = () => {
// 	const [x, y, z] = Array(3)
// 		.fill()
// 		.map(() => THREE.MathUtils.randFloatSpread(100));
// 	star.position.set(x, y, z);
// 	scene.add(star);
// };

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

const addStar = () => {
	const geometry = new THREE.SphereGeometry(0.25, 24, 24);
	const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
	const star = new THREE.Mesh(geometry, material);
	const [x, y, z] = Array(3)
		.fill()
		.map(() => THREE.MathUtils.randFloatSpread(100));
	star.position.set(x, y, z);
	scene.add(star);
};

const addElements = () => {
	scene.add(torus);

	const pointLight = new THREE.PointLight(0xffffff);
	pointLight.position.set(5, 5, 5);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	const lightHelper = new THREE.PointLightHelper(pointLight);
	const gridHelper = new THREE.GridHelper(200, 50);
	scene.add(pointLight, ambientLight);
	scene.add(lightHelper, gridHelper);
	scene.add(moon);

	// Array(200)
	// 	.fill()
	// 	.forEach(() => {
	// 		const [x, y, z] = Array(3)
	// 			.fill()
	// 			.map(() => THREE.MathUtils.randFloatSpread(100));
	// 		star.position.set(x, y, z);
	// 		scene.add(star);
	// 	});

	for (let i = 0; i < 200; i++) {
		console.log('adding star');
		addStar();
	}
	// Array(200).fill().forEach(addStar);

	console.log(scene);
};

const controls = new OrbitControls(camera, renderer.domElement);

const animate = () => {
	requestAnimationFrame(animate);

	torus.rotation.x += 0.01;
	torus.rotation.y += 0.01;
	torus.rotation.z += 0.01;

	controls.update();

	// render == DRAW
	renderer.render(scene, camera);
};

animate();
addElements();

/* window.addEventListener('resize', () => {
	console.log('resizing!');
	// renderer.setSize(window.innerWidth, window.innerHeight);

	// TODO: possibly add a debounce
}); */
