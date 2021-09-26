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
import { skybox } from './modules/skybox';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { Color } from 'three';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 4;
controls.maxDistance = 50;

const clock = new THREE.Clock();

const stars = [];
let composer;

const addElements = () => {
	moon.position.z = 30;
	moon.position.x = -10;
	// scene.add(torus, moon);
	scene.add(sun);
	scene.add(skybox);
	for (let i = 0; i < 1000; i++) {
		const { geometry, material } = star;
		const starMesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({
				...material,
				// opacity: Math.random()
				opacity: 1,
				color: new THREE.Color('hsl(160, 0%, 80%)')
				// color: 0xffffff
			})
		);
		const [x, y, z] = Array(3)
			.fill()
			.map(() => THREE.MathUtils.randFloatSpread(100));
		starMesh.position.set(x, y, z);
		stars.push(starMesh);
		// scene.add(starMesh);
	}

	console.log(stars);
	stars.forEach((star) => scene.add(star));

	// scene.add(pointLight, ambientLight, lightHelper);
	console.log(scene);
	console.log(scene.children.filter((child) => child.name === 'skybox'));
	scene.add(pointLight, ambientLight);

	// console.log(getRandomInt(50, 100));
};

// star twinkle: https://codepen.io/WebSonick/pen/vjmgu
var lightness = 0;

const render = () => {
	const delta = 5 * clock.getDelta();
	sun.material.uniforms.time.value += 0.2 * delta;
	moon.rotation.y += 0.0125 * delta;
	// sun.rotation.x += 0.05 * delta;
	// sun.rotation.y += 0.0125 * delta;

	stars.forEach((star) => {
		star.material.color = new THREE.Color(
			`hsl(255, 100%, ${lightness >= 100 ? (lightness = 0) : Math.ceil((lightness += 0.1))}%)`
		);
		// star.material.opacity = getRandomInt(75, 100) / 100;
		// star.material.color = new THREE.Color(generateStarColour());
	});
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

const compose = () => {
	const renderScene = new RenderPass(scene, camera);
	// const effectBloom = new BloomPass(1.25);
	// const effectFilm = new FilmPass(0.35, 0.95, 2048, false);
	// composer = new EffectComposer(renderer);

	// const params = {
	// 	exposure: 1,
	// 	bloomStrength: 5,
	// 	bloomThreshold: 0,
	// 	bloomRadius: 0,
	// 	scene: "Scene with Glow"
	// };

	// const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
	// bloomPass.threshold = 0;
	// bloomPass.strength = 5;
	// bloomPass.radius = 0;

	// composer.renderToScreen = false;
	// composer.addPass(renderScene);
	// composer.addPass(bloomPass);

	// composer.addPass(renderModel);
	// composer.addPass(effectBloom);
	// composer.addPass(effectFilm);
	// composer.addPass(shaderPass);
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.outputEncoding = THREE.sRGBEncoding; // lights it up!
	camera.position.z = 5;

	animate();
	addElements();

	console.log(scene);
};

init();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});
