'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
// TODO: Check out the examples!
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { getStandardDeviation, createCircleTexture } from './modules/utils';
import { scene } from './modules/scene';
import { renderer } from './modules/renderer';
import { setAsteroidPosition } from './modules/objects';
import { loadManager } from './modules/loadManager';
import { sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune } from './modules/celestialBodies';
import { skyboxTexturePaths } from './modules/skybox';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
window.camera = camera;
let composer, outlinePass, sunMesh, sunMaterial, sunMaterialPerlin, sunAtmosphere, scene1;
let delta;
let targetObject;
let cameraEasingincrementer = 0.01;

const controls = new OrbitControls(camera, renderer.domElement);
window.controls = controls;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 650;
controls.enableKeys = true;
controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW',
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS'
};
controls.listenToKeyEvents(document);

const loader = new THREE.TextureLoader(loadManager());
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const planets = [],
	orbitLines = [],
	labelLines = [];
const starfield = new THREE.Object3D();
starfield.name = 'starfield';
const orbitCentroid = new THREE.Object3D();
let cubeRenderTarget1, cubeCamera1, sunMeshPerlin;
let easeToTarget = false;
orbitCentroid.name = 'orbit centroid';

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
	scene1 = new THREE.Scene();

	// start: Skybox
	const skyboxMaterialArray = skyboxTexturePaths.map(
		(image) => new THREE.MeshBasicMaterial({ map: loader.load(image), side: THREE.BackSide })
	);
	const skybox = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyboxMaterialArray);
	skybox.name = 'skybox';
	scene.add(skybox);
	// end: Skybox

	// start: Sun Mesh (with standard material)
	// TODO: switch this from Shader to Standard depending on mobile vs desktop
	sunMaterial = new THREE.MeshStandardMaterial({
		map: loader.load(sun.material.map),
		emissive: '#FFF',
		emissiveMap: loader.load(sun.material.map),
		emissiveIntensity: 0.6,
		side: THREE.DoubleSide
	});

	sunMesh = new THREE.Mesh(sun.geometry, sunMaterial);
	sunMesh.name = 'sun';
	sunMesh.clickable = true;
	const sunObj = new THREE.Object3D();
	sunObj.add(sunMesh);
	sunObj.name = 'sun group';
	scene.add(sunObj);
	// end: Sun Mesh

	// adding a bunch of planets
	[mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach((planet) => {
		const planetObj = new THREE.Object3D();
		const { size, segments, material } = planet;
		const { map, normal } = material;
		const textureMap = map ? loader.load(map) : null;
		const normalMap = normal ? loader.load(normal) : null;

		const planetMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(size, segments, segments),
			new THREE.MeshStandardMaterial({
				map: textureMap,
				normalMap: normalMap,
				wireframe: false
			})
		);
		planetObj.add(planetMesh);

		planetMesh.name = `${planet.name} planet`;
		planetObj.name = `${planet.name} group`;
		planetMesh.clickable = true;
		planetObj.rotation.y = THREE.MathUtils.randFloatSpread(360);
		planetObj.orbitRadius = planet.orbitRadius;

		// TODO: put this in .data
		planetObj.rotSpeed = 0.005 + Math.random() * 0.01;
		planetObj.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
		planetObj.orbitSpeed = 0.009 / planetObj.orbitRadius;

		planetObj.add(planetMesh);

		// sets the initial position of each planet along its orbit
		planetObj.orbit = Math.random() * Math.PI * 2;

		planetObj.position.set(
			Math.cos(planetObj.orbit) * planetObj.orbitRadius,
			0,
			Math.sin(planetObj.orbit) * planetObj.orbitRadius
		);

		if (planet.moons && planet.moons.length) {
			planet.moons.forEach((moon) => {
				const { size, segments, material } = moon;
				const moonObj = new THREE.Object3D();
				const moonMesh = new THREE.Mesh(
					new THREE.SphereBufferGeometry(size, segments, segments),
					new THREE.MeshStandardMaterial({
						map: loader.load(material.map),
						normalMap: loader.load(material.normalMap)
					})
				);

				// each moon group to be in separate group away from planet, or else the OrbitControls targeting will screw up!!
				moonMesh.clickable = true;
				moonObj.orbit = Math.random() * Math.PI * 2;
				moonObj.orbitRadius = moon.orbitRadius;
				moonObj.orbitSpeed = 0.05 / moon.orbitRadius;

				moonObj.position.set(planetObj.position.x, planetObj.position.y, planetObj.position.z);

				moonMesh.name = `${moon.name} moon`;
				moonObj.name = `${moon.name} group`;

				planetObj.moonMeshes = planetObj.moonMeshes || [];
				planetObj.moonMeshes.push(moonObj);
				moonObj.add(moonMesh);
				scene.add(moonObj);

				const labelLine = new THREE.Line(
					new THREE.RingGeometry(moon.size + 0.25, moon.size + 0.25, 90),
					new THREE.MeshBasicMaterial({
						color: moon.labelColour,
						transparent: true,
						opacity: 0.15,
						side: THREE.BackSide
					})
				);
				labelLines.push(labelLine);
				// moonObj.add(labelLine);

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
				moonObj.moonOrbitLine = moonOrbitLine;
				moonOrbitLine.rotation.x = THREE.Math.degToRad(90); // to set them from vertical to horizontal
				moonOrbitLine.name = `${planetMesh.name} moon orbit line`;
				orbitLines.push(moonOrbitLine);
				planetObj.add(moonOrbitLine);
			});
		}

		if (planet.rings && planet.rings.length) {
			planet.rings.forEach((ring) => {
				const ringMesh = new THREE.Mesh(
					ringUVMapGeometry(2.4, 5),
					new THREE.MeshBasicMaterial({
						...ring.material,
						map: loader.load(ring.material.map)
					})
				);

				ringMesh.name = ring.name;
				ringMesh.rotation.x = THREE.Math.degToRad(75);
				ringMesh.position.set(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z);
				planetMesh.ringMeshes = planetMesh.ringMeshes || [];
				planetMesh.ringMeshes.push(ringMesh);
				planetObj.add(ringMesh);
			});
		}

		const orbit = new THREE.Line(
			new THREE.RingGeometry(planetObj.orbitRadius, planetObj.orbitRadius, 90),
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

		const labelLine = new THREE.Line(
			new THREE.RingGeometry(planet.size + 0.25, planet.size + 0.25, 90),
			new THREE.MeshBasicMaterial({
				color: planet.labelColour,
				transparent: true,
				opacity: 0.15,
				side: THREE.BackSide
			})
		);

		labelLines.push(labelLine);
		// planetObj.add(labelLine);

		// planetObj.add(orbit); // can't do this, the rings will wrap around planet rather than sun
		planets.push(planetObj);
		orbitLines.push(orbit);
		scene.add(orbit, planetObj);
	});

	const createStarfield = () => {
		const stars = 10000;
		const spreadAmount = 1500;
		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(stars * 3);

		const material = {
			size: 0.5,
			map: createCircleTexture('#FFF', 256),
			blending: THREE.AdditiveBlending,
			transparent: true,
			opacity: 0.4,
			color: new THREE.Color(0xffffff),
			depthWrite: false
		};

		const randFloatSpread = (x) => THREE.MathUtils.randFloatSpread(x); // to keep JS Hint happy
		for (let i = 0; i < positions.length; i += 3) {
			const [x, y, z] = Array(3)
				.fill()
				.map(() => randFloatSpread(spreadAmount));
			positions[i] = x;
			positions[i + 1] = y;
			positions[i + 2] = z;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();
		const starFieldSystem = new THREE.Points(geometry, new THREE.PointsMaterial({ ...material }));
		starfield.add(starFieldSystem);

		return starfield;
	};
	scene.add(createStarfield());

	// Asteroids
	const addAsteroids = () => {
		const particles = 2000;
		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(particles * 3);

		const material = {
			size: 0.1,
			map: createCircleTexture('#FFF', 256),
			transparent: true,
			opacity: 0.5,
			color: new THREE.Color(0xffffff),
			depthWrite: false
		};

		for (let i = 0; i < positions.length; i += 3) {
			const { x, y, z } = setAsteroidPosition(i);
			positions[i] = x;
			positions[i + 2] = y;
			positions[i + 3] = z;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();

		const particleSystem = new THREE.Points(geometry, new THREE.PointsMaterial({ ...material }));
		orbitCentroid.add(particleSystem);
		return orbitCentroid;
	};
	scene.add(addAsteroids());

	// Lighting
	// point lights
	for (let i = 0; i < 2; i++) {
		const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
		// const lightHelper = new THREE.PointLightHelper(pointLight);
		const positionAdjuster = i % 2 === 0 ? 20 : -20;
		pointLight.position.set(0, positionAdjuster, 0);
		scene.add(pointLight);
		// scene.add(lightHelper);
	}

	// spot lights
	for (let i = 0; i < 5; i++) {
		const settings = {
			color: 0xffffff,
			intensity: 0.5,
			distance: 0,
			angle: Math.PI / 3,
			penumbra: 1
		};
		const { color, intensity, distance, angle, penumbra } = settings;
		const spotLight = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
		const positionAdjuster = i % 2 === 0 ? 10 : -10;
		// const spotLightHelper = new THREE.SpotLightHelper(spotLight);

		const positions = {
			x: i < 2 ? positionAdjuster : 0,
			y: i >= 2 && i < 3 ? positionAdjuster : 0,
			z: i >= 3 ? positionAdjuster : 0
		};
		const { x, y, z } = positions;
		spotLight.position.set(x, y, z);

		scene.add(spotLight);
	}

	// ambient light
	const ambientLight = new THREE.AmbientLight(0x090909, 10);
	scene.add(ambientLight);
};

const render = () => {
	// sunAtmosphere.lookAt(camera.position); // is a bit shit on its own
	// sunAtmosphere.quaternion.copy(camera.quaternion);
	controls.update();
	renderer.render(scene, camera);
	delta = 5 * clock.getDelta();
	// orbitCentroid.rotation.y -= 0.000425 * delta;

	labelLines.forEach((line) => line.lookAt(camera.position));

	if (easeToTarget && Object.keys(targetObject).length) {
		cameraEasingincrementer += 0.0035;
		const movementChecks = {
			x: {
				moveCamera: (controls.target.x -= (controls.target.x - targetObject.position.x) / 10),
				moveStop:
					targetObject.position.x - controls.target.x < 0.01 && -0.01 <= targetObject.position.x - controls.target.x
			},
			y: {
				moveCamera: (controls.target.y -= (controls.target.y - targetObject.position.y) / 10),
				moveStop:
					targetObject.position.y - controls.target.y < 0.01 && -0.01 <= targetObject.position.y - controls.target.y
			},
			z: {
				moveCamera: (controls.target.z -= (controls.target.z - targetObject.position.z) / 10),
				moveStop:
					targetObject.position.z - controls.target.z < 0.01 && -0.01 <= targetObject.position.z - controls.target.z
			}
		};

		if (!movementChecks.x.moveStop) controls.target.x = movementChecks.x.moveCamera;
		if (!movementChecks.y.moveStop) controls.target.y = movementChecks.y.moveCamera;
		if (!movementChecks.z.moveStop) controls.target.z = movementChecks.z.moveCamera;

		if (movementChecks.x.moveStop && movementChecks.y.moveStop && movementChecks.z.moveStop) {
			easeToTarget = false;
		}
	}

	planets.forEach((planetGroup) => {
		planetGroup.rotation.y += planetGroup.rotSpeed * delta;
		planetGroup.orbit += planetGroup.orbitSpeed;
		planetGroup.position.set(
			Math.cos(planetGroup.orbit) * planetGroup.orbitRadius,
			0,
			Math.sin(planetGroup.orbit) * planetGroup.orbitRadius
		);
		if (planetGroup.moonMeshes && planetGroup.moonMeshes.length) {
			planetGroup.moonMeshes.forEach((moonGroup) => {
				moonGroup.orbit -= moonGroup.orbitSpeed * delta;
				moonGroup.position.set(
					planetGroup.position.x + Math.cos(moonGroup.orbit) * moonGroup.orbitRadius,
					0,
					planetGroup.position.z + Math.sin(moonGroup.orbit) * moonGroup.orbitRadius
				);
				moonGroup.rotation.z -= 0.01 * delta;
			});
		}
		if (planetGroup.ringMeshes && planetGroup.ringMeshes.length) {
			planetGroup.ringMeshes.forEach((ring) => {
				ring.position.set(planetGroup.position.x, planetGroup.position.y, planetGroup.position.z);
				ring.rotation.z += 0.01 * delta;
			});
		}
	});
};

const animate = () => {
	window.requestAnimationFrame(animate);

	// render == DRAW
	render();

	composer.render();
};

const initMousePointerOrbitEvents = () => {
	let intersects = [];
	let objsClickable = [];

	const hasClickedSameTarget =
		objsClickable.length &&
		outlinePass.selectedObjects.map((obj) => obj.name).indexOf(objsClickable[0].object.name) !== -1;

	const returnClickableTarget = (e) => {
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		intersects = raycaster.intersectObjects(scene.children, true);
		objsClickable = intersects.filter((intersect) => intersect.object.clickable);
		return objsClickable || [];
	};

	const addSelectedObject = (obj) => {
		outlinePass.selectedObjects = [];
		outlinePass.selectedObjects.push(obj);
	};

	// window.addEventListener('dblclick', (e) => {
	// 	const objsClickable = returnClickableTarget(e);

	// 	if (objsClickable.length) {
	// 		console.log('shift it!');
	// 	}
	// });

	window.addEventListener('pointerdown', (e) => {
		const objsClickable = returnClickableTarget(e);

		// only add an object if it's clickable and doesn't already exist in the clicked array
		if (objsClickable.length && !hasClickedSameTarget) {
			// Note that we're selecting the PARENT 3D Object here, not the clicked mesh
			// This is because since the mesh is bound to its parent, it's xyz is 0,0,0 and therefore useless
			if (objsClickable[0].object.parent.type !== 'Scene') {
				// this needs to be a new var!
				targetObject = objsClickable[0].object.parent;
				easeToTarget = true;
			}

			controls.update();
			addSelectedObject(objsClickable[0].object);
		}
	});

	window.addEventListener('pointerup', (e) => {
		// check pointer position deviation for x + y to see if we should unlock the camera from its target
		const oldMousePos = [mouse.x, mouse.y];
		const newMousePos = [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1];
		const xDeviation = getStandardDeviation([oldMousePos[0], newMousePos[0]]),
			yDeviation = getStandardDeviation([oldMousePos[1], newMousePos[1]]);

		const mouseHasDeviated = Math.abs(xDeviation) > 0.002 || Math.abs(yDeviation) > 0.002;

		// after releasing click, if mouse has deviated (we're playing with orbit controls), KEEP the target!
		// also check that the same target hasn't been clicked, and that whatever has been clicked on is NOT clickable
		// console.log({ mouseHasDeviated, timerPassed, hasClickedSameTarget, selectedObjects: outlinePass.selectedObjects });
		if (!mouseHasDeviated && !objsClickable.length && !hasClickedSameTarget && outlinePass.selectedObjects.length) {
			const { x, y, z } = outlinePass.selectedObjects[0].parent.position;
			// To make camera stop following
			easeToTarget = false;
			controls.target.set(x, y, z);
			controls.update();
			outlinePass.selectedObjects = [];
		}
	});
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.outputEncoding = THREE.sRGBEncoding; // lights it up!
	camera.position.y = 32;
	camera.position.z = 100;

	composer = new EffectComposer(renderer);
	const renderModel = new RenderPass(scene, camera);
	// const effectBloom = new BloomPass(1.25);
	// const effectFilm = new FilmPass(0.35, 0.95, 2048, false);

	outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
	outlinePass.edgeStrength = _defaultOutlineEdgeStrength;
	outlinePass.edgeGlow = 1;
	outlinePass.edgeThickness = 1;
	outlinePass.visibleEdgeColor = new THREE.Color(0xffffff);
	outlinePass.hiddenEdgeColor = new THREE.Color(0x190a05);
	// outlinePass.pulsePeriod = 5;
	outlinePass.clear = false;

	composer.addPass(renderModel);
	composer.addPass(outlinePass);

	window.composer = composer;

	addElements();
	animate();
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
	orbitLines.forEach((orbitLine) => {
		orbitLine.material.opacity = setOrbitVisibility();
	});
});
