'use strict';
import './reset.css';
import './style.css';

import * as THREE from 'three';
import { state } from './modules/state';
import { settings } from './modules/settings';
import { renderer } from './modules/renderer';
import { easeTo, calculatePlanetDistance, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility, targetLine, labelLine, text, rings } from './modules/objectProps';
import { skyboxTexturePaths, sunData, planetData } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField, planet } from './modules/factories/solarSystemFactory';
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
		state.mouseState._easeToTarget = true;
		state.controls.update();
	}

	text.renderLoop(state.bodies._sun);

	state.bodies._planetGroups.forEach((planetGroup) => {
		// planetGroup.rotation.y += planetGroup.data.rotSpeed * delta;
		// planetGroup.data.orbit += planetGroup.data.orbitSpeed;
		// planetGroup.position.set(
		// 	Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
		// 	0,
		// 	Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
		// );
		planetGroup.data.cameraDistance = calculatePlanetDistance(planetGroup);

		text.renderLoop(planetGroup);
		labelLine.renderLoop(planetGroup);
		targetLine.renderLoop(planetGroup);
		rings.renderLoop(planetGroup);

		if (planetGroup.moons) {
			planetGroup.moons.forEach((moonGroup) => {
				// moonGroup.data.orbit -= moonGroup.data.orbitSpeed * delta;

				// moonGroup.position.set(
				// 	planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
				// 	planetGroup.position.y + 0,
				// 	planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
				// );

				// moonGroup.rotation.z -= 0.01 * delta;
				moonGroup.data.cameraDistance = calculatePlanetDistance(moonGroup);

				text.renderLoop(moonGroup);
				labelLine.renderLoop(moonGroup);
				targetLine.renderLoop(moonGroup);
			});
		}
	});

	if (state.mouseState._clickedGroup && state.mouseState._easeToTarget) {
		const easeX = easeTo({ from: state.controls.target.x, to: state.mouseState._clickedGroup.position.x });
		const easeY = easeTo({ from: state.controls.target.y, to: state.mouseState._clickedGroup.position.y });
		const easeZ = easeTo({ from: state.controls.target.z, to: state.mouseState._clickedGroup.position.z });
		if (easeX) state.controls.target.x += easeX;
		if (easeY) state.controls.target.y += easeY;
		if (easeZ) state.controls.target.z += easeZ;

		if (!easeX && !easeY && !easeZ) {
			state.mouseState._easeToTarget = false;
			// this line causes the sun to lock itself to the camera and then move around with it. Very strange
			// controls.target = targetObject.position; // this will make sure the camera is locked to the target and will persist after easing
		}
	}

	if (state.mouseState._clickedGroup && state.mouseState._zoomToTarget) {
		const objZoomTo = state.mouseState._clickedGroup.data.zoomTo || 0;
		const distanceToTarget = state.controls.getDistance();
		const distCalc = Math.max(5, objZoomTo + (state.isDesktop ? 0 : 8)); // zoom out further on mobile due to smaller width

		if (distanceToTarget > distCalc) {
			const amountComplete = distCalc / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			settings.controls._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyIn(settings.controls._dollySpeed);
		} else if (distanceToTarget + 0.1 < distCalc) {
			const amountComplete = distanceToTarget / distCalc; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			settings.controls._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyOut(settings.controls._dollySpeed);
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
	state.bodies._planetGroups = [];
	state.bodies._labelLines = [];
	state.bodies._targetlines = [];
	state.bodies._orbitLines = [];
	state.bodies._textGroups = [];
	state.bodies._navigable = [];

	const sunBuild = planet(sunData);
	state.bodies._sun = sunBuild;
	state.bodies._targetLines.push(sunBuild.targetLine);
	console.log(sunBuild.textGroup);
	state.bodies._textGroups.push(sunBuild.textGroup);
	state.bodies._navigable.push(state.bodies._sun);

	planetData.forEach((pData) => {
		const planetBuild = planet(pData);
		state.bodies._navigable.push(planetBuild);
		state.bodies._planetGroups.push(planetBuild);
		if (planetBuild.moons) {
			state.bodies._moonGroups.push(planetBuild.moons);
			state.bodies._navigable.push(...planetBuild.moons);
		}
		state.bodies._labelLines.push(planetBuild.labelLine);
		state.bodies._targetLines.push(planetBuild.targetLine);
		state.bodies._orbitLines.push(planetBuild.orbitLine);
		state.bodies._textGroups.push(planetBuild.textGroup);
	});

	state.scene.add(state.skybox, state.bodies._starField, state.bodies._asteroidBelt, state.bodies._sun);
	state.bodies._planetGroups.forEach((planetGroup) => {
		state.scene.add(planetGroup);
		if (planetGroup.moons) planetGroup.moons.forEach((moon) => state.scene.add(moon)); // only seems to add to scene when included in here
	});
	state.bodies._orbitLines.forEach((orbitLine) => state.scene.add(orbitLine));

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	state.camera.position.y = 32;
	state.camera.position.z = 100;

	state.isDesktop = checkIfDesktop();

	// adding lights to state
	state.lights._pointLights = pointLights();
	state.lights._spotLights = spotLights();
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
	if (e.code === 'KeyZ' || e.code === 'KeyC') {
		const navigableLength = state.bodies._navigable.length;
		state.mouseState._zoomToTarget = true;
		if (e.code === 'KeyZ') {
			if (!state.mouseState._clickedGroup) {
				state.mouseState._clickedGroup = state.bodies._navigable[navigableLength - 1];
				return;
			}

			const targetName = state.mouseState._clickedGroup.name;
			const targetIndex = state.bodies._navigable.findIndex((planetGroup) => planetGroup.name === targetName);
			const prevTarget =
				targetIndex - 1 < 0 ? state.bodies._navigable[navigableLength - 1] : state.bodies._navigable[targetIndex - 1];
			state.mouseState._clickedGroup = prevTarget;
		}

		if (e.code === 'KeyC') {
			// going to next planet. In final implementation need to go through moons first
			// will either be the next planet or the first one (or the sun, hmmm)
			if (!state.mouseState._clickedGroup) {
				state.mouseState._clickedGroup = state.bodies._planetGroups[1]; // start off with a planet instead of sun since more interesting
				return;
			}

			const targetName = state.mouseState._clickedGroup.name;
			const targetIndex = state.bodies._navigable.findIndex((planetGroup) => planetGroup.name === targetName);
			const nextTarget =
				state.bodies._planetGroups.length === targetIndex + 1
					? state.bodies._navigable[0]
					: state.bodies._navigable[targetIndex + 1];
			state.mouseState._clickedGroup = nextTarget;
		}
	}
});
