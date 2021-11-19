'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
import { state } from './modules/state';
import { settings } from './modules/settings';
import { renderer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility, targetLine, labelLine, clickTarget, rings } from './modules/objectProps';
import { skyboxTexturePaths, sunData } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField, buildPlanet, buildMoon } from './modules/factories/solarSystemFactory';
import { returnHoveredGroup, initMousePointerEvents, updateClickedGroup } from './modules/events/mousePointer';
import { PlanetLabelClass } from './modules/objectProps';
import { scene } from './modules/scene';
import { sortAllData } from './modules/data/api';

window.state = state;
window.settings = settings;

let delta;

const orbitCentroid = new THREE.Object3D();
orbitCentroid.name = 'orbit centroid';
const clock = new THREE.Clock();

const render = () => {
	delta = 5 * clock.getDelta();
	// if (state.bodies._asteroidBelt) state.bodies._asteroidBelt.rotation.y -= 0.000425 * delta;

	// determining if mouse was held
	if (state.mouseState._mouseClicked) {
		state.mouseState._mouseClickTimeout -= 60;
		if (state.mouseState._mouseClickTimeout <= 0) state.mouseState._mouseHeld = true;
	} else {
		state.mouseState._mouseClickTimeout = settings.mouse._mouseClickTimeoutDefault;
		state.mouseState._mouseHeld = false;
	}

	if (state.mouseState._mouseHoverTarget !== null) {
		if (state.isDesktop) settings.domTarget.classList.add('object-hovered');

		state.mouseState._mouseHoverTarget.mouseHoverTimeout = settings.mouse._mouseHoverTimeoutDefault;
		// checking to see if hoveredGroups already contains target
		if (!state.mouseState._hoveredGroups.some((group) => group.name === state.mouseState._mouseHoverTarget.name)) {
			state.mouseState._hoveredGroups.push(state.mouseState._mouseHoverTarget);
		}
	} else {
		if (state.isDesktop) settings.domTarget.classList.remove('object-hovered');
	}

	if (state.mouseState._hoveredGroups.length) {
		state.mouseState._hoveredGroups.forEach((group, i, arr) => {
			group.mouseHoverTimeout -= 1;
			if (group.mouseHoverTimeout <= 0) arr.splice(i, 1);
		});
	}

	// text.renderLoop(state.bodies._sun);

	// state.bodies._planetGroups.forEach((planetGroup) => {
	// planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);
	// clickTarget.renderLoop(planetGroup);
	// text.renderLoop(planetGroup);
	// labelLine.renderLoop(planetGroup);
	// targetLine.renderLoop(planetGroup);
	// rings.renderLoop(planetGroup);
	// if (planetGroup.moons) {
	// 	planetGroup.moons.forEach((moonGroup) => {
	// 		moonGroup.data.orbit -= moonGroup.data.orbitSpeed * delta;
	// 		moonGroup.position.set(
	// 			planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
	// 			planetGroup.position.y + 0,
	// 			planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
	// 		);
	// 		moonGroup.rotation.z -= 0.01 * delta;
	// 		if (moonGroup && moonGroup.data) {
	// 			moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);
	// 			clickTarget.renderLoop(moonGroup);
	// 			text.renderLoop(moonGroup);
	// 			labelLine.renderLoop(moonGroup);
	// 			targetLine.renderLoop(moonGroup);
	// 		}
	// 	});
	// }
	// });

	if (state.mouseState._clickedGroup) {
		let { x, y, z } = state.mouseState._clickedGroup.position;

		if (state.mouseState._clickedGroup.data.aroundPlanet) {
			// is moon, so also account for the planet's position
			x += state.mouseState._clickedGroup.parent.position.x;
			y += state.mouseState._clickedGroup.parent.position.y;
			z += state.mouseState._clickedGroup.parent.position.z;
		}

		state.controls.target.x += easeTo({ from: state.controls.target.x, to: x });
		state.controls.target.y += easeTo({ from: state.controls.target.y, to: y });
		state.controls.target.z += easeTo({ from: state.controls.target.z, to: z });
	}

	if (state.mouseState._clickedGroup && state.cameraState._zoomToTarget) {
		const objZoomTo = state.mouseState._clickedGroup.data.meanRadius * 4; // TODO: probably temp number
		const distanceToTarget = state.controls.getDistance();
		const distCalc = objZoomTo; // zoom out further on mobile due to smaller width

		if (distanceToTarget > distCalc) {
			const amountComplete = distCalc / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			state.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyIn(state.cameraState._dollySpeed);
		} else if (distanceToTarget + 0.1 < distCalc) {
			const amountComplete = distanceToTarget / distCalc; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			state.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyOut(state.cameraState._dollySpeed);
		}
	}

	state.controls.update();
	renderer.render(state.scene, state.camera);
	labelRenderer.render(state.scene, state.camera);
};

const animate = () => {
	render();
	window.requestAnimationFrame(animate);
};

const init = () => {
	state.skybox = skybox(skyboxTexturePaths);
	state.bodies._starField = starField();
	state.bodies._asteroidBelt = asteroidBelt();

	state.scene.add(state.skybox);

	const sunLabelClass = new PlanetLabelClass(state.bodies._sun);
	state.bodies.classes._planetLabels.push(sunLabelClass);
	sunLabelClass.build();

	state.bodies._planets.forEach((planet) => {
		const planetLabelClass = new PlanetLabelClass(planet);
		state.bodies.classes._planetLabels.push(planetLabelClass);
		planetLabelClass.build();
	});

	// state.scene.add(state.bodies._starField);
	// state.scene.add(state.bodies._asteroidBelt);

	buildPlanet(sunData).then((sunGroup) => {
		state.bodies._sun = sunGroup;
		state.bodies._textGroups.push(sunGroup.textGroup);
		state.bodies._labelLines.push(sunGroup.labelLine);
		state.bodies._targetLines.push(sunGroup.targetLine);
		state.bodies._navigable.push(sunGroup);
		state.scene.add(sunGroup);
	});

	/* const planetPromises = planetData.map((pData) => buildPlanet(pData));
	Promise.all(planetPromises).then((planetGroups) => {
		planetGroups.forEach((planetGroup) => {
			// console.log(planetGroup);

			// const orbitLine = planetGroup.orbitLine;
			// const orbitCurve = planetGroup.orbitCurve;
			// if (orbitLine) {
			// 	state.bodies._orbitLines.push(orbitLine);
			// 	state.scene.add(orbitLine);
			// }

			// if (planetGroup.moons) {
			// 	const moonPromises = planetGroup.moonData.map((moonData) => buildMoon(moonData, planetGroup));

			// 	Promise.all(moonPromises).then((moonGroups) => {
			// 		moonGroups.forEach((moonGroup) => {
			// 			planetGroup.moons.push(moonGroup);
			// 			state.bodies._orbitLines.push(moonGroup.orbitLine);
			// 			planetGroup.add(moonGroup.orbitLine);
			// 			state.scene.add(moonGroup);
			// 			state.bodies._moonGroups.push(moonGroup);
			// 			state.bodies._navigable.push(moonGroup);
			// 			state.bodies._textGroups.push(moonGroup.textGroup);
			// 			state.bodies._labelLines.push(moonGroup.labelLine);
			// 			state.bodies._targetLines.push(moonGroup.targetLine);
			// 		});
			// 	});
			// }

			// state.bodies._navigable.push(planetGroup);
			// if (planetGroup.textLabel) state.bodies._textLabels.push(planetGroup.textLabel);
			if (planetGroup.textGroup) state.bodies._textGroups.push(planetGroup.textGroup);
			if (planetGroup.labelLine) state.bodies._labelLines.push(planetGroup.labelLine);
			if (planetGroup.targetLine) state.bodies._targetLines.push(planetGroup.targetLine);

			// planetGroup.position.set(30000000, 0, 1000);
		});
	}); */

	state.isDesktop = checkIfDesktop();

	// adding lights to state
	state.lights._pointLights = pointLights();
	// state.lights._spotLights = spotLights();
	state.lights._ambientLights = ambientLights();

	// add all lights at once because I cbf doing them individually
	const lightTypeKeys = Object.keys(state.lights);
	lightTypeKeys.forEach((lightType) => {
		state.lights[lightType].forEach((lightObjsArr) => {
			lightObjsArr.forEach((lightObj) => scene.add(lightObj));
		});
	});

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.querySelector('main').prepend(labelRenderer.domElement);
	labelRenderer.render(state.scene, state.camera);

	state.camera.position.y = 10000000;
	state.camera.position.z = 120000000;
	initMousePointerEvents();

	animate();

	// TODO: temp buttons
	document.querySelector('#position-back').addEventListener('click', () => {
		state.mouseState._clickedGroup = null;
		state.controls.reset();
	});

	document.querySelector('#clear-all-planets').addEventListener('click', () => {
		state.bodies.classes._planetLabels.forEach((pLabelClass) => pLabelClass.remove());
	});

	document.querySelector('#build-all-planets').addEventListener('click', () => {
		state.bodies.classes._planetLabels.forEach((pLabelClass) => pLabelClass.build());
	});
};

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	state.camera.aspect = window.innerWidth / window.innerHeight;
	state.camera.updateProjectionMatrix();
	state.isDesktop = checkIfDesktop();
});

settings.orbitLines._orbitVisibilityCheckbox.addEventListener('change', () => {
	state.bodies._orbitLines.forEach((orbitLine) => (orbitLine.material.visible = setOrbitVisibility()));
});

document.addEventListener('keydown', (e) => {
	// TODO: when all planet data finished loading in, create a new ordered array based on their distance from the sun
	const getIndexById = (targetId) => state.bodies._navigable.findIndex((item) => item.data.id === targetId);
	if (e.code === 'KeyZ' || e.code === 'KeyC') {
		const navigableLength = state.bodies._navigable.length;
		const currentId =
			state.mouseState._clickedGroup &&
			state.mouseState._clickedGroup.data &&
			state.mouseState._clickedGroup.data.id !== undefined
				? state.mouseState._clickedGroup.data.id
				: null;

		if (currentId === null) {
			updateClickedGroup(state.bodies._navigable[getIndexById(1)]); // if no clicked group, start off with a planet instead of the sun to make it more interesting
			return;
		}

		if (e.code === 'KeyZ') {
			const targetIndex = currentId - 1 > -1 ? getIndexById(currentId - 1) : getIndexById(navigableLength - 1);
			updateClickedGroup(state.bodies._navigable[targetIndex]);
			state.cameraState._rotateToTarget = true;
		}

		if (e.code === 'KeyC') {
			const targetIndex = currentId < navigableLength - 1 ? getIndexById(currentId + 1) : getIndexById(0);
			updateClickedGroup(state.bodies._navigable[targetIndex]);
		}
	}
});

sortAllData();
init();
