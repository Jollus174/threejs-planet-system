/* globals requestAnimationFrame */
'use strict';
import './style.css';
import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { scene } from './modules/scene';
import { torus, moon, star } from './modules/objects';
import { pointLight, ambientLight, lightHelper } from './modules/lights';

const aspectRatio = window.innerWidth / window.innerHeight;
const renderTarget = document.querySelector('#bg');

const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: renderTarget
});

let docTop = document.body.getBoundingClientRect().top;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.x = -3;
camera.position.z = 30;

const addElements = () => {
	moon.position.z = 30;
	moon.position.x = -10;
	scene.add(torus, moon);
	Array(200)
		.fill()
		.forEach(() => {
			const { geometry, material } = star;
			const starMesh = new THREE.Mesh(geometry, material);
			const [x, y, z] = Array(3)
				.fill()
				.map(() => THREE.MathUtils.randFloatSpread(100));
			starMesh.position.set(x, y, z);
			scene.add(starMesh);
		});

	scene.add(pointLight, ambientLight, lightHelper);

	const gridHelper = new THREE.GridHelper(200, 50);
	scene.add(gridHelper);
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

const moveCamera = (t) => {
	// const theDiff = THREE.MathUtils.damp(oldScroll, t, 10, 2);
	const tAdjusted = Math.min(t, -1);
	moon.rotation.x += 0.05;
	moon.rotation.y += 0.075;
	moon.rotation.z += 0.05;

	camera.position.x = tAdjusted * -0.0002;
	camera.position.y = tAdjusted * -0.0002;
	camera.position.z = tAdjusted * -0.01;
};

window.document.addEventListener('scroll', () => {
	docTop = document.body.getBoundingClientRect().top;
	moveCamera(docTop);
});

const init = () => {
	animate();
	addElements();
	moveCamera(docTop);
};

init();

/* window.addEventListener('resize', () => {
	console.log('resizing!');
	// renderer.setSize(window.innerWidth, window.innerHeight);

	// TODO: possibly add a debounce
}); */
