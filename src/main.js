'use strict';
import './scss/styles.scss';

import * as THREE from 'three';
import { orrery } from './modules/orrery';
import { settings } from './modules/settings';
import { renderer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility } from './modules/objectProps';
import { skyboxTexturePaths } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { PlanetLabelClass } from './modules/objectProps';
import { sortData } from './modules/data/api';
import { scene } from './modules/scene';
import { setModalEvents } from './modules/events/modals';

window.settings = settings;
window.renderLoop;

let delta;

window.renderer = renderer;

const orbitCentroid = new THREE.Object3D();
orbitCentroid.name = 'orbit centroid';
const clock = new THREE.Clock();
const vectorPosition = new THREE.Vector3();

const render = () => {
	delta = 5 * clock.getDelta();
	// if (state.bodies._asteroidBelt) state.bodies._asteroidBelt.rotation.y -= 0.000425 * delta;

	// determining if mouse was held
	// if (orrery.mouseState._mouseClicked) {
	// 	orrery.mouseState._mouseClickTimeout -= 60;
	// 	if (orrery.mouseState._mouseClickTimeout <= 0) orrery.mouseState._mouseHeld = true;
	// } else {
	// 	orrery.mouseState._mouseClickTimeout = settings.mouse._mouseClickTimeoutDefault;
	// 	orrery.mouseState._mouseHeld = false;
	// }

	// if (orrery.mouseState._mouseHoverTarget !== null) {
	// 	if (orrery.isDesktop) settings.domTarget.classList.add('object-hovered');

	// 	orrery.mouseState._mouseHoverTarget.mouseHoverTimeout = settings.mouse._mouseHoverTimeoutDefault;
	// 	// checking to see if hoveredGroups already contains target
	// 	if (!orrery.mouseState._hoveredGroups.some((group) => group.name === orrery.mouseState._mouseHoverTarget.name)) {
	// 		orrery.mouseState._hoveredGroups.push(orrery.mouseState._mouseHoverTarget);
	// 	}
	// } else {
	// 	if (orrery.isDesktop) settings.domTarget.classList.remove('object-hovered');
	// }
	orrery.cameraState._isInPlaneOfReference =
		orrery.camera.position.y < 35000000 && -35000000 < orrery.camera.position.y;

	if (orrery.mouseState._clickedClass) {
		const clickedGroup = orrery.mouseState._clickedClass.labelGroup;
		clickedGroup.getWorldPosition(vectorPosition);
	}

	if (orrery.mouseState._clickedClass && orrery.cameraState._zoomToTarget) {
		orrery.controls.target.x += easeTo({ from: orrery.controls.target.x, to: vectorPosition.x });
		orrery.controls.target.y += easeTo({ from: orrery.controls.target.y, to: vectorPosition.y });
		orrery.controls.target.z += easeTo({ from: orrery.controls.target.z, to: vectorPosition.z });
		const zoomTo = orrery.mouseState._clickedClass.data.zoomTo;
		const distanceToTarget = orrery.controls.getDistance();

		if (distanceToTarget > zoomTo) {
			const amountComplete = zoomTo / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			orrery.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			orrery.controls.dollyIn(orrery.cameraState._dollySpeed);
		} else if (distanceToTarget + 0.1 < zoomTo) {
			const amountComplete = distanceToTarget / zoomTo; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			orrery.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			orrery.controls.dollyOut(orrery.cameraState._dollySpeed);
		}
	}

	// if (orrery.bodies.meshes._sun.glow) {
	// 	const viewVector = new THREE.Vector3().subVectors(camera.position, orrery.bodies.meshes._sun.parent.position);
	// 	orrery.bodies.meshes._sun.glow.material.uniforms.viewVector.value = viewVector;
	// }

	// if (orrery.bodies.meshes._planets.length && orrery.bodies.meshes._planets[0].glow) {
	// 	const viewVector = new THREE.Vector3().subVectors(
	// 		camera.position,
	// 		orrery.bodies.meshes._planets[0].parent.position
	// 	);
	// 	orrery.bodies.meshes._planets[0].glow.material.uniforms.viewVector.value = viewVector;
	// }

	orrery.controls.update();

	orrery.classes._sun.draw(delta); // TODO: Should be separate

	renderer.render(scene, orrery.camera);
	labelRenderer.render(scene, orrery.camera);
};

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	orrery.camera.aspect = window.innerWidth / window.innerHeight;
	orrery.camera.updateProjectionMatrix();
	orrery.isDesktop = checkIfDesktop();
});

// using window so RAF can be accessed through solution without importing
// TODO: can probably be tidied up in future
window.animate = () => {
	render();
	window.renderLoop = requestAnimationFrame(window.animate);
};

fetch('./../solarSystemData.json')
	.then((response) => {
		if (!response.ok) throw new Error('Error retrieving Solar System data');
		return response.json();
	})
	.then((data) => {
		const sortedData = sortData(data);
		orrery.bodies._sun = sortedData.sun;
		orrery.bodies._planets = sortedData.planets;
		orrery.bodies._moons = sortedData.moons;
		orrery.bodies._dwarfPlanets = sortedData.dwarfPlanets;
		orrery.bodies._satellites = sortedData.satellites;
		orrery.bodies._allPlanets = sortedData.planets.concat(sortedData.dwarfPlanets);

		scene.add(skybox(skyboxTexturePaths));

		// --------------------
		// Creating Classes and building Labels
		// --------------------

		orrery.classes._sun = new Sun(orrery.bodies._sun);

		orrery.bodies._planets.forEach((planet) => {
			orrery.classes._planets[planet.key] = new Planet(planet);
		});

		orrery.bodies._dwarfPlanets.forEach((dPlanet) => {
			orrery.classes._dwarfPlanets[dPlanet.key] = new DwarfPlanet(dPlanet);
		});

		// this will also include moons during the class build process
		orrery.classes._all = {
			...orrery.classes._planets,
			...orrery.classes._dwarfPlanets
		};
		orrery.classes._all.sun = orrery.classes._sun;
		Object.values(orrery.classes._all).forEach((c) => c.build());

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		document.querySelector('main').prepend(labelRenderer.domElement);

		labelRenderer.render(scene, orrery.camera);

		orrery.camera.position.y = 120000000;
		orrery.camera.position.z = 700000000;

		// --------------------
		// Setting Events
		// --------------------
		initMousePointerEvents();
		setModalEvents();

		orrery.isDesktop = checkIfDesktop();

		// --------------------
		// Lighting
		// --------------------
		orrery.lights._pointLights = pointLights();
		// orrery.lights._spotLights = spotLights();
		orrery.lights._ambientLights = ambientLights();

		// add all lights at once because I cbf doing them individually
		const lightTypeKeys = Object.keys(orrery.lights);
		lightTypeKeys.forEach((lightType) => {
			orrery.lights[lightType].forEach((lightObjsArr) => {
				lightObjsArr.forEach((lightObj) => scene.add(lightObj));
			});
		});

		window.animate();

		// scene.add(orrery.bodies._starField);
		// scene.add(orrery.bodies._asteroidBelt);

		// sets z-indexing of planets to be correct
		// checking for overlapping labels (and eventually labels behind planets...)
		// the former needs to be done in the DOM
		// the latter... I'm not completely sure yet
		setInterval(() => {
			labelRenderer.zOrder(scene);
		}, 200);
	});
