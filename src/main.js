'use strict';
import './node_modules/bootstrap/dist/css/bootstrap.css';
import './css/style.css';

import * as THREE from 'three';
import { state } from './modules/state';
import { settings } from './modules/settings';
import { renderer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility } from './modules/objectProps';
import { skyboxTexturePaths, sunData } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField, buildPlanet, buildMoon } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { PlanetLabelClass } from './modules/objectProps';
import { sortData } from './modules/data/api';
import { scene } from './modules/scene';
import { setModalEvents } from './modules/events/modals';

window.state = state; // TODO: state is now deprecated, use the Vue Orrery data instead
window.settings = settings;
window.renderLoop;

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

	if (window.vueOrrery.mouseState._clickedGroup) {
		const _clickedGroup = window.vueOrrery.mouseState._clickedGroup;
		let { x, y, z } = _clickedGroup.position;

		if (_clickedGroup.parent && _clickedGroup.data.aroundPlanet) {
			// is moon, so also account for the planet's position
			x += _clickedGroup.parent.position.x;
			y += _clickedGroup.parent.position.y;
			z += _clickedGroup.parent.position.z;
		}

		state.controls.target.x += easeTo({ from: state.controls.target.x, to: x });
		state.controls.target.y += easeTo({ from: state.controls.target.y, to: y });
		state.controls.target.z += easeTo({ from: state.controls.target.z, to: z });
	}

	if (window.vueOrrery.mouseState._clickedGroup && state.cameraState._zoomToTarget) {
		const objZoomTo = window.vueOrrery.mouseState._clickedGroup.data.meanRadius * 4; // TODO: probably temp number
		const distanceToTarget = state.controls.getDistance();
		// const distCalc = objZoomTo;

		if (distanceToTarget > objZoomTo) {
			const amountComplete = objZoomTo / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			state.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyIn(state.cameraState._dollySpeed);
		} else if (distanceToTarget + 0.1 < objZoomTo) {
			const amountComplete = distanceToTarget / objZoomTo; // decimal percent completion of camera dolly based on the zoomTo of targetObj
			const amountToIncrease = (settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
			state.cameraState._dollySpeed = Math.min(
				settings.controls._dollySpeedMax + amountToIncrease,
				settings.controls._dollySpeedMin
			);
			state.controls.dollyOut(state.cameraState._dollySpeed);
		}
	}

	state.controls.update();
	renderer.render(scene, state.camera);
	labelRenderer.render(scene, state.camera);
};

// using window so RAF can be accessed through solution without importing
// TODO: can probably be tidied up in future
window.animate = () => {
	render();
	window.renderLoop = requestAnimationFrame(window.animate);
};

window.vueOrrery = new Vue({
	el: '#app-orrery',
	data: {
		mouseState: {
			_clickedGroup: null
		},
		// these data props are non-reactive on purpose
		// it doesn't need to react, just conveniently store data
		bodies: {
			// _all: [],
			_sun: {},
			_planets: [],
			_moons: [],
			_dwarfPlanets: [],
			_satellites: [],
			_planetLabels: [],
			_moonLabels: [],
			_dwarfPlanetLabels: [],
			_orbitLines: [],
			_starfield: null,
			_asteroidBelt: null,
			classes: {
				_planetLabels: [],
				_moonLabels: []
			}
		}
	},
	computed: {
		// TODO: make one for clicked group?
		// modalTest() {
		// 	return this.mouseState._clickedGroup && this.mouseState._clickedGroup.data
		// 		? { title: this.mouseState._clickedGroup.data.title, content: this.mouseState._clickedGroup.data.content }
		// 		: '';
		// },

		modalTitle: () => (this.mouseState._clickedGroup ? this.mouseState._clickedGroup.data.title : ''),
		modalContent() {
			return this.mouseState._clickedGroup && this.mouseState._clickedGroup.data
				? this.mouseState._clickedGroup.data.content
				: '';
		},
		modalImageSrc() {
			return this.mouseState._clickedGroup &&
				this.mouseState._clickedGroup.data &&
				this.mouseState._clickedGroup.data.image
				? this.mouseState._clickedGroup.data.image.source
				: '';
		},

		modalReadMore() {
			return this.mouseState._clickedGroup && this.mouseState._clickedGroup.data
				? this.mouseState._clickedGroup.data.wikipediaKey || this.mouseState._clickedGroup.data.title
				: '';
		}
	},
	methods: {
		// refreshModalData: () => {
		// 	if (!this.mouseState._clickedGroup || !this.mouseState._clickedGroup.data) return;
		// 	const { title, content } = this.mouseState._clickedGroup.data;
		// 	const { source, width, height, alt } = this.mouseState._clickedGroup.data.image;

		// 	return {
		// 		title,
		// 		content,
		// 		source,
		// 		width,
		// 		height,
		// 		alt
		// 	};
		// },

		getSolarSystemData: async () => {
			return await fetch('./modules/data/solarSystemData.json').then((response) => {
				if (!response.ok) throw new Error('Error retrieving Solar System data');
				return response.json();
			});
		}
	},
	mounted() {
		if (window.hasMounted) return;
		window.hasMounted = true;

		this.getSolarSystemData().then((data) => {
			console.log('inited!!');

			const sortedData = sortData(data);
			this.bodies._sun = sortedData.sun;
			this.bodies._planets = sortedData.planets;
			this.bodies._moons = sortedData.moons;
			this.bodies._dwarfPlanets = sortedData.dwarfPlanets;
			this.bodies._satellites = sortedData.satellites;

			scene.add(skybox(skyboxTexturePaths));

			const sunLabelClass = new PlanetLabelClass(this.bodies._sun);
			this.bodies.classes._planetLabels.push(sunLabelClass);
			sunLabelClass.build();

			this.bodies._planets.forEach((planet) => {
				const planetLabelClass = new PlanetLabelClass(planet);
				this.bodies.classes._planetLabels.push(planetLabelClass);
				planetLabelClass.build();
			});

			buildPlanet(sunData).then((sunGroup) => scene.add(sunGroup));

			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(window.innerWidth, window.innerHeight);

			// console.log(selectors.main);

			// selectors.main.prepend(labelRenderer.domElement);
			document.querySelector('main').prepend(labelRenderer.domElement);

			labelRenderer.render(scene, state.camera);

			state.camera.position.y = 10000000;
			state.camera.position.z = 120000000;

			initMousePointerEvents();
			setModalEvents();

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

			window.animate();

			// scene.add(state.bodies._starField);
			// scene.add(state.bodies._asteroidBelt);

			// TODO: temp buttons

			settings.orbitLines._orbitVisibilityCheckbox.addEventListener('change', () => {
				state.bodies._orbitLines.forEach((orbitLine) => (orbitLine.material.visible = setOrbitVisibility()));
			});
		});

		document.querySelector('#btn-back').addEventListener('click', () => {
			state.mouseState._clickedGroup = null;
			state.controls.reset();
		});

		window.addEventListener('resize', () => {
			renderer.setSize(window.innerWidth, window.innerHeight);
			labelRenderer.setSize(window.innerWidth, window.innerHeight);
			state.camera.aspect = window.innerWidth / window.innerHeight;
			state.camera.updateProjectionMatrix();
			state.isDesktop = checkIfDesktop();
		});
	}
});
