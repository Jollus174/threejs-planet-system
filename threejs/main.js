/* globals requestAnimationFrame */
'use strict';
import './style.css';
import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { scene } from './modules/scene';
import { torus, moon } from './modules/objects';
import { star_test } from './modules/star';

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
	// scene.add(torus, moon);
	scene.add(torus, moon);

	const pointLight = new THREE.PointLight(0xffffff);
	pointLight.position.set(5, 5, 5);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	const lightHelper = new THREE.PointLightHelper(pointLight);
	const gridHelper = new THREE.GridHelper(200, 50);
	scene.add(pointLight, ambientLight);
	scene.add(lightHelper, gridHelper);

	Array(5)
		.fill()
		.forEach(() => {
			scene.add(star_test);
		});

	Array(200)
		.fill()
		.forEach(() => {
			// console.log('adding star');
			const geometry = new THREE.SphereGeometry(0.25, 24, 24);
			const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
			const star = new THREE.Mesh(geometry, material);
			const [x, y, z] = Array(3)
				.fill()
				.map(() => THREE.MathUtils.randFloatSpread(100));
			star.position.set(x, y, z);
			scene.add(star);
		});
	// Array(200).fill().forEach(addStar);
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
};

init();

/* window.addEventListener('resize', () => {
	console.log('resizing!');
	// renderer.setSize(window.innerWidth, window.innerHeight);

	// TODO: possibly add a debounce
}); */
