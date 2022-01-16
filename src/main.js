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
import { skyboxTexturePaths } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { Planet, DwarfPlanet, Asteroid, Sun, Moon } from './modules/objectProps';
import { sortData, APIRequest } from './modules/data/api';
import { scene } from './modules/scene';
import { customEventNames } from './modules/events/customEvents';

import Vue from 'vue/dist/vue.js';
import LightBox from 'vue-it-bigger';

window.settings = settings;
window.renderLoop = '';

let delta;

window.renderer = renderer;

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
		orrery.bodies._allPlanets = [...sortedData.planets.concat(sortedData.dwarfPlanets)];

		// --------------------
		// Creating Classes and building Labels
		// --------------------

		orrery.classes._sun = new Sun(orrery.bodies._sun);
		orrery.classes._all.sun = orrery.classes._sun;

		const generateMoonClasses = (parentClass) => {
			if (parentClass.data.moons && parentClass.data.moons.length) {
				for (const moon of parentClass.data.moons) {
					parentClass.moonClasses[moon.id] = new Moon(moon, parentClass);
					orrery.classes._moons[moon.id] = parentClass.moonClasses[moon.id];
					orrery.classes._all[moon.id] = parentClass.moonClasses[moon.id];
				}
			}
		};

		for (const planet of orrery.bodies.types._planet) {
			orrery.classes._planets[planet.id] = new Planet(planet);
			orrery.classes._all[planet.id] = orrery.classes._planets[planet.id];
			generateMoonClasses(orrery.classes._planets[planet.id]);
		}

		for (const dPlanet of orrery.bodies.types._dwarfPlanet) {
			orrery.classes._dwarfPlanets[dPlanet.id] = new DwarfPlanet(dPlanet);
			orrery.classes._all[dPlanet.id] = orrery.classes._dwarfPlanets[dPlanet.id];
			generateMoonClasses(orrery.classes._dwarfPlanets[dPlanet.id]);
		}

		for (const asteroid of orrery.bodies.types._asteroid) {
			orrery.classes._asteroids[asteroid.id] = new Asteroid(asteroid);
			orrery.classes._all[asteroid.id] = orrery.classes._asteroids[asteroid.id];
			generateMoonClasses(orrery.classes._asteroids[asteroid.id]);
		}

		scene.add(skybox(skyboxTexturePaths));

		// MESH BUILDING
		orrery.classes._sun.build();
		Object.values(orrery.classes._planets).forEach((item) => item.build());
		Object.values(orrery.classes._dwarfPlanets).forEach((item) => item.build());

		Vue.component('lightbox', LightBox);
		new Vue({
			el: orrery.vueTarget,
			data: {
				searchQuery: '',
				navigationSystems: settings.navigationSystems,
				navigationEntities: settings.navigationEntities,
				showSearchMobile: false,
				bottomBar: {},
				sidebarOpen: false,
				clickedClassData: null,
				zoomedClassData: null,
				systemClassData: null,
				modelSystemSelection: {}, // for keeping track of what's selected between systems
				modelMoonGroupSelection: {}, // for keeping track of which moon group is filtered per system
				modelMoonSelection: {}, // for keeping track of which moon in each moon group has been selected
				tabGroup: 'tab-system'
			},
			computed: {
				nameApoapsis() {
					if (this.clickedClassData.aroundPlanet && this.clickedClassData.aroundPlanet.planet === 'earth')
						return 'Apogee';
					return this.clickedClassData.aroundPlanet ? 'Apoapsis' : 'Aphelion';
				},
				namePeriapsis() {
					if (this.clickedClassData.aroundPlanet && this.clickedClassData.aroundPlanet.planet === 'earth')
						return 'Perigee';
					return this.clickedClassData.aroundPlanet ? 'Periapsis' : 'Perihelion';
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
					// to be in km or AU depending on amount
					const parentEntity = this.clickedClassData.aroundPlanet
						? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.displayName
						: 'Sun';

					if (!this.clickedClassData.semimajorAxis) {
						console.warn('Semi-Major Axis required.');
						return;
					}
					return {
						value: this.distanceConverter(this.clickedClassData.semimajorAxis, true).value,
						unit: `${this.distanceConverter(this.clickedClassData.semimajorAxis, true).unit} from ${parentEntity}`
					};
				},

				moonGroups() {
					if (!this.systemClassData.moons) return null;
					// using Set to remove duplicates
					const moonGroupNames = [...new Set(Object.values(this.systemClassData.moons).map((m) => m.moonGroup))];
					return moonGroupNames.map((moonGroupName) => {
						const moons = this.systemClassData.moons.filter((m) => m.moonGroup === moonGroupName);
						return {
							name: moonGroupName,
							color: moons[0].moonGroupColor,
							moons
						};
					});
				},

				searchResults() {
					if (!this.searchQuery) return null;

					// filter the _all based on the 'searchQuery'
					const filteredResults = orrery.bodies._all.filter((item) =>
						item.displayName.toLowerCase().includes(this.searchQuery.toLowerCase())
					);

					// splitting the results by Type, then recombining into the final Search Results
					const sortedResults = filteredResults
						.sort((a, b) => {
							if (a.type === 'Star' || b.type === 'Star') return a.type === 'Star' ? -1 : 1;
							else if (a.type === 'Planet' || b.type === 'Planet') return a.type === 'Planet' ? -1 : 1;
							else if (a.type === 'Dwarf Planet' || b.type === 'Dwarf Planet')
								return a.type === 'Dwarf Planet' ? -1 : 1;
							else if (a.type === 'Comet' || b.type === 'Comet') return a.type === 'Comet' ? -1 : 1;
							else if (a.type === 'Asteroid' || b.type === 'Asteroid') return a.type === 'Asteroid' ? -1 : 1;
							else if (a.type === 'Moon' || b.type === 'Moon') {
								// further split out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever', they're less important)
								return a.type === 'Moon' && !a.displayName.includes('S/2') ? -1 : 1;
							} else return -1;
						})
						.map((result) => {
							return {
								id: result.id,
								index: this.navigationEntities.indexOf(result.id),
								displayName: this.highlightMatchSubstring(result.displayName),
								type: result.type,
								system: result.system
							};
						})
						.slice(0, 12); // cap the results (TODO: might change this later and implement max-height)

					return sortedResults;
				}
			},
			methods: {
				convertToAU(km) {
					return kmToAU(km);
				},

				pluralise(word, value) {
					if (!word || !value) {
						// TODO: I'd imagine Typescript could take care of this automatically
						console.warn('Word and Value required.');
						return '';
					}
					return `${word}${value !== 1 ? 's' : ''}`;
				},

				valueWithCommas(value) {
					if (!value) return;
					return new Intl.NumberFormat('en-US').format(value);
				},

				valueToFixedFloatingPoints(value, amountPoints) {
					if (!value) return;
					const distanceNumber = value.toFixed(amountPoints || 2).split('.');
					const floatingPoints = distanceNumber[1].toString() !== '00' ? '.' + distanceNumber[1] : '';
					return parseFloat(distanceNumber[0] + floatingPoints);
				},

				distanceConverter(value) {
					if (!value) {
						console.warn('Distance required.');
						return {};
					}
					// convert from km to AU if distance more than 0.66 AU
					const kmToAUThreshold = 149598000;
					const isClose = value < kmToAUThreshold / 2;

					return {
						value: this.valueWithCommas(this.valueToFixedFloatingPoints(isClose ? value : this.convertToAU(value))),
						unit: isClose ? 'km' : 'AU'
					};
				},

				// data from the API is in hours OR days
				// if it's many hours, return days
				// if it's many, many days, return years
				timeConversion(value, unit) {
					if (!value || !unit) {
						console.warn('Value and Unit required.');
						return;
					}

					if (unit === 'hours') {
						// TODO: these could come from a global 'conversions' source
						const convertedHours = value;
						const convertedDays = value / 24;
						const convertedYears = value / 365.256 / 24;
						if (value < 48) {
							const hours = this.valueToFixedFloatingPoints(convertedHours);
							return {
								value: this.valueWithCommas(hours),
								unit: `Earth ${this.pluralise('hour', hours)}`
							};
						}
						// 320 days
						if (value < 7680) {
							const days = this.valueToFixedFloatingPoints(convertedDays);
							return {
								value: this.valueWithCommas(days),
								unit: `Earth ${this.pluralise('day', days)}`
							};
						}
						const years = this.valueToFixedFloatingPoints(convertedYears);
						return {
							value: this.valueWithCommas(years),
							unit: `Earth ${this.pluralise('year', years)}`
						};
					}
					if (unit === 'days') {
						const convertedHours = value * 24;
						const convertedDays = value;
						const convertedYears = value / 365.256;
						if (value < 2) {
							const hours = this.valueToFixedFloatingPoints(convertedHours);
							return {
								value: this.valueWithCommas(hours),
								unit: `Earth ${this.pluralise('hour', hours)}`
							};
						}
						if (value < 320) {
							const days = this.valueToFixedFloatingPoints(convertedDays);
							return {
								value: this.valueWithCommas(days),
								unit: `Earth ${this.pluralise('day', days)}`
							};
						}
						const years = this.valueToFixedFloatingPoints(convertedYears);
						return {
							value: this.valueWithCommas(years),
							unit: `Earth ${this.pluralise('year', years)}`
						};
					}
				},

				generateWikipediaUrl(articleTitle) {
					const baseUrl = 'https://en.wikipedia.org/w/api.php';
					const queryParams = [
						['format', 'json'],
						['action', 'query'],
						['prop', 'extracts|pageimages'],
						['exintro', '1'],
						// ['explaintext', '1'], // we want the HTML, so just text content. Saves needing to do extra formatting.
						['redirects', '1'],
						['titles', articleTitle],
						['origin', '*'],
						['pithumbsize', 100]
					];

					return `${baseUrl}?${queryParams.map((q) => [q[0], q[1]].join('=')).join('&')}`;
				},

				getWikipediaData() {
					// to stop making repeated requests to endpoints that return no results
					if (this.clickedClassData.description.noResults) return;

					this.clickedClassData.description.errors.splice(0);

					const url = this.generateWikipediaUrl(this.clickedClassData.wikipediaKey);
					const apiRequest = this.clickedClassData.description.apiRequester || new APIRequest();
					apiRequest.GET(url).then((response) => {
						const desc = this.clickedClassData.description;
						desc.hasLoaded = true;
						if (response.errors.length) {
							desc.hasError = true;
							for (const error of response.errors) desc.errors.push(error);
							return;
						}

						const result = response.result;
						if (!Object.keys(response.result).length) {
							desc.noResults = true;
							return;
						}

						const content = Object.values(result.query.pages)[0];
						let formattedContent,
							image = null;
						if (content.extract) {
							formattedContent = content.extract;
							formattedContent = formattedContent.replace('<span></span>', '');
							// removing everything in parentheses since it's usually junk
							formattedContent = formattedContent.replace(/ *\([^)]*\) */g, ' ');
							formattedContent = formattedContent.replace(' ()', '').replace(' ,', ',').replace(',,', ',');
						}

						if (content.thumbnail) {
							image = content.thumbnail;
							image.alt = content.pageimage;
						}

						desc.title = content.title;
						desc.content = formattedContent;
						desc.image = content.image;
					});
				},

				generateNASAMediaUrl(key, pageNumber) {
					// https://solarsystem.nasa.gov/api/v1/resources/?page=0&per_page=25&order=created_at+desc&search=&href_query_params=category%3Dplanets_jupiter&button_class=big_more_button&tags=jupiter&condition_1=1%3Ais_in_resource_list&category=51
					// ?order=pub_date+desc&per_page=50&page=0&search=venus&condition_1=1%3Ais_in_resource_list&fs=&fc=51&ft=&dp=&category=51
					const baseUrl = 'https://solarsystem.nasa.gov/api/v1/resources/';
					const queryParams = [
						['page', pageNumber || '0'],
						['per_page', '18'],
						['order', 'created_at+desc'],
						['href_query_params', 'category%3Dplanets_jupiter'],
						['search', key],
						// ['tags', key],
						['condition_1', '1%3Ais_in_resource_list'],
						// for images
						['category', '51'],
						['fc', '51']
					];

					return `${baseUrl}?${queryParams.map((q) => [q[0], q[1]].join('=')).join('&')}`;
				},

				getNASAMediaData(isLoadingMore) {
					// to stop making repeated requests to endpoints that return no results
					if (this.clickedClassData.media.noResults) return;

					if (isLoadingMore) this.clickedClassData.media.loadingMore = true;
					this.clickedClassData.media.errors.splice(0);
					const pageRequestNumber = this.clickedClassData.media.items.length
						? this.clickedClassData.media.items.length / this.clickedClassData.media.per_page
						: 0;

					const url = this.generateNASAMediaUrl(this.clickedClassData.name, pageRequestNumber);
					const apiRequest = this.clickedClassData.media.apiRequester || new APIRequest();
					apiRequest.GET(url).then((response) => {
						const media = this.clickedClassData.media;
						media.hasLoaded = true;
						if (response.errors.length) {
							media.hasError = true;
							for (const error of response.errors) media.errors.push(error);
							return;
						}

						if (!response.result || !response.result.items || !response.result.items.length) {
							media.noResults = true;
							return;
						}

						this.clickedClassData.media.loadingMore = false;

						const { total, more, page, items, per_page } = response.result;
						media.total = total;
						media.more = more;
						media.page = page;
						media.per_page = per_page;
						for (const item of items) {
							item.list_image_src = `https://solarsystem.nasa.gov${item.list_image_src}`;
							item.detail_image = `https://solarsystem.nasa.gov${item.detail_image}`;
							item.link = `https://solarsystem.nasa.gov${item.link}`;
							media.items.push(item);

							const formattedDetails = item.short_description
								// splitting desc by paragraphs so can work with it
								// removing paragraphs with links back to NASA's FAQs and such, looks weird
								.replaceAll('\n', '')
								.trim()
								.split('</p>')
								.filter((p) => !p.toLowerCase().includes('href'))
								.join('</p>');
							media.lightboxData.push({
								type: 'image',
								thumb: item.list_image_src,
								src: item.detail_image,
								caption: formattedDetails
							});
						}

						// short_description
						// link
						// title

						// list_image_src
						// detail_image
					});
				},

				openGallery(i) {
					this.$refs.lightbox.showImage(i);
				},

				switchDetailTabs() {
					if (this.tabGroup === 'tab-desc') {
						if (!this.clickedClassData.description.content) this.getWikipediaData();
					}

					if (this.tabGroup === 'tab-media') {
						if (!this.clickedClassData.media.lightboxData.length) this.getNASAMediaData();
					}
				},

				highlightMatchSubstring(str) {
					const regex = new RegExp(this.searchQuery, 'gi');
					return str.toString().replace(regex, (replacedStr) => `<span class="highlight">${replacedStr}</span>`);
				},

				updateSearch() {
					this.searchLoaded = false;
					if (!this.searchQuery) return;

					this.searchResults.splice(0); // clear previous set of results

					// filter the _all based on the 'searchQuery'
					const filteredResults = orrery.bodies._all.filter((item) =>
						item.displayName.toLowerCase().includes(this.searchQuery.toLowerCase())
					);

					// splitting the results by Type, then recombining into the final Search Results
					const sortedResults = filteredResults
						.sort((a, b) => {
							if (a.type === 'Star' || b.type === 'Star') return a.type === 'Star' ? -1 : 1;
							else if (a.type === 'Planet' || b.type === 'Planet') return a.type === 'Planet' ? -1 : 1;
							else if (a.type === 'Dwarf Planet' || b.type === 'Dwarf Planet')
								return a.type === 'Dwarf Planet' ? -1 : 1;
							else if (a.type === 'Comet' || b.type === 'Comet') return a.type === 'Comet' ? -1 : 1;
							else if (a.type === 'Asteroid' || b.type === 'Asteroid') return a.type === 'Asteroid' ? -1 : 1;
							else if (a.type === 'Moon' || b.type === 'Moon') {
								// further split out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever', they're less important)
								return a.type === 'Moon' && !a.displayName.includes('S/2') ? -1 : 1;
							} else return -1;
						})
						.map((result) => {
							return {
								id: result.id,
								index: this.navigationEntities.indexOf(result.id),
								displayName: this.highlightMatchSubstring(result.displayName),
								type: result.type,
								system: result.system
							};
						})
						.slice(0, 12); // cap the results (TODO: might change this later and implement max-height)

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

				updateEntity(data) {
					const newClickedClassData = data;

					if (!this.sidebarOpen && !this.clickedClassData) this.sidebarOpen = true; // show sidebar if it's the first time an entity has been clicked

					this.clickedClassData = newClickedClassData;
					this.systemClassData = this.clickedClassData.aroundPlanet
						? orrery.classes._all[this.clickedClassData.id].planetClass.data
						: this.clickedClassData;
					document.querySelector(':root').style.setProperty('--entity-color', this.clickedClassData.labelColour);
					document.querySelector(':root').style.setProperty('--system-color', this.systemClassData.labelColour);

					if (this.moonGroups) {
						for (let i = 0; i < this.moonGroups.length; i++) {
							document.querySelector(':root').style.setProperty(`--moon-group-color-${i}`, this.moonGroups[i].color);
						}
					}

					// keeping track of what's been selected between each system
					this.modelSystemSelection[this.clickedClassData.systemId] = this.clickedClassData.id;

					this.switchDetailTabs(); // to trigger the API loader for content (if it's needed)
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
				},

				showOrHideMobileSearch() {
					if (!this.showSearchMobile) {
						this.showSearchMobile = true;
						this.$nextTick(() => {
							document.querySelector('#input-search-mobile').focus();
						});
					} else {
						this.showSearchMobile = false;
					}
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
					this.showSearchMobile = false;
				}
			},
			mounted() {
				document.querySelector('main').prepend(labelRenderer.domElement);

				// TODO: These should be moved to a JS file that sets generic listeners
				document.addEventListener('click', (e) => {
					if (!e.target.closest('#search')) {
						this.resetSearch();
					}

					// if (this.showSearchMobile && !e.target.closest('#search-results-mobile')) {
					// 	// this.showSearchMobile = false;
					// 	console.log('close search mobile');
					// 	console.log(e);
					// }

					// if (!e.target.closest('#sidebar-ui-details')) {
					// 	setTimeout(() => {
					// 		if (this.sidebarOpen) {
					// 			this.sidebarOpen = false;
					// 		}
					// 	}, 1000);
					// }
				});

				document.addEventListener('keydown', (e) => {
					if (e.key === 'Escape' && !document.body.classList.contains('vib-open')) {
						this.sidebarOpen = false;
					}
				});

				orrery.vueTarget.addEventListener(customEventNames.updateClickTargetVue, () => {
					this.updateEntity(orrery.mouseState._clickedClass.data);
				});

				orrery.vueTarget.addEventListener(customEventNames.updateZoomTargetVue, () => {
					this.zoomedClassData = orrery.mouseState._zoomedClass.data;
				});
				// ---

				labelRenderer.render(scene, orrery.camera);

				// --------------------
				// Setting Events
				// --------------------
				initMousePointerEvents();

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
