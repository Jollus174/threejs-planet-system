'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
import { state } from './modules/state';
import { settings } from './modules/settings';
import { renderer } from './modules/renderer';
import { easeTo, calculatePlanetDistance, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility, targetLine, labelLine, clickTarget, text, rings } from './modules/objectProps';
import { skyboxTexturePaths, sunData, planetData } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField, buildPlanet, buildMoon } from './modules/factories/solarSystemFactory';
import { returnHoveredGroup, initMousePointerEvents } from './modules/events/mousePointer';
import { scene } from './modules/scene';

window.state = state;

let delta;

const orbitCentroid = new THREE.Object3D();
orbitCentroid.name = 'orbit centroid';
const clock = new THREE.Clock();

const render = () => {
	delta = 5 * clock.getDelta();
	if (state.bodies._asteroidBelt) state.bodies._asteroidBelt.rotation.y -= 0.000425 * delta;

	state.mouseState._mouseHoverTarget = state.mouseState._mouseHasMoved
		? returnHoveredGroup()
		: state.mouseState._mouseHoverTarget;

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

	if (state.mouseState._clickedGroup) {
		// This is because since the mesh is bound to its parent, it's xyz is 0,0,0 and therefore useless
		state.controls.update();
	}

	text.renderLoop(state.bodies._sun);

	state.bodies._planetGroups.forEach((planetGroup) => {
		planetGroup.rotation.y += planetGroup.data.rotSpeed * delta;
		planetGroup.data.orbit += planetGroup.data.orbitSpeed;
		planetGroup.position.set(
			Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
			0,
			Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
		);
		planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);

		clickTarget.renderLoop(planetGroup);
		text.renderLoop(planetGroup);
		labelLine.renderLoop(planetGroup);
		targetLine.renderLoop(planetGroup);
		rings.renderLoop(planetGroup);

		if (planetGroup.moons) {
			planetGroup.moons.forEach((moonGroup) => {
				moonGroup.data.orbit -= moonGroup.data.orbitSpeed * delta;

				moonGroup.position.set(
					planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
					planetGroup.position.y + 0,
					planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
				);

				moonGroup.rotation.z -= 0.01 * delta;
				if (moonGroup && moonGroup.data) {
					moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);

					clickTarget.renderLoop(moonGroup);
					text.renderLoop(moonGroup);
					labelLine.renderLoop(moonGroup);
					targetLine.renderLoop(moonGroup);
				}
			});
		}
	});

	if (state.mouseState._clickedGroup) {
		state.controls.target.x += easeTo({ from: state.controls.target.x, to: state.mouseState._clickedGroup.position.x });
		state.controls.target.y += easeTo({ from: state.controls.target.y, to: state.mouseState._clickedGroup.position.y });
		state.controls.target.z += easeTo({ from: state.controls.target.z, to: state.mouseState._clickedGroup.position.z });
	}

	if (state.mouseState._clickedGroup && state.cameraState._zoomToTarget) {
		const objZoomTo = state.mouseState._clickedGroup.data.zoomTo || 0;
		const distanceToTarget = state.controls.getDistance();
		const distCalc = Math.max(5, objZoomTo + (state.isDesktop ? 0 : 8)); // zoom out further on mobile due to smaller width

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
};

const animate = () => {
	render();
	window.requestAnimationFrame(animate);
};

const init = () => {
	state.skybox = skybox(skyboxTexturePaths);
	state.bodies._starField = starField();
	state.bodies._asteroidBelt = asteroidBelt();

	state.scene.add(state.skybox, state.bodies._starField, state.bodies._asteroidBelt);

	buildPlanet(sunData).then((sunGroup) => {
		state.bodies._sun = sunGroup;
		state.bodies._textGroups.push(sunGroup.textGroup);
		state.bodies._labelLines.push(sunGroup.labelLine);
		state.bodies._targetLines.push(sunGroup.targetLine);
		state.bodies._navigable.push(sunGroup);
		state.scene.add(sunGroup);
	});

	const planetPromises = planetData.map((pData) => buildPlanet(pData));
	Promise.all(planetPromises).then((planetGroups) => {
		planetGroups.forEach((planetGroup) => {
			state.bodies._planetGroups.push(planetGroup);

			if (planetGroup.orbitLine) {
				state.bodies._orbitLines.push(planetGroup.orbitLine);
				state.scene.add(planetGroup.orbitLine);
			}

			if (planetGroup.moons) {
				const moonPromises = planetGroup.moonData.map((moonData) => buildMoon(moonData, planetGroup));

				Promise.all(moonPromises).then((moonGroups) => {
					moonGroups.forEach((moonGroup) => {
						planetGroup.moons.push(moonGroup);
						state.bodies._orbitLines.push(moonGroup.orbitLine);
						planetGroup.add(moonGroup.orbitLine);
						state.scene.add(moonGroup);
						state.bodies._moonGroups.push(moonGroup);
						state.bodies._navigable.push(moonGroup);
						state.bodies._textGroups.push(moonGroup.textGroup);
						state.bodies._labelLines.push(moonGroup.labelLine);
						state.bodies._targetLines.push(moonGroup.targetLine);
					});
				});
			}

			state.bodies._navigable.push(planetGroup);
			state.bodies._textGroups.push(planetGroup.textGroup);
			state.bodies._labelLines.push(planetGroup.labelLine);
			state.bodies._targetLines.push(planetGroup.targetLine);
			state.scene.add(planetGroup);
		});

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		state.camera.position.y = 32;
		state.camera.position.z = 100;

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

		initMousePointerEvents();

		animate();
	});
};

init();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	state.camera.aspect = window.innerWidth / window.innerHeight;
	state.camera.updateProjectionMatrix();
	state.isDesktop = checkIfDesktop();
});

settings.orbitLines._orbitVisibilityCheckbox.addEventListener('change', () => {
	state.bodies._orbitLines.forEach((orbitLine) => (orbitLine.material.visible = setOrbitVisibility()));
});

document.addEventListener('keydown', (e) => {
	const getIndexById = (targetId) => state.bodies._navigable.findIndex((item) => item.data.id === targetId);
	if (e.code === 'KeyZ' || e.code === 'KeyC') {
		const navigableLength = state.bodies._navigable.length;
		const currentId =
			state.mouseState._clickedGroup &&
			state.mouseState._clickedGroup.data &&
			state.mouseState._clickedGroup.data.id !== undefined
				? state.mouseState._clickedGroup.data.id
				: null;
		state.cameraState._zoomToTarget = true;

		if (currentId === null) {
			state.mouseState._clickedGroup = state.bodies._navigable[getIndexById(1)]; // if no clicked group, start off with a planet instead of the sun to make it more interesting
			return;
		}

		if (e.code === 'KeyZ') {
			const targetIndex = currentId - 1 > -1 ? getIndexById(currentId - 1) : getIndexById(navigableLength - 1);
			state.mouseState._clickedGroup = state.bodies._navigable[targetIndex];
		}

		if (e.code === 'KeyC') {
			const targetIndex = currentId < navigableLength - 1 ? getIndexById(currentId + 1) : getIndexById(0);
			state.mouseState._clickedGroup = state.bodies._navigable[targetIndex];
		}
	}
});
