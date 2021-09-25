'use strict';
import './style.css';
import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { scene } from './modules/scene';
import { renderer } from './modules/renderer';
import { torus, moon, star } from './modules/objects';
import { pointLight, ambientLight, lightHelper } from './modules/lights';
import { sun } from './modules/planets/sun';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// controls.enableZoom = false;
controls.minDistance = 2;
controls.maxDistance = 50;

const clock = new THREE.Clock();

let docTop = document.body.getBoundingClientRect().top;
let composer;

const addElements = () => {
	moon.position.z = 30;
	moon.position.x = -10;
	// scene.add(torus, moon);
	scene.add(sun);
	Array(300)
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

	// const gridHelper = new THREE.GridHelper(200, 50);
	// scene.add(gridHelper);
};

const render = () => {
	const delta = 5 * clock.getDelta();
	sun.material.uniforms.time.value += 0.2 * delta;
	moon.rotation.y += 0.0125 * delta;
	// sun.rotation.x += 0.05 * delta;
	// sun.rotation.y += 0.0125 * delta;

	// torus.rotation.x += 0.01 * delta;
	// torus.rotation.y += 0.01 * delta;
	// torus.rotation.z += 0.01 * delta;
};

const animate = () => {
	window.requestAnimationFrame(animate);

	// controls.update();

	// render == DRAW
	// renderer.clear();
	render();
	// compose();
	renderer.render(scene, camera);
	// composer.render(0.01);
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

const compose = () => {
	const renderModel = new RenderPass(scene, camera);
	const effectBloom = new BloomPass(1.25);
	const effectFilm = new FilmPass(0.35, 0.95, 2048, false);
	composer = new EffectComposer(renderer);

	composer.addPass(renderModel);
	composer.addPass(effectBloom);
	composer.addPass(effectFilm);
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = THREE.sRGBEncoding; // lights it up!
	// camera.position.x = -3;
	// camera.position.z = 30;
	camera.position.z = 5;

	// compose();
	animate();
	addElements();

	// moveCamera(docTop);
};

init();

window.addEventListener('resize', () => {
	// window.requestAnimationFrame(() => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// });
	// TODO: possibly add a debounce
});

// document.addEventListener('wheel', (e) => {
// 	const fov = camera.fov + e.deltaY * 0.05;
// 	camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
// 	camera.updateProjectionMatrix();
// });

// window.document.addEventListener('scroll', () => {
// 	docTop = document.body.getBoundingClientRect().top;
// 	moveCamera(docTop);
// });
