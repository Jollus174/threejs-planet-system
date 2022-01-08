/* globals bootstrap */
'use strict';
import './scss/styles.scss';

import * as THREE from 'three';
import { orrery } from './modules/orrery';
import { settings } from './modules/settings';
import { controls } from './modules/controls';
import { renderer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo, checkIfDesktop, kmToAU, AUToKm, convertToCamelCase, randomString } from './modules/utils';
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

document.addEventListener(customEventNames.updateClickTarget, (e) => {
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
		const wikiKey = clickedClass.data.wikipediaKey || clickedClass.data.displayName;
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

	orrery.vueTarget.dispatchEvent(new Event(customEventNames.updateClickTargetVue));

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
		orrery.classes._all.sun = orrery.classes._sun;

		orrery.bodies._planet.forEach((planet) => {
			orrery.classes._planets[planet.id] = new Planet(planet);
			orrery.classes._all[planet.id] = orrery.classes._planets[planet.id];
		});

		orrery.bodies._dwarfPlanet.forEach((dPlanet) => {
			orrery.classes._dwarfPlanets[dPlanet.id] = new DwarfPlanet(dPlanet);
			orrery.classes._all[dPlanet.id] = orrery.classes._dwarfPlanets[dPlanet.id];
		});

		orrery.bodies._asteroid.forEach((asteroid) => {
			orrery.classes._asteroids[asteroid.id] = new Asteroid(asteroid);
			orrery.classes._all[asteroid.id] = orrery.classes._asteroids[asteroid.id];
		});

		orrery.bodies._moons.forEach((moon) => {
			const parentEntity = orrery.classes._all[moon.aroundPlanet.planet];
			orrery.classes._moons[moon.id] = new Moon(moon, parentEntity);
			orrery.classes._all[moon.id] = orrery.classes._moons[moon.id];
		});

		// MESH BUILDING
		orrery.classes._sun.build();
		Object.values(orrery.classes._planets).forEach((item) => item.build());
		Object.values(orrery.classes._dwarfPlanets).forEach((item) => item.build());

		new Vue({
			el: orrery.vueTarget,
			data: {
				searchQuery: '',
				searchResults: [],
				navigationSystems: settings.navigationSystems,
				navigationEntities: settings.navigationEntities,
				searchLoaded: false,
				bottomBar: {},
				showMoons: true, // TODO: will need to be controlled by 3D Orrery then passed to this
				content: {},
				// comparisons: [],
				// media: [],
				clickedClassData: null,
				zoomedClassData: null,
				modelSystemSelection: {}, // for keeping track of what's selected between systems
				modelMoonGroupSelection: {}, // for keeping track of which moon group is filtered per system
				modelMoonSelection: {}, // for keeping track of which moon in each moon group has been selected
				moonGroupRefresh: 12345, // needing to force an update on the rendered moons when Moon Group button interacted with, doing this via :key and a random int [0-10000]
				tabGroup: 'tab-desc',
			},
			computed: {
				systemColour() {
					if (!this.clickedClassData) return;
					return this.clickedClassData.aroundPlanet
						? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.labelColour
						: this.clickedClassData.labelColour;
				},
				currentSystem() {
					if (!this.clickedClassData) return 'Solar System';
					if (this.clickedClassData.type === 'Star') {
						return `The <span class="text-system-color">${this.clickedClassData.displayName}</span>`;
					} else {
						// checking if Moon or Entity
						const entity = this.clickedClassData
							? `<span class="text-system-color">${this.clickedClassData.system}</span>`
							: 'Solar';
						return `${entity} System`;
					}
				},

				distanceFromParentEntity() {
					if (!this.clickedClassData) return;
					// to be in km or AU depending on amount
					// also shouldn't be more than 2 floating points
					const kmToAUConverter = 149598000;
					const isClose = this.clickedClassData.semimajorAxis < kmToAUConverter / 3;
					const parentEntity =
						this.clickedClassData.type === 'Moon'
							? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.displayName
							: 'Sun';
					if (isClose) {
						return `<span class="label-color">${new Intl.NumberFormat('en-US').format(
							this.clickedClassData.semimajorAxis
						)}</span> km from ${parentEntity}`;
					} else {
						const distanceNumber = this.convertToAU(this.clickedClassData.semimajorAxis).toFixed(2).split('.');
						// also, if floating points are '.00', then disclude them
						const floatingPoints = distanceNumber[1].toString() !== '00' ? '.' + distanceNumber[1] : '';
						return `<span class="label-color">${distanceNumber[0] + floatingPoints}</span> AU from ${parentEntity}`;
					}
				},

				sideralOrbit() {
					if (!this.clickedClassData || !this.clickedClassData.sideralOrbit) return;
					// siderals more than a year should return years rather than days
					const sideralConversion =
						this.clickedClassData.sideralOrbit > 366
							? this.clickedClassData.sideralOrbit / 365.26
							: this.clickedClassData.sideralOrbit;
					// sideral orbit to be to max of 2 floating points (or none if it's .00)
					const sideral = sideralConversion.toFixed(2).split('.');
					const floatingPoints = sideral[1].toString() !== '00' ? '.' + sideral[1] : '';
					return sideral[0] + floatingPoints;
				},

				showMoonsArrowClass() {
					return this.showMoons ? 'fa-angle-down' : 'fa-angle-up';
				},

				moonGroups() {
					if (!this.clickedClassData) return {};
					const moonKeys =
						this.clickedClassData.type === 'Moon'
							? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.moons
							: this.clickedClassData.moons;
					if (!moonKeys) return {};
					const moonGroups = {};
					moonKeys.forEach((moonKey) => {
						const moonGroupName = orrery.classes._all[moonKey.moon].data.moonGroup;
						const moonGroupKey = convertToCamelCase(moonGroupName);
						moonGroups[moonGroupKey] = moonGroups[moonGroupKey] || {
							name: moonGroupName,
							count: 0,
							id: convertToCamelCase(moonGroupName),
							moons: [],
							systemId: convertToCamelCase(orrery.classes._all[moonKey.moon].data.system)
						};
						moonGroups[moonGroupKey].count++;
						moonGroups[moonGroupKey].moons.push(moonKey.moon);
					});
					return moonGroups;
				},

				moons() {
					if (!this.clickedClassData) return [];
					const moonKeys =
						this.clickedClassData.type === 'Moon'
							? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.moons
							: this.clickedClassData.moons;
					if (!moonKeys) return [];
					return moonKeys.map((moonKey) => {
						const moonClassData = orrery.classes._all[moonKey.moon].data;
						return {
							displayName: moonClassData.displayName,
							id: moonClassData.id,
							index: this.navigationEntities.indexOf(moonClassData.id),
							moonGroupId: moonClassData.moonGroupId
						};
					});
				},

				activeMoonGroupId() {
					if (!this.clickedClassData || !this.clickedClassData.moonGroup) return '';
					return convertToCamelCase(this.clickedClassData.moonGroup);
				}
			},
			methods: {
				convertToAU(km) {
					return kmToAU(km);
				},
				// convertToKm(au){
				// 	return AUToKm(au);
				// },
				highlightMatchSubstring(str) {
					const regex = new RegExp(this.searchQuery, 'gi');
					return str.toString().replace(regex, (replacedStr) => `<span class="highlight">${replacedStr}</span>`);
				},

				updateSearch() {
					this.searchLoaded = false;
					if (!this.searchQuery) return;

					this.searchResults.splice(0); // clear previous set of results

					// filter the _all based on the 'searchQuery'
					const filteredResults = Object.values(orrery.classes._all)
						.filter((item) => item.data.displayName.toLowerCase().includes(this.searchQuery.toLowerCase()))
						.map((result) => result.data);

					// splitting the results by Type, then recombining into the final Search Results
					const stars = filteredResults.filter((r) => r.type === 'Star');
					const planets = filteredResults.filter((r) => r.type === 'Planet');
					const dwarfPlanets = filteredResults.filter((r) => r.type === 'Dwarf Planet');
					// const asteroids = filteredResults.filter((r) => r.type === 'Asteroids');
					// further splitting out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever', they're less important)
					const namedMoons = filteredResults.filter((r) => r.type === 'Moon' && !r.displayName.includes('S/2'));
					const unnamedMoons = filteredResults.filter((r) => r.type === 'Moon' && r.displayName.includes('S/2'));
					// const asteroids = filteredResults
					// 	.filter((r) => r.type === 'Asteroid')
					// 	.sort((a, b) => a.displayName < b.displayName);

					const sortedResults = []
						.concat(stars, planets, dwarfPlanets, namedMoons, unnamedMoons)
						.map((result) => {
							return {
								id: result.id,
								index: this.navigationEntities.indexOf(result.id),
								displayName: this.highlightMatchSubstring(result.displayName),
								type: result.type,
								system: result.system
							};
						})
						.slice(0, checkIfDesktop() ? 12 : 6); // cap the results depending on display-size for UX

					this.searchResults = [...sortedResults];
					this.$nextTick(() => {
						this.searchLoaded = true;
					});
				},

				goToPreviousSystem() {
					const systemKeys = this.navigationSystems;
					const currentIndex =
						this.clickedClassData && this.clickedClassData.type !== 'Star'
							? systemKeys.indexOf(this.clickedClassData.system.toLowerCase())
							: 0;
					const prevIndex = this.clickedClassData && currentIndex !== 0 ? currentIndex - 1 : systemKeys.length - 1;
					let prevSystemKey = systemKeys[prevIndex].toLowerCase();
					// checking to see if entity in prev system was already previously selected
					prevSystemKey = this.modelSystemSelection[prevSystemKey] || prevSystemKey;
					this.updateEntity(orrery.classes._all[prevSystemKey].data);
				},

				goToNextSystem() {
					const systemKeys = this.navigationSystems;
					const currentIndex =
						this.clickedClassData && this.clickedClassData.type !== 'Star'
							? systemKeys.indexOf(this.clickedClassData.system.toLowerCase())
							: 0;
					const nextIndex = this.clickedClassData && currentIndex + 1 < systemKeys.length ? currentIndex + 1 : 0;
					let nextSystemKey = systemKeys[nextIndex].toLowerCase();
					// checking to see if entity in next system was already previously selected
					nextSystemKey = this.modelSystemSelection[nextSystemKey] || nextSystemKey;
					this.updateEntity(orrery.classes._all[nextSystemKey].data);
				},

				updateMoonGroup(id) {
					this.$set(this.modelMoonGroupSelection, this.clickedClassData.systemId, id);
					this.moonGroupRefresh = randomString(8);
				},

				updateEntity(data) {
					const newClickedClassData = data;
					this.clickedClassData = newClickedClassData;
					document.querySelector(':root').style.setProperty('--entity-color', this.clickedClassData.labelColour);
					document.querySelector(':root').style.setProperty('--system-color', this.systemColour);

					// keeping track of what's been selected between each system
					this.modelSystemSelection[this.clickedClassData.systemId] = newClickedClassData.id;

					// also keeping track of what's been selected between each moon group for :checked
					if (!this.clickedClassData.moonGroupId) {
						// if moonGroup doesn't exist in selection model, always select the first moon group by default
						if (this.clickedClassData.moons) {
							const firstMoonKey = this.clickedClassData.moons[0].moon;
							this.modelMoonGroupSelection[this.clickedClassData.systemId] =
								orrery.classes._all[firstMoonKey].data.moonGroupId;
						}
					} else {
						this.modelMoonGroupSelection[this.clickedClassData.systemId] = this.clickedClassData.moonGroupId;
					}

					// finally, keeping track of which moon is selected in each moon group
					this.modelMoonSelection[this.clickedClassData.moonGroupId] =
						this.clickedClassData.type === 'Moon' ? newClickedClassData.id : '';

					// manually setting the :checked here
					// changing a moon group should not update the entity
					this.$nextTick(() => {
						[...document.querySelectorAll('#moon-groups-wrapper input')].forEach((moonGroup) => {
							moonGroup.checked = this.modelMoonGroupSelection[this.clickedClassData.systemId] === moonGroup.id;
						});
					});
				},

				goToPreviousEntity() {
					const keys = this.navigationEntities;
					const currentIndex = keys.indexOf(this.clickedClassData.id);
					const prevIndex = currentIndex !== 0 ? currentIndex - 1 : keys.length - 1;
					this.updateEntity(orrery.classes._all[keys[prevIndex]].data);
				},

				goToNextEntity() {
					const keys = this.navigationEntities;
					const currentIndex = keys.indexOf(this.clickedClassData.id);
					const nextIndex = currentIndex + 1 < keys.length ? currentIndex + 1 : 0;
					this.updateEntity(orrery.classes._all[keys[nextIndex]].data);
				},

				resetSearch() {
					this.searchQuery = '';
					this.searchResults.splice(0);
				},

				updateClickTarget(i) {
					const clickedClass = orrery.classes._all[this.navigationEntities[i]];
					document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: clickedClass }));
				},

				updateZoomTarget(i) {
					const clickedClass = orrery.classes._all[this.navigationEntities[i]];
					orrery.mouseState._clickedClass = clickedClass; // updating _clickedClass here to trigger the _zoomedClass change
					document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: clickedClass }));
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

				orrery.vueTarget.addEventListener(customEventNames.updateClickTargetVue, () => {
					this.updateEntity(orrery.mouseState._clickedClass.data);
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
