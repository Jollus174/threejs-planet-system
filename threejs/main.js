'use strict';
import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { scene } from './modules/scene';
import { renderer } from './modules/renderer';
import { star } from './modules/objects';
import { sun } from './modules/planets/sun';
import { moon, mercury, venus, earth } from './modules/planets/planets';
import { skybox } from './modules/skybox';

import { PointLight, AmbientLight, PointLightHelper } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 4;
controls.maxDistance = 100;
controls.enableKeys = true;
controls.keys = {
	LEFT: 'KeyA', //left arrow
	UP: 'KeyW', // up arrow
	RIGHT: 'KeyD', // right arrow
	BOTTOM: 'KeyS' // down arrow
};
controls.listenToKeyEvents(document);
console.log(controls);

const clock = new THREE.Clock();

const stars = [];
const planets = [];
const orbits = [];

const planetsArr = [
	{
		mesh: mercury,
		orbitRadius: 5
	},
	{
		mesh: venus,
		orbitRadius: 8
	},
	{
		mesh: earth,
		orbitRadius: 11
	},
	{
		mesh: moon,
		orbitRadius: 18
	}
];

let composer;

const addElements = () => {
	// moon.position.z = 30;
	// moon.position.x = -10;

	scene.add(sun);
	scene.add(skybox);

	// let's add a bunch of planets
	planetsArr.forEach((p) => {
		const { geometry, material } = p.mesh;
		const planetMesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({
				...material
			})
		);
		planetMesh.rotation.y = THREE.MathUtils.randFloatSpread(360);
		planetMesh.name = 'planet';
		planetMesh.orbitRadius = p.orbitRadius;

		planetMesh.rotSpeed = 0.005 + Math.random() * 0.01;
		planetMesh.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
		planetMesh.rot = Math.random();
		planetMesh.orbitSpeed = (p.orbitRadius / 75) * 0.004;

		// this part is OK
		planetMesh.orbit = Math.random() * Math.PI * 2;

		planetMesh.position.set(
			Math.cos(planetMesh.orbit) * planetMesh.orbitRadius,
			0,
			Math.sin(planetMesh.orbit) * planetMesh.orbitRadius
		);

		const orbit = new THREE.Line(
			new THREE.CircleGeometry(planetMesh.orbitRadius, 90),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.08,
				side: THREE.BackSide
			})
		);
		orbit.rotation.x = THREE.Math.degToRad(90);
		orbit.name = 'orbit';
		// scene.add(orbit);
		planets.push(planetMesh);
		orbits.push(orbit);
		scene.add(planetMesh);
	});

	Array(3000)
		.fill()
		.forEach(() => {
			const { geometry, material } = star;
			const starMesh = new THREE.Mesh(
				geometry,
				new THREE.MeshStandardMaterial({
					...material,
					opacity: 1,
					color: new THREE.Color(`hsl(160, 0%, ${Math.floor(Math.random() * 100)}%)`)
				})
			);
			const [x, y, z] = Array(3)
				.fill()
				.map(() => THREE.MathUtils.randFloatSpread(100));
			starMesh.position.set(x, y, z);
			stars.push(starMesh);
			scene.add(starMesh);
		});

	const pointLight = new PointLight(0xffffff, 1, 4, 0);
	pointLight.position.set(0, 3, 0);

	const ambientLight = new AmbientLight(0x090909, 4);
	// const lightHelper = new PointLightHelper(pointLight);
	scene.add(pointLight, ambientLight);
};

let lightness = 0;

const render = () => {
	const delta = 5 * clock.getDelta();
	sun.material.uniforms.time.value += 0.2 * delta;

	planets.forEach((planet) => {
		planet.rotation.y += 0.0125 * delta;
		planet.orbit += planet.orbitSpeed;
		planet.position.set(Math.cos(planet.orbit) * planet.orbitRadius, 0, Math.sin(planet.orbit) * planet.orbitRadius);
	});

	// stars.forEach((star) => {
	// 	star.material.color = new THREE.Color(
	// 		`hsl(255, 100%, ${lightness >= 100 ? (lightness = 0) : Math.ceil((lightness += 0.1))}%)`
	// 	);
	// });

	sun.rotation.y += 0.0125 * delta;
};

const compose = () => {
	const renderScene = new RenderPass(scene, camera);
	const effectBloom = new BloomPass(1.25);
	// const effectFilm = new FilmPass(0.35, 0.95, 2048, false);
	composer = new EffectComposer(renderer);

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
	composer.addPass(renderScene);
	// composer.addPass(bloomPass);

	// composer.addPass(renderModel);
	composer.addPass(effectBloom);
	// composer.addPass(effectFilm);
	// composer.addPass(shaderPass);
};

const animate = () => {
	window.requestAnimationFrame(animate);

	controls.update();

	// render == DRAW
	// renderer.clear();
	render();
	// compose();
	renderer.render(scene, camera);
	// composer.render(0.01);
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.outputEncoding = THREE.sRGBEncoding; // lights it up!
	// camera.position.y = 2;
	camera.position.z = 30;

	animate();
	addElements();

	window.scene = scene;
	window.renderer = renderer;
	console.log(window.scene);
};

init();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

/* document.addEventListener('keydown', (e) => {
	console.log(e);
	if (e.code === 'Space') {
		console.log('is space!');
		orbits.forEach((orbit) => {
			// window.scene.remove(orbit)
			console.log(orbit);
		});
	}
});
 */
