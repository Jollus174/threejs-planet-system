'use strict';
import './scss/styles.scss';

import * as THREE from 'three';
import { orrery } from './modules/orrery';
import { settings } from './modules/settings';
import { controls } from './modules/controls';
import { renderer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo, checkIfDesktop } from './modules/utils';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { setOrbitVisibility } from './modules/objectProps';
import { skyboxTexturePaths } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { Planet, DwarfPlanet, Asteroid, Sun, Moon } from './modules/objectProps';
import { sortData, getNASAMediaData } from './modules/data/api';
import { scene } from './modules/scene';
import { setModalEvents } from './modules/events/modals';
import { customEventNames } from './modules/events/customEvents';
import { getWikipediaData } from './modules/data/api';

import Vue from 'vue/dist/vue.js';

window.settings = settings;
window.renderLoop;

let delta;

window.renderer = renderer;

const orbitCentroid = new THREE.Object3D();
orbitCentroid.name = 'orbit centroid';
const clock = new THREE.Clock();
const vectorPosition = new THREE.Vector3();

document.addEventListener(customEventNames.updateEntityTarget, (e) => {
	const clickedClass = e.detail;
	const newClickedClassSameAsOld = orrery.mouseState._clickedClass
		? clickedClass.data.id === orrery.mouseState._clickedClass.data.id
		: false;
	orrery.mouseState._clickedClass = clickedClass;

	const labelSelected = document.querySelector('.label.label-selected');
	if (labelSelected) labelSelected.classList.remove('label-selected');

	clickedClass.labelLink.classList.add('label-selected');

	// updating modal with Wikipedia data
	/* if (!clickedClass.data.content) {
		const wikiKey = clickedClass.data.wikipediaKey || clickedClass.data.englishName;
		getWikipediaData(wikiKey)
			.then((response) => {
				clickedClass.data.title = response.title;
				clickedClass.data.content = response.content;
				clickedClass.data.image = response.image;
			})
			.catch((err) => {
				console.error(err);
			});
	} */

	// checking to see if the item has already been clicked
	// if it has, then zoom to it
	if (newClickedClassSameAsOld) {
		document.dispatchEvent(new CustomEvent(customEventNames.updateZoomTarget, { detail: clickedClass }));
	} else {
		orrery.cameraState._zoomToTarget = false;
		orrery.mouseState._zoomedClass = null;
		// orrery.mouseState._clickedClass = null; // TODO: this should be 'focused class'!
	}
});

document.addEventListener(customEventNames.updateZoomTarget, (e) => {
	const zoomedClass = e.detail;
	orrery.mouseState._zoomedClass = zoomedClass;

	orrery.cameraState._zoomToTarget = true; // to get the camera moving
	controls.minDistance = zoomedClass.data.meanRadius * 8;

	orrery.vueTarget.dispatchEvent(new Event(customEventNames.updateZoomTargetVue));
});

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

	if (orrery.mouseState._zoomedClass && orrery.cameraState._zoomToTarget) {
		orrery.controls.target.x += easeTo({ from: orrery.controls.target.x, to: vectorPosition.x });
		orrery.controls.target.y += easeTo({ from: orrery.controls.target.y, to: vectorPosition.y });
		orrery.controls.target.z += easeTo({ from: orrery.controls.target.z, to: vectorPosition.z });
		const zoomTo = orrery.mouseState._zoomedClass.data.zoomTo;
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

fetch('./solarSystemData.json')
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
		orrery.bodies._asteroids = sortedData.asteroids;
		orrery.bodies._allPlanets = sortedData.planets.concat(sortedData.dwarfPlanets);

		scene.add(skybox(skyboxTexturePaths));

		// --------------------
		// Creating Classes and building Labels
		// --------------------

		orrery.classes._sun = new Sun(orrery.bodies._sun);

		orrery.bodies._planets.forEach((planet) => {
			orrery.classes._planets[planet.id] = new Planet(planet);
		});

		orrery.bodies._dwarfPlanets.forEach((dPlanet) => {
			orrery.classes._dwarfPlanets[dPlanet.id] = new DwarfPlanet(dPlanet);
		});

		orrery.classes._all.sun = orrery.classes._sun;
		// temp
		// TODO: When 'Type' is implemented into the original API data, then we build _all and filter down from there
		orrery.classes._all = {
			...orrery.classes._planets,
			...orrery.classes._dwarfPlanets
		};
		//

		orrery.bodies._moons.forEach((moon) => {
			if (!orrery.classes._all[moon.aroundPlanet.planet]) return;
			orrery.classes._moons[moon.id] = new Moon(moon, orrery.classes._all[moon.aroundPlanet.planet]);
		});

		Object.entries(orrery.classes._moons).forEach((entry) => (orrery.classes._all[entry[0]] = entry[1]));

		orrery.classes._navigable = {
			sun: orrery.classes._sun,

			mercury: orrery.classes._planets.mercury,
			venus: orrery.classes._planets.venus,
			earth: orrery.classes._planets.earth,
			mars: orrery.classes._planets.mars,
			jupiter: orrery.classes._planets.jupiter,
			saturn: orrery.classes._planets.saturn,
			uranus: orrery.classes._planets.uranus,
			neptune: orrery.classes._planets.neptune,

			pluto: orrery.classes._dwarfPlanets.pluto,
			ceres: orrery.classes._dwarfPlanets.ceres,
			eris: orrery.classes._dwarfPlanets.eris,
			makemake: orrery.classes._dwarfPlanets.makemake,
			haumea: orrery.classes._dwarfPlanets.haumea,
			orcus: orrery.classes._dwarfPlanets.orcus,
			quaoar: orrery.classes._dwarfPlanets.quaoar
		};

		// MESH BUILDING
		orrery.classes._sun.build();
		Object.values(orrery.classes._planets).forEach((item) => item.build());
		Object.values(orrery.classes._dwarfPlanets).forEach((item) => item.build());

		new Vue({
			el: orrery.vueTarget,
			data: {
				searchQuery: '',
				searchResults: [],
				bottomBar: {},
				content: {},
				moonSections: [],
				moons: [],
				comparisons: [],
				media: [],
				zoomedClassData: null
			},
			computed: {
				currentSystem() {
					if (this.zoomedClassData && this.zoomedClassData.id === 'sun') {
						return `The <span style="color: ${this.zoomedClassData.labelColour};">${this.zoomedClassData.englishName}</span>`;
					} else {
						const entity = this.zoomedClassData
							? `<span style="color: ${this.zoomedClassData.labelColour};">${this.zoomedClassData.system}</span>`
							: 'Solar';
						return `${entity} System`;
					}
				}
			},
			methods: {
				highlightMatchSubstring(str) {
					const regex = new RegExp(this.searchQuery, 'gi');
					return str.toString().replace(regex, (replacedStr) => `<span class="highlight">${replacedStr}</span>`);
				},

				updateSearch() {
					if (!this.searchQuery) return;

					this.searchResults.splice(0); // clear previous set of results

					// filter the _all based on the 'searchQuery'
					const filteredResults = Object.values(orrery.classes._all)
						.filter((item) => item.data.englishName.toLowerCase().includes(this.searchQuery.toLowerCase()))
						.map((result) => result.data);

					// splitting the results by Type, then recombining into the final Search Results
					const planets = filteredResults.filter((r) => r.type === 'Planet');
					const dwarfPlanets = filteredResults.filter((r) => r.type === 'Dwarf Planet');
					const satellites = filteredResults.filter((r) => r.type === 'Satellite');
					// further splitting out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever')
					const namedMoons = filteredResults.filter((r) => r.type === 'Moon' && !r.englishName.includes('S/2'));
					const unnamedMoons = filteredResults.filter((r) => r.type === 'Moon' && r.englishName.includes('S/2'));
					// const asteroids = filteredResults
					// 	.filter((r) => r.type === 'Asteroid')
					// 	.sort((a, b) => a.englishName < b.englishName);
					const asteroids = [];

					const sortedResults = []
						.concat(planets, dwarfPlanets, satellites, namedMoons, unnamedMoons, asteroids)
						.map((result) => {
							return {
								id: result.id,
								englishName: this.highlightMatchSubstring(result.englishName),
								type: result.type,
								system: result.system
							};
						})
						.slice(0, checkIfDesktop() ? 12 : 6); // cap the results for UX

					this.searchResults = [...sortedResults];
				},

				goToPreviousSystem() {
					const keys = Object.keys(orrery.classes._navigable);
					const currentIndex = this.zoomedClassData ? keys.indexOf(this.zoomedClassData.id) : 0;
					const prevIndex = this.zoomedClassData && currentIndex !== 0 ? currentIndex - 1 : keys.length - 1;
					this.zoomedClassData = orrery.classes._navigable[keys[prevIndex]].data;
				},

				goToNextSystem() {
					const keys = Object.keys(orrery.classes._navigable);
					const currentIndex = this.zoomedClassData ? keys.indexOf(this.zoomedClassData.id) : 0;
					const nextIndex = this.zoomedClassData && currentIndex + 1 < keys.length ? currentIndex + 1 : 0;
					this.zoomedClassData = orrery.classes._navigable[keys[nextIndex]].data;
				},

				resetSearch() {
					this.searchQuery = '';
					this.searchResults.splice(0);
				},

				updateEntityTarget(i) {
					const clickedClass = orrery.classes._all[this.searchResults[i].id];
					document.dispatchEvent(new CustomEvent(customEventNames.updateEntityTarget, { detail: clickedClass }));
					this.resetSearch();
				}
			},
			mounted() {
				document.querySelector('main').prepend(labelRenderer.domElement);

				document.addEventListener('click', (e) => {
					if (!e.target.closest('#search')) {
						this.resetSearch();
					}
				});

				orrery.vueTarget.addEventListener(customEventNames.updateZoomTargetVue, () => {
					this.zoomedClassData = orrery.mouseState._zoomedClass.data;
				});

				labelRenderer.render(scene, orrery.camera);

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
			}
		});
	});

// console.log("Scene polycount:", renderer.info.render.triangles)
// console.log("Active Drawcalls:", renderer.info.render.calls)
// console.log("Textures in Memory", renderer.info.memory.textures)
// console.log("Geometries in Memory", renderer.info.memory.geometries)
