'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { getStandardDeviation } from './modules/utils';
import { scene } from './modules/scene';
import { renderer } from './modules/renderer';
import { star } from './modules/objects';
import { sun } from './modules/sun';
import { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune } from './modules/planets';
import { skybox } from './modules/skybox';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { Color } from 'three';

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
let composer, outlinePass, clickHoldTimeout;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 4;
controls.maxDistance = 100;
controls.enableKeys = true;
controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW',
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS'
};
controls.listenToKeyEvents(document);

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const stars = [];
const planets = [];
const _orbitVisibilityCheckbox = document.querySelector('#orbit-lines');
const _orbitVisibilityDefault = 0.06;
const _defaultOutlineEdgeStrength = 2;

const setOrbitVisibility = () => (_orbitVisibilityCheckbox.checked ? _orbitVisibilityDefault : 0);

// custom UV map so textures can curve correctly (looking at you, rings of Saturn)
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

	sun.name = 'sun';
	sun.clickable = true;
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

		planetMesh.name = `${planet.name} planet`;
		planetMesh.clickable = true;
		planetMesh.rotation.y = THREE.MathUtils.randFloatSpread(360);
		planetMesh.orbitRadius = planet.orbitRadius;

		planetMesh.rotSpeed = 0.005 + Math.random() * 0.01;
		planetMesh.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
		planetMesh.orbitSpeed = 0.009 / planet.orbitRadius;

		// sets the initial position of each planet
		planetMesh.orbit = Math.random() * Math.PI * 2;

		planetMesh.position.set(
			Math.cos(planetMesh.orbit) * planetMesh.orbitRadius,
			0,
			Math.sin(planetMesh.orbit) * planetMesh.orbitRadius
		);

		if (planet.moons && planet.moons.length) {
			planet.moons.forEach((moon) => {
				const moonMesh = new THREE.Mesh(
					moon.geometry,
					new THREE.MeshStandardMaterial({
						...moon.material
					})
				);

				moonMesh.clickable = true;
				moonMesh.orbit = Math.random() * Math.PI * 2;
				moonMesh.orbitRadius = moon.orbitRadius;
				moonMesh.orbitSpeed = 0.15 / moon.orbitRadius;
				moonMesh.position.x = planetMesh.position.x;
				moonMesh.position.y = planetMesh.position.y;
				moonMesh.position.z = planetMesh.position.z;

				planetMesh.moonMeshes = planetMesh.moonMeshes || [];
				planetMesh.moonMeshes.push(moonMesh);
				scene.add(moonMesh);

				// and to set an orbit line...
				const moonOrbitLine = new THREE.Line(
					new THREE.RingGeometry(moonMesh.orbitRadius, moonMesh.orbitRadius, 90),
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

	// Lights
	const pointLight = new THREE.PointLight(0xffffff, 1, 4, 0);
	pointLight.position.set(0, 3, 0);

	const ambientLight = new THREE.AmbientLight(0x090909, 4);
	// const lightHelper = new PointLightHelper(pointLight);
	scene.add(pointLight, ambientLight);
};

let lightness = 0;

const render = () => {
	const delta = 5 * clock.getDelta();
	// sun.material.uniforms.time.value += 0.2 * delta;
	// sun.rotation.y += 0.0125 * delta;

	planets.forEach((planet) => {
		planet.rotation.y += planet.rotSpeed * delta;
		planet.orbit += planet.orbitSpeed;
		planet.position.set(Math.cos(planet.orbit) * planet.orbitRadius, 0, Math.sin(planet.orbit) * planet.orbitRadius);

		if (planet.moonMeshes && planet.moonMeshes.length) {
			planet.moonMeshes.forEach((moon) => {
				moon.orbit -= moon.orbitSpeed * delta;
				moon.position.set(
					planet.position.x + Math.cos(moon.orbit) * moon.orbitRadius,
					planet.position.y,
					planet.position.z + Math.sin(moon.orbit) * moon.orbitRadius
				);

				if (moon.moonOrbitLine) {
					moon.moonOrbitLine.position.set(planet.position.x, planet.position.y, planet.position.z);
					moon.rotation.z -= 0.01 * delta;
				}
			});
		}

		if (planet.ringMeshes && planet.ringMeshes.length) {
			planet.ringMeshes.forEach((ring) => {
				ring.position.set(planet.position.x, planet.position.y, planet.position.z);
				ring.rotation.z += 0.01 * delta;
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
	render();

	renderer.render(scene, camera);
	composer.render();
};

const initMousePointerOrbitEvents = () => {
	const v3 = new THREE.Vector3();
	let intersects = [];
	let objsClickable = [];
	let hasClickedSameTarget = false;

	window.addEventListener('pointerdown', (e) => {
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		intersects = raycaster.intersectObjects(scene.children);
		objsClickable = intersects.filter((intersect) => intersect.object.clickable);

		hasClickedSameTarget =
			(objsClickable.length &&
				outlinePass.selectedObjects.map((obj) => obj.name).indexOf(objsClickable[0].object.name) !== -1) ||
			false;

		// only add an object if it's clickable and doesn't already exist in the clicked array
		if (objsClickable.length && !hasClickedSameTarget) {
			controls.target = objsClickable[0].object.position;
			outlinePass.selectedObjects = [];
			outlinePass.selectedObjects.push(objsClickable[0].object);
			outlinePass.edgeStrength = _defaultOutlineEdgeStrength;

			// const decreaseThickness = setInterval(() => {
			// 	outlinePass.edgeStrength -= 1;

			// 	if (outlinePass.edgeStrength === 0) {
			// 		console.log('clear it!');
			// 		clearInterval(decreaseThickness);
			// 		outlinePass.selectedObjects = [];
			// 	}
			// }, 1);
		}
	});

	window.addEventListener('pointerup', (e) => {
		// check pointer position deviation for x + y to see if we should unlock the camera from its target
		const oldMousePos = [mouse.x, mouse.y];
		const newMousePos = [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1];
		const xDeviation = getStandardDeviation([oldMousePos[0], newMousePos[0]]),
			yDeviation = getStandardDeviation([oldMousePos[1], newMousePos[1]]);

		// console.log({ xDeviation, yDeviation });
		const mouseHasDeviated = Math.abs(xDeviation) > 0.002 || Math.abs(yDeviation) > 0.002;

		// after releasing click, if mouse has deviated (we're playing with orbit controls), KEEP the target!
		// also check that the same target hasn't been clicked, and that whatever has been clicked on is NOT clickable
		// console.log({ mouseHasDeviated, timerPassed, hasClickedSameTarget, selectedObjects: outlinePass.selectedObjects });
		if (!mouseHasDeviated && !hasClickedSameTarget && !objsClickable.length) {
			if (outlinePass.selectedObjects.length) {
				const { x, y, z } = outlinePass.selectedObjects[0].position;
				v3.set(x, y, z);
				controls.target = v3;
				controls.update();
				outlinePass.selectedObjects = [];
			}
		}
	});
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.outputEncoding = THREE.sRGBEncoding; // lights it up!
	// camera.position.y = 2;
	camera.position.y = 12;
	camera.position.z = 40;

	composer = new EffectComposer(renderer);
	const renderModel = new RenderPass(scene, camera);
	// const effectBloom = new BloomPass(1.25);
	// const effectFilm = new FilmPass(0.35, 0.95, 2048, false);

	outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
	outlinePass.edgeStrength = _defaultOutlineEdgeStrength;
	outlinePass.edgeGlow = 1;
	outlinePass.edgeThickness = 1;
	outlinePass.visibleEdgeColor = new Color(0xffffff);
	outlinePass.hiddenEdgeColor = new Color(0x190a05);
	// outlinePass.pulsePeriod = 5;
	outlinePass.clear = false;

	composer.addPass(renderModel);
	// composer.addPass(effectBloom);
	composer.addPass(outlinePass);
	// composer.addPass(effectFilm);

	window.composer = composer;

	animate();
	addElements();
	initMousePointerOrbitEvents();

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
