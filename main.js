'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
// custom OrbitControls so can expose the dollyIn() and dollyOut() functions
import { OrbitControls } from './modules/custom/jsm/controls/OrbitControls';

import {
	getStandardDeviation,
	createCircleTexture,
	createCircleFromPoints,
	numberWithCommas,
	getBreakpoint
} from './modules/utils';
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

const domTarget = document.querySelector('#bg');
const renderer = new THREE.WebGLRenderer({
	canvas: domTarget,
	antialias: true
});

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
	IN: 'KeyF',
	OUT: 'KeyV'
};
controls.listenToKeyEvents(document);

const loader = new THREE.TextureLoader(loadManager());
const fontLoader = new THREE.FontLoader(loadManager());
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const planets = [],
	planetGroups = [],
	orbitLines = [],
	labelLines = [],
	targetLines = [],
	textGroups = [];

const isDesktop = ['screen-lg', 'screen-xl'].indexOf(getBreakpoint) !== -1;
const starfield = new THREE.Object3D();
starfield.name = 'starfield';
const orbitCentroid = new THREE.Object3D();
orbitCentroid.name = 'orbit centroid';

let cubeRenderTarget1, cubeCamera1, sunMeshPerlin;
let easeToTarget = false;
let zoomToTarget = false;
let clickedGroup;
let hoveredGroups = []; // hoverGroups items will delete themselves once their timers hit 0
let mouseHasMoved = false;
let mouseClicked = false;
let mouseHeld = false;
window.mouseHeld = mouseHeld;
const mouseHoverTimeoutDefault = 600; // for queueing up planet hovers
const mouseClickTimoutDefault = 500; // for determining whether it's a click mouse press or a held one
let mouseClickTimeout = mouseClickTimoutDefault;
let mouseHoverTarget = null;

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
			if (!item.includeLabelLine) return;

			const labelGeometry = {
				origInnerRadius: item.size * 1.01 + 0.1 + 0.1,
				origOuterRadius: item.size * 1.01 + 0.1 + 0.1,
				origSegments: 90
			};
			const labelLine = new THREE.Mesh(
				new THREE.RingBufferGeometry(
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
			labelLines.push(labelLine);
		};

		const createClickTarget = (item, group) => {
			const clickTarget = new THREE.Mesh(
				new THREE.SphereBufferGeometry(isDesktop ? item.size + 0.5 : Math.min(item.size * 5, 8), 10, 10),
				new THREE.MeshBasicMaterial({
					side: THREE.FrontSide,
					transparent: true,
					opacity: 0,
					wireframe: true
				})
			);

			clickTarget.name = `${item.name} click target`;
			group.add(clickTarget);
		};

		const createText = (item, group) => {
			if (!item.textColour) return;

			const fontGroup = new THREE.Group();

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

				textMesh.renderOrder = 999; // will force text to always render on top, even on weird stuff (like Saturn's rings)

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

				const titleMesh = createTextMesh(titleGeo, item.textColour);

				const centreOffsetY = -0.5 * (titleGeo.boundingBox.max.y - titleGeo.boundingBox.min.y);
				const rightOffset = titleGeo.boundingBox.min.x;
				const arbitraryExtraValue = 1;
				fontGroup.position.x = rightOffset; // will CENTRE the group, to use as a foundation for positioning other elements
				titleMesh.position.x = 0 - titleGeo.boundingBox.max.x - item.size - arbitraryExtraValue; // will align text to the LEFT of the planet
				titleMesh.position.y = centreOffsetY;
				titleMesh.name = `${item.name} title`;

				fontGroup.add(titleMesh);

				textGroups.push(fontGroup);

				fontLoader.load(`fonts/sylfaen_regular.json`, (font) => {
					const stats = item.stats || {};
					const { distanceToSun, diameter, spinTime, orbitTime, gravity } = stats;

					const textArray = [];
					const textValues = [
						distanceToSun ? `Distance to Sun: ${numberWithCommas(distanceToSun)} km` : null,
						diameter ? `Diameter: ${numberWithCommas(diameter)} km` : null,
						spinTime ? `Spin Time: ${numberWithCommas(spinTime)} Days` : null,
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
					descMesh.scale.set(item.statsScale, item.statsScale, item.statsScale);

					const centreOffsetY = -0.5 * (descGeo.boundingBox.max.y - descGeo.boundingBox.min.y);
					const arbitraryExtraValue = 1;
					descMesh.position.x = item.size + arbitraryExtraValue; // will align text to the LEFT of the planet
					descMesh.position.y = 0 - centreOffsetY - 0.13; // this value seems to correct the v-alignment, not sure why
					descMesh.name = `${item.name} desc`;
					fontGroup.add(descMesh);
				});
			});

			fontGroup.name = `${item.name} text group`;
			group.add(fontGroup);
		};

		const createTargetLine = (item, group) => {
			if (!item.includeTargetLine) return;

			// the 1.01 helps offset larger bodies like Jupiter
			const targetLineProps = createCircleFromPoints(item.size * 1.01 + 0.1);
			const { geometry, material } = targetLineProps;

			const targetLine = new THREE.Points(geometry, material);
			targetLine.renderOrder = 999;
			targetLine.name = `${item.name} target line`;
			targetLines.push(targetLine);
			group.targetLine = targetLine;
			group.add(targetLine);
		};

		const createOrbitLine = (mesh, group, planetGroup) => {
			const orbit = new THREE.Line(
				new THREE.RingBufferGeometry(group.data.orbitRadius, group.data.orbitRadius, 90),
				new THREE.LineBasicMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: setOrbitVisibility()
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
		planetGroups.push(planetGroup);

		planetMesh.name = `${planet.name} mesh`;
		planetMesh.data = planetMesh.data || [];
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
				moonGroup.name = `${moon.name} moon group`;
				moonGroup.data = moonGroup.data || [];
				moonGroup.data.orbit = Math.random() * Math.PI * 2;
				moonGroup.data.orbitRadius = moon.orbitRadius;
				moonGroup.data.orbitSpeed = 0.05 / moon.orbitRadius;
				moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);
				moonGroup.data.zoomTo = moon.zoomTo;
				moonGroup.position.set(planetGroup.position.x, planetGroup.position.y, planetGroup.position.z);

				moonMesh.name = `${moon.name} moon`;
				moonMesh.data = moonMesh.data || [];
				moonMesh.data.size = moon.size;
				moonMesh.data.clickable = true;

				createClickTarget(moon, moonGroup);
				createText(moon, moonGroup);
				createLabelLine(moon, moonGroup);
				createOrbitLine(moon, moonGroup, planetGroup);

				moonGroup.add(moonMesh);
				planetGroup.moons = planetGroup.moons || [];
				planetGroup.moons.push(moonGroup);
				scene.add(moonGroup);
			});
		}

		if (planet.rings && planet.rings.length) {
			planet.rings.forEach((ring, i) => {
				const ringMesh = new THREE.Mesh(
					ringUVMapGeometry(2.4, 5),
					new THREE.MeshBasicMaterial({
						...ring.material,
						map: loader.load(ring.material.map)
					})
				);

				ringMesh.name = `${planet.name} ring ${i}`;
				ringMesh.rotation.x = THREE.Math.degToRad(75);
				ringMesh.position.set(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z);
				planetMesh.ringMeshes = planetMesh.ringMeshes || [];
				planetMesh.ringMeshes.push(ringMesh);
				planetGroup.add(ringMesh);
			});
		}

		createClickTarget(planet, planetGroup);
		createLabelLine(planet, planetGroup);
		createTargetLine(planet, planetGroup);
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

// not sure how memory efficient it is to run this every frame
const returnHoveredGroup = () => {
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true);
	let objsClickable = intersects.filter(
		(intersect) => intersect.object && intersect.object.name.includes('click target')
	);

	const findParentGroup = (obj) => {
		let objParent = obj.parent;
		if (!objParent) return null;
		if (objParent.type === 'Group') return objParent;
		objParent = objParent.parent;
		if (objParent.type === 'Group') return objParent;
		objParent = objParent.parent;
		if (objParent.type === 'Group') return objParent;

		return null;
	};

	return objsClickable.length && objsClickable[0].object ? findParentGroup(objsClickable[0].object) : null;
};

const fadeTextOpacity = (group, text) => {
	if (clickedGroup && clickedGroup.name === group.name && group.data.cameraDistance < group.data.zoomTo + 14) {
		text.material.forEach((m) => {
			m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
		});
	} else {
		text.material.forEach((m) => {
			m.opacity = m.opacity > textOpacityDefault ? (m.opacity -= 0.05) : 0;
		});
	}
};

const fadeTargetLineOpacity = (group, targetLine) => {
	let m = targetLine.material;
	if (clickedGroup && clickedGroup.name === group.name) {
		m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
	} else {
		m.opacity = m.opacity > 0 ? (m.opacity -= 0.05) : 0;
	}
};

const initMousePointerOrbitEvents = () => {
	let mouseClickLocation; // for passing to the pointerup event for mouse deviation calculations

	const hasClickedSameTarget = () =>
		clickedGroup && returnHoveredGroup() && returnHoveredGroup().name && clickedGroup.name;

	window.addEventListener('mousemove', (e) => {
		mouseHasMoved = true;
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		if (mouseHoverTarget !== null) {
			mouseHoverTarget.hoverTimeout = mouseHoverTimeoutDefault; // start a new timer on the obj
			// checking to see if hoveredGroups already contains target
			if (hoveredGroups.filter((group) => group.name === mouseHoverTarget.name).length === 0) {
				hoveredGroups.push(mouseHoverTarget);
			}
		}
	});

	window.addEventListener('pointerdown', (e) => {
		mouseClicked = true;
		mouseClickTimeout = mouseClickTimoutDefault;
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		mouseClickLocation = [mouse.x, mouse.y];
	});

	window.addEventListener('wheel', () => {
		zoomToTarget = false;
	});

	window.addEventListener('pointerup', (e) => {
		mouseClicked = false;

		// check pointer position deviation for x + y to see if we should unlock the camera from its target
		const oldMousePos = [mouseClickLocation[0], mouseClickLocation[1]];
		const newMousePos = [(e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1];
		const xDeviation = getStandardDeviation([oldMousePos[0], newMousePos[0]]),
			yDeviation = getStandardDeviation([oldMousePos[1], newMousePos[1]]);

		const mouseHasDeviated = Math.abs(xDeviation) > 0.002 || Math.abs(yDeviation) > 0.002;
		if (mouseHasDeviated || mouseHeld) return;

		clickedGroup = returnHoveredGroup();
		if (clickedGroup) {
			// This is because since the mesh is bound to its parent, it's xyz is 0,0,0 and therefore useless
			easeToTarget = true;
			zoomToTarget = true;
			controls.update();
			}

		// after releasing click, if mouse has deviated (we're playing with orbit controls), KEEP the target!
		// also check that the same target hasn't been clicked, and that whatever has been clicked on is NOT clickable
		if (!mouseHasDeviated && !mouseHeld && !clickedGroup && !hasClickedSameTarget()) {
			// creating new instance of controls xyz so it doesn't keep tracking an object
			const newTarget = { ...controls.target };
			const { x, y, z } = newTarget;

			// To make camera stop following
			easeToTarget = false;
			controls.target.set(x, y, z);
			controls.update();
			clickedGroup = null;
			}
	});
};

const render = () => {
	mouseHoverTarget = mouseHasMoved ? returnHoveredGroup() : mouseHoverTarget;
	if (mouseClicked) {
		mouseClickTimeout -= 60;
		mouseHeld = mouseClickTimeout <= 0 ? mouseHeld : false;
		} else {
		mouseClickTimeout = mouseClickTimoutDefault;
			}

	if (mouseHoverTarget !== null) {
		domTarget.classList.add('object-hovered');
		mouseHoverTarget.hoverTimeout = mouseHoverTimeoutDefault; // start a new timer on the obj
		// checking to see if hoveredGroups already contains target
		if (hoveredGroups.filter((g) => g.name === mouseHoverTarget.name).length === 0) {
			hoveredGroups.push(mouseHoverTarget);
			}
	} else {
		domTarget.classList.remove('object-hovered');
		}

	delta = 5 * clock.getDelta();
	orbitCentroid.rotation.y -= 0.000425 * delta;

	labelLines.forEach((labelLine) => {
		labelLine.lookAt(camera.position);
	});

	hoveredGroups.forEach((group, i, arr) => {
		if (!mouseHoverTarget || mouseHoverTarget.name !== group.name) group.hoverTimeout -= 60;
		if (group.hoverTimeout <= 0) arr.splice(i, 1); // remove item from array when timeout hits 0
	});

	planets.forEach((planetGroup) => {
		planetGroup.rotation.y += planetGroup.data.rotSpeed * delta;
		planetGroup.data.orbit += planetGroup.data.orbitSpeed;
		planetGroup.position.set(
			Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
			0,
			Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
		);
		planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);

		if (planetGroup.moons) {
			planetGroup.moons.forEach((moonGroup) => {
				moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);
				moonGroup.data.orbit -= moonGroup.data.orbitSpeed * delta;
				moonGroup.position.set(
					planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
					planetGroup.position.y + 0,
					planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
				);
				moonGroup.rotation.z -= 0.01 * delta;

				const textGroup = moonGroup.children.filter((item) => item.name.includes('text group'))[0];
				textGroup.lookAt(camera.position);
				textGroup.children.forEach((text) => {
					fadeTextOpacity(moonGroup, text);
				});
			});
		}

		planetGroup.children.forEach((child) => {
			if (child.name.includes('label line')) {
				const labelLine = child;

				let innerRadius = labelLine.geometry.parameters.innerRadius;
				let outerRadius = labelLine.geometry.parameters.outerRadius;
				const { origOuterRadius, origSegments } = labelLine.data.labelGeometryOriginal;
				let regenerate = false;
				if (hoveredGroups.filter((g) => g.name === planetGroup.name).length) {
					if (outerRadius < origOuterRadius + 0.075) {
						outerRadius += easeTo({ from: outerRadius, to: origOuterRadius + 0.075, incrementer: 15 });
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
			}

			if (child.name.includes('target line')) {
				const targetLine = child;
				targetLine.lookAt(camera.position);
				fadeTargetLineOpacity(planetGroup, targetLine);
			}

			if (child.name.includes('ring')) {
				const ring = child;
				ring.rotation.z += 0.01 * delta;
			}

			// causes multiple loops
			if (child.name.includes('text group')) {
				const textGroup = child;
				textGroup.lookAt(camera.position);
				textGroup.children.forEach((text) => {
					fadeTextOpacity(planetGroup, text);
				});
			}
		});
	});

	if (clickedGroup && easeToTarget) {
		const easeX = easeTo({ from: controls.target.x, to: clickedGroup.position.x });
		const easeY = easeTo({ from: controls.target.y, to: clickedGroup.position.y });
		const easeZ = easeTo({ from: controls.target.z, to: clickedGroup.position.z });
		if (easeX) controls.target.x += easeX;
		if (easeY) controls.target.y += easeY;
		if (easeZ) controls.target.z += easeZ;

		if (!easeX && !easeY && !easeZ) {
			easeToTarget = false;
			// this line causes the sun to lock itself to the camera and then move around with it. Very strange
			// controls.target = targetObject.position; // this will make sure the camera is locked to the target and will persist after easing
		}
	}

	if (clickedGroup && zoomToTarget) {
		const objZoomTo = clickedGroup.data.zoomTo || 0;
		const distanceToTarget = controls.getDistance();
		const distCalc = Math.max(10, objZoomTo + (isDesktop ? 0 : 8)); // zoom out further on mobile due to smaller width

		if (distanceToTarget > distCalc) {
			const amountComplete = distCalc / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (dollySpeedMin - dollySpeedMax) * amountComplete;
			const dollySpeed = Math.min(dollySpeedMax + amountToIncrease, dollySpeedMin);
			controls.dollyIn(dollySpeed);
		}
	}

	controls.update();
	renderer.render(scene, camera);
};

const animate = () => {
	render();
	window.requestAnimationFrame(animate);
};

const init = () => {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.position.y = 32;
	camera.position.z = 100;

	addElements();
	animate();
	initMousePointerOrbitEvents();

	window.scene = scene;
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
