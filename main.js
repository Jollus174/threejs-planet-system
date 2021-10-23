'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
// custom OrbitControls so can expose the dollyIn() and dollyOut() functions
import { OrbitControls } from './modules/custom/jsm/controls/OrbitControls';

import { getStandardDeviation, createCircleTexture, numberWithCommas } from './modules/utils';
import { renderer } from './modules/renderer';
import { setAsteroidPosition } from './modules/objects';
import { loadManager } from './modules/loadManager';
import { sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune } from './modules/celestialBodies';
import { skyboxTexturePaths } from './modules/skybox';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
const scene = new THREE.Scene();
window.camera = camera;
let composer, outlinePass, sunMesh, sunMaterial, sunMaterialPerlin, sunAtmosphere;
let delta;
let targetObject;

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
	BOTTOM: 'KeyS',
	IN: 'KeyR',
	OUT: 'KeyF'
};
controls.listenToKeyEvents(document);

const loader = new THREE.TextureLoader(loadManager());
const fontLoader = new THREE.FontLoader(loadManager());
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const planets = [],
	orbitLines = [],
	labelLines = [],
	textGroups = [];

const starfield = new THREE.Object3D();
starfield.name = 'starfield';
const orbitCentroid = new THREE.Object3D();
let cubeRenderTarget1, cubeCamera1, sunMeshPerlin;
let easeToTarget = false;
let zoomToTarget = false;

const dollySpeedMax = 0.95;
const dollySpeedMin = 0.999;

orbitCentroid.name = 'orbit centroid';

const _orbitVisibilityCheckbox = document.querySelector('#orbit-lines');
const _orbitVisibilityDefault = 0.06;

const textOpacityDefault = 0;

const setOrbitVisibility = () => (_orbitVisibilityCheckbox.checked ? _orbitVisibilityDefault : 0);
const calculatePlanetDistance = (planet) => camera.position.distanceTo(planet.position);

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
	// start: Skybox
	const skyboxMaterialArray = skyboxTexturePaths.map(
		(image) => new THREE.MeshBasicMaterial({ map: loader.load(image), side: THREE.BackSide })
	);
	const skybox = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyboxMaterialArray);
	skybox.name = 'skybox';
	scene.add(skybox);
	// end: Skybox

	// adding a bunch of planets
	[sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach((planet) => {
		const createLabelLine = (item, group) => {
			const labelGeometry = {
				origInnerRadius: item.size + 0.15,
				origOuterRadius: item.size + 0.15,
				origSegments: 90
			};
			const labelLine = new THREE.Mesh(
				new THREE.RingGeometry(
					labelGeometry.origInnerRadius,
					labelGeometry.origOuterRadius,
					labelGeometry.origSegments,
					1,
					labelGeometry.origThetaStart,
					labelGeometry.origThetaLength
				),
				new THREE.MeshBasicMaterial({
					color: item.labelColour,
					transparent: true,
					opacity: 0.8,
					blending: THREE.AdditiveBlending,
					side: THREE.FrontSide,
					depthTest: false,
					depthWrite: false
				})
			);
			labelLine.name = `${item.name} group label line`;
			labelLine.data = labelLine.data || [];
			labelLine.data.labelGeometryOriginal = labelGeometry;
			labelLine.data.planetIsTargeted = false;
			labelLines.push(labelLine);

			group.labelLine = labelLine;
			group.add(labelLine);
		};

		const createText = (item, group) => {
			const fontGroup = new THREE.Group();
			if (!item.name) return;

			const createTextMesh = (geo, color) => {
				const textMesh = new THREE.Mesh(geo, [
					new THREE.MeshBasicMaterial({
						color,
						side: THREE.FrontSide,
						depthTest: false,
						depthWrite: false,
						opacity: textOpacityDefault,
						transparent: true
					}), // front
					new THREE.MeshBasicMaterial({
						color,
						opacity: textOpacityDefault,
						transparent: true
					}) // side
				]);

				textMesh.renderOrder = 999;

				return textMesh;
			};

			const fontSettings = {
				bevelEnabled: false,
				curveSegments: 4,
				bevelThickness: 2,
				bevelSize: 1.5
			};

			fontLoader.load(`fonts/futura-lt_book.json`, (font) => {
				// am only including the uppercase glyphs for this
				const titleGeo = new THREE.TextGeometry(item.name.toUpperCase(), {
					font,
					size: 0.5,
					height: 0.05,
					...fontSettings
				});
				titleGeo.computeBoundingBox(); // for aligning the text

				const titleMesh = createTextMesh(titleGeo, item.labelColour);

				const centreOffsetY = -0.5 * (titleGeo.boundingBox.max.y - titleGeo.boundingBox.min.y);
				const rightOffset = titleGeo.boundingBox.min.x;
				const arbitraryExtraValue = 1;
				fontGroup.position.x = rightOffset; // will CENTRE the group, to use as a foundation for positioning other elements
				titleMesh.position.x = 0 - titleGeo.boundingBox.max.x - item.size - arbitraryExtraValue; // will align text to the LEFT of the planet
				titleMesh.position.y = centreOffsetY;
				titleMesh.name = `${item.name} title`;

				fontGroup.add(titleMesh);

				group.text = fontGroup;
				textGroups.push(fontGroup);

				fontLoader.load(`fonts/sylfaen_regular.json`, (font) => {
					const stats = item.stats || {};
					const { distanceToSun, diameter, spinTime, orbitTime, gravity } = stats;

					const textArray = [];
					const textValues = [
						distanceToSun ? `Distance to Sun: ${numberWithCommas(distanceToSun)} km` : null,
						diameter ? `Diameter: ${numberWithCommas(diameter)} km` : null,
						spinTime ? `Spin Time: ${spinTime} Days` : null,
						orbitTime ? `Orbit Time: ${numberWithCommas(orbitTime)} Days` : null,
						gravity ? `Gravity: ${gravity} G` : null
					];
					textValues.forEach((val) => {
						if (val !== null) textArray.push(val);
					});

					const descGeo = new THREE.TextGeometry(textArray.join('\n'), {
						font,
						size: 0.15,
						height: 0.01,
						...fontSettings
					});
					descGeo.computeBoundingBox(); // for aligning the text

					const descMesh = createTextMesh(descGeo, 0xffffff);
					descMesh.scale.set(planet.statsScale, planet.statsScale, planet.statsScale);

					const centreOffsetY = -0.5 * (descGeo.boundingBox.max.y - descGeo.boundingBox.min.y);
					const arbitraryExtraValue = 1;
					descMesh.position.x = item.size + arbitraryExtraValue; // will align text to the LEFT of the planet
					descMesh.position.y = 0 - centreOffsetY - 0.13; // this value seems to correct the v-alignment, not sure why
					descMesh.name = `${item.name} desc`;
					fontGroup.add(descMesh);
					fontGroup.name = `${item.name} text group`;
				});

				group.add(fontGroup);
			});
		};

		const createOrbitLine = (mesh, group, planetGroup) => {
			const orbit = new THREE.Line(
				new THREE.RingGeometry(group.data.orbitRadius, group.data.orbitRadius, 90),
				new THREE.MeshBasicMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: setOrbitVisibility(),
					side: THREE.BackSide
				})
			);
			orbit.rotation.x = THREE.Math.degToRad(90); // to set them from vertical to horizontal
			orbit.name = `${mesh.name} orbit line`;
			orbitLines.push(orbit);
			scene.add(orbit);

			if (planetGroup) planetGroup.add(orbit);
		};

		const planetGroup = new THREE.Group();
		const { size, segments, material } = planet;
		material.map = material.map ? loader.load(material.map) : null;
		material.normalMap = material.normalMap ? loader.load(material.normalMap) : null;
		material.emissiveMap = material.emissiveMap ? loader.load(material.emissiveMap) : null;

		const planetMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(size, segments, segments),
			new THREE.MeshStandardMaterial({
				...material,
				wireframe: false
			})
		);
		planetGroup.add(planetMesh);

		planetGroup.name = `${planet.name} group`;
		planetGroup.data = planetGroup.data || [];
		planetGroup.data.orbitRadius = planet.orbitRadius;
		planetGroup.data.rotSpeed = 0.005 + Math.random() * 0.01;
		planetGroup.data.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
		planetGroup.data.orbitSpeed = 0.009 / planetGroup.data.orbitRadius;
		planetGroup.data.orbit = Math.random() * Math.PI * 2; // sets the initial position of each planet along its orbit
		planetGroup.data.zoomTo = planet.zoomTo;
		planetGroup.rotation.y = THREE.MathUtils.randFloatSpread(360);
		planetGroup.position.set(
			Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
			0,
			Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
		);
		planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);

		planetMesh.name = `${planet.name} planet`;
		planetMesh.data = planetMesh.data || [];
		planetMesh.data.zoomTo = planet.zoomTo;
		planetMesh.data.clickable = true;
		planetMesh.size = planet.size;

		if (planet.moons && planet.moons.length) {
			planet.moons.forEach((moon) => {
				const { size, segments, material } = moon;
				const moonGroup = new THREE.Group();
				const moonMesh = new THREE.Mesh(
					new THREE.SphereBufferGeometry(size, segments, segments),
					new THREE.MeshStandardMaterial({
						map: loader.load(material.map),
						normalMap: loader.load(material.normalMap)
					})
				);

				// each moon group to be in separate group away from planet, or else the OrbitControls targeting will screw up!!
				moonGroup.name = `${moon.name} group`;
				moonGroup.data = moonGroup.data || [];
				moonGroup.data.orbit = Math.random() * Math.PI * 2;
				moonGroup.data.orbitRadius = moon.orbitRadius;
				moonGroup.data.orbitSpeed = 0.05 / moon.orbitRadius;
				moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);
				moonGroup.data.zoomTo = moon.zoomTo;
				moonGroup.position.set(planetGroup.position.x, planetGroup.position.y, planetGroup.position.z);
				planetGroup.moonMeshes = planetGroup.moonMeshes || [];
				planetGroup.moonMeshes.push(moonGroup);

				moonMesh.name = `${moon.name} moon`;
				moonMesh.data = moonMesh.data || [];
				moonMesh.data.size = moon.size;
				moonMesh.data.clickable = true;

				createText(moon, moonGroup);
				createLabelLine(moon, moonGroup);
				createOrbitLine(moon, moonGroup, planetGroup);

				moonGroup.add(moonMesh);
				scene.add(moonGroup);
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
				planetGroup.add(ringMesh);
			});
		}

		createLabelLine(planet, planetGroup);
		createOrbitLine(planet, planetGroup);
		createText(planet, planetGroup);

		// planetGroup.add(orbit); // can't do this, the rings will wrap around planet rather than sun
		planets.push(planetGroup);
		scene.add(planetGroup);
	});

	const createStarfield = () => {
		const stars = 18000;
		const spreadAmount = 900;
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

// returns a value that we should iterate over
// chuck this in the render() function for it to work
const easeTo = ({ from = null, to = null, incrementer = 10 } = {}) => {
	return (to - from) / incrementer;
};

const render = () => {
	delta = 5 * clock.getDelta();
	orbitCentroid.rotation.y -= 0.000425 * delta;

	labelLines.forEach((labelLine) => {
		labelLine.lookAt(camera.position);

		let innerRadius = labelLine.geometry.parameters.innerRadius;
		let outerRadius = labelLine.geometry.parameters.outerRadius;
		const { origOuterRadius, origSegments } = labelLine.data.labelGeometryOriginal;

		let regenerate = false;
		if (labelLine.data.planetIsTargeted) {
			if (outerRadius < origOuterRadius + 0.25) {
				outerRadius += easeTo({ from: outerRadius, to: origOuterRadius + 0.25, incrementer: 15 });
				regenerate = true;
			}
			if (regenerate) {
				labelLine.geometry.dispose(); // running this is recommended but seems pointless
				labelLine.geometry = new THREE.RingGeometry(innerRadius, outerRadius, origSegments);
			}
		} else {
			if (outerRadius > origOuterRadius) {
				// will interpolate linearly
				outerRadius += easeTo({ from: outerRadius + 0.5, to: origOuterRadius, incrementer: 50 });
				regenerate = true;
			}

			if (regenerate) {
				labelLine.geometry.dispose();
				labelLine.geometry = new THREE.RingGeometry(innerRadius, outerRadius, origSegments);
			}
		}
	});

	textGroups.forEach((textGroup) => textGroup.lookAt(camera.position));

	if (easeToTarget && targetObject && Object.keys(targetObject).length) {
		const easeX = easeTo({ from: controls.target.x, to: targetObject.position.x });
		const easeY = easeTo({ from: controls.target.y, to: targetObject.position.y });
		const easeZ = easeTo({ from: controls.target.z, to: targetObject.position.z });
		if (easeX) controls.target.x += easeX;
		if (easeY) controls.target.y += easeY;
		if (easeZ) controls.target.z += easeZ;

		if (!easeX && !easeY && !easeZ) {
			easeToTarget = false;
			// this line causes the sun to lock itself to the camera and then move around with it. Very strange
			// 	controls.target = targetObject.position; // this will make sure the camera is locked to the target and will persist after easing
		}
	}

	if (zoomToTarget && outlinePass.selectedObjects.length) {
		const objZoomTo = outlinePass.selectedObjects[0].data.zoomTo || 0;

		const distanceToTarget = controls.getDistance();
		const distCalc = Math.max(10, objZoomTo);

		if (distanceToTarget > distCalc) {
			const amountComplete = distCalc / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (dollySpeedMin - dollySpeedMax) * amountComplete;
			const dollySpeed = Math.min(dollySpeedMax + amountToIncrease, dollySpeedMin);
			controls.dollyIn(dollySpeed);
		} else {
			zoomToTarget = false;
		}
	}

	const fadeTextOpacity = (group, text) => {
		if (
			outlinePass &&
			outlinePass.selectedObjects &&
			outlinePass.selectedObjects.length &&
			outlinePass.selectedObjects[0].parent.name === group.name &&
			group.data.cameraDistance < group.data.zoomTo + 4
		) {
			text.material.forEach((m) => {
				m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
			});
		} else {
			text.material.forEach((m) => {
				m.opacity = m.opacity > textOpacityDefault ? (m.opacity -= 0.05) : 0;
			});
		}
	};

	planets.forEach((planetGroup) => {
		planetGroup.rotation.y += planetGroup.data.rotSpeed * delta;
		planetGroup.data.orbit += planetGroup.data.orbitSpeed;
		planetGroup.position.set(
			Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
			0,
			Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
		);
		planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);
		if (planetGroup.text) {
			planetGroup.text.children.forEach((text) => {
				fadeTextOpacity(planetGroup, text);
			});
		}

		if (planetGroup.moonMeshes && planetGroup.moonMeshes.length) {
			planetGroup.moonMeshes.forEach((moonGroup) => {
				moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);
				moonGroup.data.orbit -= moonGroup.data.orbitSpeed * delta;
				moonGroup.position.set(
					planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
					0,
					planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
				);
				moonGroup.rotation.z -= 0.01 * delta;
				if (moonGroup.text) {
					moonGroup.text.children.forEach((text) => {
						fadeTextOpacity(moonGroup, text);
					});
				}
			});
		}

		if (planetGroup.ringMeshes && planetGroup.ringMeshes.length) {
			planetGroup.ringMeshes.forEach((ring) => {
				ring.position.set(planetGroup.position.x, planetGroup.position.y, planetGroup.position.z);
				ring.rotation.z += 0.01 * delta;
			});
		}
	});

	controls.update();
	renderer.render(scene, camera);
};

const animate = () => {
	render();
	composer.render();

	window.requestAnimationFrame(animate);
};

const initMousePointerOrbitEvents = () => {
	let intersects = [];
	let objsClickable = [];

	const hasClickedSameTarget = () =>
		objsClickable.length &&
		outlinePass.selectedObjects.map((obj) => obj.name).indexOf(objsClickable[0].object.name) !== -1;

	const returnClickableTarget = (e) => {
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		intersects = raycaster.intersectObjects(scene.children, true);
		objsClickable = intersects.filter(
			(intersect) => intersect.object && intersect.object.data && intersect.object.data.clickable
		);
		return objsClickable || [];
	};

	window.addEventListener('pointerdown', (e) => {
		const objsClickable = returnClickableTarget(e);

		// only add an object if it's clickable and doesn't already exist in the clicked array
		if (objsClickable.length && !hasClickedSameTarget()) {
			zoomToTarget = false;
			// Note that we're selecting the PARENT 3D Object here, not the clicked mesh
			// This is because since the mesh is bound to its parent, it's xyz is 0,0,0 and therefore useless
			if (objsClickable[0].object.parent.type !== 'Scene') {
				targetObject = objsClickable[0].object.parent;
				labelLines.forEach((labelLine) => (labelLine.data.planetIsTargeted = false));
				targetObject.labelLine.data.planetIsTargeted = true;
				easeToTarget = true;
			}

			controls.update();
			// add selected object
			outlinePass.selectedObjects = [];
			outlinePass.selectedObjects.push(objsClickable[0].object);
		}
	});

	window.addEventListener('dblclick', (e) => {
		const objsClickable = returnClickableTarget(e);
		zoomToTarget = objsClickable.length && hasClickedSameTarget();
	});

	window.addEventListener('wheel', () => {
		zoomToTarget = false;
	});

	window.addEventListener('pointerup', (e) => {
		if (!objsClickable.length || !hasClickedSameTarget()) zoomToTarget = false;

		// check pointer position deviation for x + y to see if we should unlock the camera from its target
		const oldMousePos = [mouse.x, mouse.y];
		const newMousePos = [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1];
		const xDeviation = getStandardDeviation([oldMousePos[0], newMousePos[0]]),
			yDeviation = getStandardDeviation([oldMousePos[1], newMousePos[1]]);

		const mouseHasDeviated = Math.abs(xDeviation) > 0.002 || Math.abs(yDeviation) > 0.002;

		// after releasing click, if mouse has deviated (we're playing with orbit controls), KEEP the target!
		// also check that the same target hasn't been clicked, and that whatever has been clicked on is NOT clickable
		// console.log({ mouseHasDeviated, timerPassed, hasClickedSameTarget, selectedObjects: outlinePass.selectedObjects });
		if (!mouseHasDeviated && !objsClickable.length && !hasClickedSameTarget() && outlinePass.selectedObjects.length) {
			// creating new instance of controls xyz so it doesn't keep tracking an object
			const newTarget = { ...controls.target };
			const { x, y, z } = newTarget;

			// To make camera stop following
			easeToTarget = false;
			controls.target.set(x, y, z);
			controls.update();
			outlinePass.selectedObjects = [];
			labelLines.forEach((labelLine) => (labelLine.data.planetIsTargeted = false));
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
	// const renderModel = new RenderPass(scene, camera);
	// const effectBloom = new BloomPass(1.25);
	// const effectFilm = new FilmPass(0.35, 0.95, 2048, false);

	outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
	// outlinePass.edgeStrength = _defaultOutlineEdgeStrength;
	// outlinePass.edgeGlow = 1;
	// outlinePass.edgeThickness = 1;
	// outlinePass.visibleEdgeColor = new THREE.Color(0xffffff);
	// outlinePass.hiddenEdgeColor = new THREE.Color(0x190a05);
	// outlinePass.pulsePeriod = 5;
	// outlinePass.clear = false;

	// composer.addPass(renderModel);
	// composer.addPass(outlinePass);

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
