'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { scene } from './modules/scene';
import { renderer } from './modules/renderer';
import { star } from './modules/objects';
import { sun } from './modules/sun';
import { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune } from './modules/planets';
import { skybox } from './modules/skybox';

import { PointLight, AmbientLight, PointLightHelper } from 'three';

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);

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

const clock = new THREE.Clock();
const stars = [];
const planets = [];
const _orbitVisibilityCheckbox = document.querySelector('#orbit-lines');
const _orbitVisibilityDefault = 0.08;

const setOrbitVisibility = () => (_orbitVisibilityCheckbox.checked ? _orbitVisibilityDefault : 0);

// custom UV map so textures can curve correctly
const ringUVMapGeometry = (from, to) => {
	const geometry = new THREE.RingBufferGeometry(from, to, 90);
	const pos = geometry.attributes.position;
	const v3 = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		v3.fromBufferAttribute(pos, i);
		geometry.attributes.uv.setXY(i, v3.length() < (from + to) / 2 ? 0 : 1, 1);
	}

	return geometry;
};

const addElements = () => {
	// moon.position.z = 30;
	// moon.position.x = -10;

	scene.add(sun);
	scene.add(skybox);

	// let's add a bunch of planets
	[mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach((planet) => {
		const planetMesh = new THREE.Mesh(
			planet.geometry,
			new THREE.MeshStandardMaterial({
				...planet.material
			})
		);

		planetMesh.name = planet.name;
		planetMesh.rotation.y = THREE.MathUtils.randFloatSpread(360);
		planetMesh.orbitRadius = planet.orbitRadius;

		planetMesh.rotSpeed = 0.005 + Math.random() * 0.01;
		planetMesh.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
		planetMesh.rot = Math.random();
		planetMesh.orbitSpeed = 0.009 / planet.orbitRadius;

		// this part is OK
		planetMesh.orbit = Math.random() * Math.PI * 2;

		planetMesh.position.set(
			Math.cos(planetMesh.orbit) * planetMesh.orbitRadius,
			0,
			Math.sin(planetMesh.orbit) * planetMesh.orbitRadius
		);

		if (planet.moons && planet.moons.length) {
			planet.moons.forEach((moon) => {
				console.log(moon);
				const moonMesh = new THREE.Mesh(
					moon.geometry,
					new THREE.MeshStandardMaterial({
						...moon.material
					})
				);

				moonMesh.distanceFromPlanet = moon.distanceFromPlanet;
				moonMesh.position.x = planetMesh.position.x;
				moonMesh.position.y = planetMesh.position.y;
				moonMesh.position.z = planetMesh.position.z;

				planetMesh.moonMeshes = planetMesh.moonMeshes || [];
				planetMesh.moonMeshes.push(moonMesh);
				scene.add(moonMesh);

				// and to set an orbit line...
				const moonOrbitLine = new THREE.Line(
					new THREE.RingGeometry(moonMesh.distanceFromPlanet, moonMesh.distanceFromPlanet, 90),
					new THREE.MeshBasicMaterial({
						color: 0xffffff,
						transparent: true,
						opacity: setOrbitVisibility() / 2,
						side: THREE.BackSide
					})
				);
				moonMesh.moonOrbitLine = moonOrbitLine;
				moonOrbitLine.position.set(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z);
				moonOrbitLine.rotation.x = THREE.Math.degToRad(90); // to set them from vertical to horizontal
				moonOrbitLine.name = `${planetMesh.name} moon orbit line`;
				scene.add(moonOrbitLine);
			});
		}

		if (planet.rings && planet.rings.length) {
			planet.rings.forEach((ring) => {
				const ringMesh = new THREE.Mesh(
					ringUVMapGeometry(2.4, 5),
					new THREE.MeshBasicMaterial({
						...ring.material
					})
				);

				ringMesh.name = ring.name;
				ringMesh.rotation.x = THREE.Math.degToRad(75);
				ringMesh.position.set(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z);
				planetMesh.ringMeshes = planetMesh.ringMeshes || [];
				planetMesh.ringMeshes.push(ringMesh);
				scene.add(ringMesh);
			});
		}

		const orbit = new THREE.Line(
			new THREE.RingGeometry(planetMesh.orbitRadius, planetMesh.orbitRadius, 90),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: setOrbitVisibility(),
				side: THREE.BackSide
			})
		);
		orbit.rotation.x = THREE.Math.degToRad(90); // to set them from vertical to horizontal
		orbit.name = `${planetMesh.name} orbit line`;
		planetMesh.orbitMesh = orbit;
		planets.push(planetMesh);
		scene.add(orbit, planetMesh);
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
	// sun.material.uniforms.time.value += 0.2 * delta;
	// sun.rotation.y += 0.0125 * delta;

	planets.forEach((planet) => {
		planet.rotation.y += 0.0125 * delta;
		planet.orbit += planet.orbitSpeed;
		planet.position.set(Math.cos(planet.orbit) * planet.orbitRadius, 0, Math.sin(planet.orbit) * planet.orbitRadius);

		if (planet.moonMeshes && planet.moonMeshes.length) {
			planet.moonMeshes.forEach((moonMesh) => {
				// planet.position.set(Math.cos(planet.orbit) * planet.orbitRadius, 0, Math.sin(planet.orbit) * planet.orbitRadius);
				moonMesh.position.set(planet.position.x + moonMesh.distanceFromPlanet, planet.position.y, planet.position.z);

				if (moonMesh.moonOrbitLine) {
					moonMesh.moonOrbitLine.position.set(planet.position.x, planet.position.y, planet.position.z);
					moonMesh.rotation.z -= 0.01 * delta;
				}
			});
		}

		if (planet.ringMeshes && planet.ringMeshes.length) {
			planet.ringMeshes.forEach((ringMesh) => {
				ringMesh.position.set(planet.position.x, planet.position.y, planet.position.z);
				ringMesh.rotation.z += 0.01 * delta;
			});
		}
	});

	// stars.forEach((star) => {
	// 	star.material.color = new THREE.Color(
	// 		`hsl(255, 100%, ${lightness >= 100 ? (lightness = 0) : Math.ceil((lightness += 0.1))}%)`
	// 	);
	// });
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
	camera.position.y = 8;
	camera.position.z = 18;

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

_orbitVisibilityCheckbox.addEventListener('change', () => {
	planets.forEach((planet) => {
		planet.orbitMesh.material.opacity = setOrbitVisibility();
		if (planet.moonMeshes && planet.moonMeshes.length) {
			planet.moonMeshes.forEach((moon) => (moon.moonOrbitLine.material.opacity = setOrbitVisibility()));
		}
	});
});
