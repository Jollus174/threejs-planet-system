'use strict';
import './scss/styles.scss';

import * as THREE from 'three';
import { orrery } from './modules/orrery';
import { settings } from './modules/settings';
import { controls } from './modules/controls';
import { renderer, composer } from './modules/renderers/renderer';
import { labelRenderer } from './modules/renderers/labelRenderer';
import { easeTo } from './modules/utilities/animation';
import { checkIfDesktop } from './modules/utilities/dom';
import { randomString } from './modules/utilities/strings';
import { kmToAU } from './modules/utilities/astronomy';
import { pointLights, spotLights, ambientLights } from './modules/lights';
import { skyboxTexturePaths } from './modules/data/solarSystem';
import { asteroidBelt, skybox, starField } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { Planet, DwarfPlanet, Asteroid, Sun, Moon } from './modules/objectProps';
import { sortData, APIRequest } from './modules/data/api';
import { scene } from './modules/scene';

import { RenderPass, EffectPass, SMAAEffect, SMAAPreset, EdgeDetectionMode, SMAAImageGenerator } from 'postprocessing';

import { customEventNames } from './modules/events/customEvents';
import { evRenderPause, evRenderStart } from './modules/events/events';

import Vue from 'vue/dist/vue.js';
import LightBox from 'vue-it-bigger';
import { format, add, differenceInHours } from 'date-fns';

window.settings = settings;
window.renderLoop = '';

let delta;

window.renderer = renderer;
window.composer = composer;

const clock = new THREE.Clock();
const vectorPosition = new THREE.Vector3();

document.addEventListener(customEventNames.updateClickTarget, (e) => {
	const clickedClass = e.detail;
	const newClickedClassSameAsOld = orrery.mouseState._clickedClass
		? clickedClass.data.id === orrery.mouseState._clickedClass.data.id
		: false;

	const cameraIsOutsideSystem = orrery.mouseState._clickedClass
		? orrery.cameraState._currentPlanetInRange !== orrery.mouseState._clickedClass.data.systemId
		: false;

	const previousSelectionWasSameSystem = orrery.mouseState._clickedClass
		? clickedClass.data.systemId === orrery.mouseState._clickedClass.data.systemId
		: false;

	// remove a temp-rendered moon item from across in another system
	if (cameraIsOutsideSystem && !newClickedClassSameAsOld) {
		if (previousSelectionWasSameSystem) {
			orrery.mouseState._clickedClass.removeCSSLabel();
			clickedClass.createCSSLabel();
		} else {
			// Different system selected!
			// If whatever was previously selected in the previous system was a moon, delete it
			// then restore the base entity label for that system
			if (orrery.mouseState._clickedClass.data.bodyType === 'Moon') {
				orrery.mouseState._clickedClass.removeCSSLabel(); // only do this if whatever was selected wasn't a moon...
				orrery.classes._all[orrery.mouseState._clickedClass.data.systemId].createCSSLabel();
			}
		}
	}

	orrery.mouseState._clickedClass = clickedClass;

	orrery.vueTarget.dispatchEvent(new Event(customEventNames.updateEntityVue));

	// checking to see if the item has already been clicked
	// if it has, then zoom to it
	if (newClickedClassSameAsOld) {
		document.dispatchEvent(new CustomEvent(customEventNames.updateZoomTarget, { detail: clickedClass }));
	} else {
		orrery.mouseState._zoomedClass = null;
		orrery.cameraState._zoomToTarget = false;
		// orrery.mouseState._clickedClass = null; // TODO: this should be 'focused class'!
	}

	const labelSelected = document.querySelector('.label.label-selected');
	if (labelSelected) labelSelected.classList.remove('label-selected');

	clickedClass.labelLink.classList.add('label-selected');
});

document.addEventListener(customEventNames.updateZoomTarget, (e) => {
	const zoomedClass = e.detail;
	orrery.mouseState._zoomedClass = zoomedClass;

	orrery.cameraState._zoomToTarget = true; // to get the camera moving
	controls.minDistance = zoomedClass.data.meanRadius * 8;

	orrery.vueTarget.dispatchEvent(new Event(customEventNames.updateZoomEntityVue));
});

document.addEventListener(customEventNames.updateSystemMoonGroups, (e) => {
	const systemId = e.detail[0].systemId;
	for (const moonGroup of e.detail) {
		for (const moonId of moonGroup.moonIds) {
			const moon = orrery.classes._all[moonId];
			moon.setEnabled(moonGroup.isEnabled);
			moon.setSelected(moonGroup.isSelected);
		}
	}

	// build / destroy moons depending on which groups are enabled / disabled
	const systemClass = orrery.classes._all[systemId];
	const systemMoonClasses = Object.values(orrery.classes._all[systemId].moonClasses);
	const toBuild = systemMoonClasses.filter((m) => m.isEnabled);
	const toDestroy = systemMoonClasses.filter((m) => !m.isEnabled && m.isBuilt);

	// only do if in range!
	const cameraIsInSystem = orrery.mouseState._clickedClass
		? orrery.cameraState._currentPlanetInRange === orrery.mouseState._clickedClass.data.systemId
		: false;

	// only build fresh moon groups if in the system's range!
	if (cameraIsInSystem) {
		systemClass.buildMoons(toBuild);
		systemClass.destroyMoons(toDestroy);
	}
});

const updateProjectionViewSize = (width, height) => {
	renderer.setSize(width, height);
	composer.setSize(width, height);

	labelRenderer.setSize(width, height);
	orrery.camera.aspect = width / height;
	orrery.camera.updateProjectionMatrix();
	orrery.isDesktop = checkIfDesktop();
};

fetch('./solarSystemData.json')
	.then((response) => {
		if (!response.ok) throw new Error('Error retrieving Solar System data');
		return response.json();
	})
	.then((data) => {
		const sortedData = sortData(data.bodies);
		orrery.bodies._sun = sortedData.sun;
		orrery.bodies._allPlanets = [...sortedData.planets.concat(sortedData.dwarfPlanets)];

		// --------------------
		// Creating Classes and building Labels
		// --------------------

		orrery.classes._sun = new Sun(orrery.bodies._sun);
		orrery.classes._all._sun = orrery.classes._sun;

		const generateMoonClasses = (parentClass) => {
			if (parentClass.data.moons && parentClass.data.moons.length) {
				for (const moon of parentClass.data.moons) {
					parentClass.moonClasses[moon.id] = new Moon(moon, parentClass);
					orrery.classes._moons[moon.id] = parentClass.moonClasses[moon.id];
					orrery.classes._all[moon.id] = parentClass.moonClasses[moon.id];

					parentClass.moonClasses[moon.id].build();
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

		// for (const asteroid of orrery.bodies.types._asteroid) {
		// 	orrery.classes._asteroids[asteroid.id] = new Asteroid(asteroid);
		// 	orrery.classes._all[asteroid.id] = orrery.classes._asteroids[asteroid.id];
		// 	generateMoonClasses(orrery.classes._asteroids[asteroid.id]);
		// }

		// MESH BUILDING
		const buildPromises = [orrery.classes._sun.build()];
		Object.values(orrery.classes._planets).forEach((item) => buildPromises.push(item.build()));
		Object.values(orrery.classes._dwarfPlanets).forEach((item) => buildPromises.push(item.build()));

		Promise.all(buildPromises).then(() => {
			orrery.classes._allIterable = Object.values(orrery.classes._all);
			orrery.classes._allIterableLength = orrery.classes._allIterable.length;

			Vue.component('lightbox', LightBox);
			new Vue({
				el: orrery.vueTarget,
				data: {
					searchQuery: '',
					navigationSystems: settings.navigationSystems,
					navigationEntities: settings.navigationEntities,
					showSearchMobile: false,
					bottomBar: {},
					clickedClassData: orrery.classes._all._sun.data,
					zoomedClassData: null,
					sidebarMobileHeight: 400,
					sidebarDesktopWidth: 600,
					systemClassData: orrery.classes._all._sun.data,
					modelSystemSelection: {}, // for keeping track of what's selected between systems
					modelMoonGroups: {},
					tabGroup: 'tab-stats', // TODO: set this to Wikipedia by default
					vueRandomString: randomString(8),
					timeShiftTypes: { minutes: 0, hours: 0, days: 0, months: 0 },
					timeShiftTypeCurrentIndex: 0,
					dateTimeCurrent: new Date(),
					orreryRendererEl: renderer.domElement,
					labelRendererEl: labelRenderer.domElement
				},
				computed: {
					nameApoapsis() {
						if (!this.clickedClassData) return '';
						if (this.clickedClassData.aroundPlanet && this.clickedClassData.aroundPlanet.planet === 'earth')
							return 'Apogee';
						return this.clickedClassData.aroundPlanet ? 'Apoapsis' : 'Aphelion';
					},
					namePeriapsis() {
						if (!this.clickedClassData) return '';
						if (this.clickedClassData.aroundPlanet && this.clickedClassData.aroundPlanet.planet === 'earth')
							return 'Perigee';
						return this.clickedClassData.aroundPlanet ? 'Periapsis' : 'Perihelion';
					},
					currentSystem() {
						if (!this.clickedClassData) return 'Solar System';
						if (this.clickedClassData.bodyType === 'Star') {
							return `The <span class="text-system-color">${this.clickedClassData.displayName}</span>`;
						} else {
							// checking if Moon or Entity
							const entity = this.clickedClassData
								? `<span class="text-system-color">${this.clickedClassData.systemName}</span>`
								: 'Solar';
							return `${entity} System`;
						}
					},

					distanceFromParentEntity() {
						if (!this.clickedClassData) return null;
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

					searchResults() {
						if (!this.searchQuery) return null;

						// filter the _all based on the 'searchQuery'
						const filteredResults = orrery.bodies._all.filter((item) =>
							item.displayName.toLowerCase().includes(this.searchQuery.toLowerCase())
						);

						// splitting the results by bodyType, then recombining into the final Search Results
						const sortedResults = filteredResults
							.filter((item) => item.bodyType !== 'Asteroid')
							.sort((a, b) => {
								if (a.bodyType === 'Star' || b.bodyType === 'Star') return a.bodyType === 'Star' ? -1 : 1;
								else if (a.bodyType === 'Planet' || b.bodyType === 'Planet') return a.bodyType === 'Planet' ? -1 : 1;
								else if (a.bodyType === 'Dwarf Planet' || b.bodyType === 'Dwarf Planet')
									return a.bodyType === 'Dwarf Planet' ? -1 : 1;
								else if (a.bodyType === 'Comet' || b.bodyType === 'Comet') return a.bodyType === 'Comet' ? -1 : 1;
								else if (a.bodyType === 'Asteroid' || b.bodyType === 'Asteroid')
									return a.bodyType === 'Asteroid' ? -1 : 1;
								else if (a.bodyType === 'Moon' || b.bodyType === 'Moon') {
									// further splitting out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever' are less important)
									return a.bodyType === 'Moon' && !a.name.includes('S/2') ? -1 : 1;
								} else return -1;
							})
							.map((result) => {
								return {
									displayName: this.highlightMatchSubstring(result.displayName),
									data: { ...result }
								};
							})
							.slice(0, 12); // cap the results (TODO: might change this later and implement max-height)

						return sortedResults;
					},

					showSystemTopBar() {
						if (!this.clickedClassData) return;
						return (
							this.modelMoonGroups[this.clickedClassData.systemId] &&
							this.modelMoonGroups[this.clickedClassData.systemId].length > 1
						);
					},

					currentTimeShiftType() {
						const i = Math.abs(this.timeShiftTypeCurrentIndex);
						if (i === 1) return 'minutes';
						else if (i === 2) return 'hours';
						else if (i === 3) return 'days';
						else if (i === 4) return 'months';
						else return '';
					},

					dateTimeShifted() {
						return add(new Date(), { ...this.timeShiftTypes });
					},

					dateTimeDifference() {
						// this creates 'i', the iteration value
						// am using Earth as the base for orbit timings
						return differenceInHours(this.dateTimeShifted, new Date()) / 24;
					},

					dateTimeText() {
						const time = format(this.dateTimeShifted, `HH:mm:ss`);
						const days = format(this.dateTimeShifted, 'dd');
						const months = format(this.dateTimeShifted, 'MMM');
						const years = format(this.dateTimeShifted, 'yyyy');

						return `<time class="time">${time}</time> / <time class="days">${days}</time> / <time class="months">${months}</time> / <time class="years">${years}</time>`;
					}
				},
				methods: {
					timeShiftForwards() {
						if (this.timeShiftTypeCurrentIndex < 4) {
							this.timeShiftTypeCurrentIndex++;
						}
					},
					timeShiftBackwards() {
						if (-4 < this.timeShiftTypeCurrentIndex) {
							this.timeShiftTypeCurrentIndex--;
						}
					},
					timeShiftReset() {
						Object.keys(this.timeShiftTypes).forEach((timeShiftType) => (this.timeShiftTypes[timeShiftType] = 0));
						// TODO: This should be an event that each one is listening for!
						for (const entity of orrery.classes._allIterable) {
							entity.resetLabelGroupPosition();
						}
					},
					timeShiftStop() {
						this.timeShiftTypeCurrentIndex = 0;
					},

					regenerateRandomString() {
						this.vueRandomString = randomString(8);
					},
					updateClassMoonData() {
						const moonDataForClass = this.modelMoonGroups[this.clickedClassData.systemId].map((moonGroup) => {
							return {
								systemId: moonGroup.systemId,
								moonGroupId: moonGroup.id,
								isEnabled: moonGroup.isEnabled,
								isSelected: moonGroup.isSelected,
								moonIds: moonGroup.moons.map((m) => m.id)
							};
						});

						document.dispatchEvent(
							new CustomEvent(customEventNames.updateSystemMoonGroups, { detail: moonDataForClass })
						);
					},
					setMoonGroups() {
						if (!this.systemClassData || !this.systemClassData.moons) return;

						if (!this.modelMoonGroups[this.clickedClassData.systemId]) {
							// using Set to remove duplicates
							const moonGroupIds = [...new Set(Object.values(this.systemClassData.moons).map((m) => m.moonGroupId))];
							const mappedMoonGroups = moonGroupIds.map((moonGroupId, i) => {
								const moons = this.systemClassData.moons.filter((m) => m.moonGroupId === moonGroupId);
								return {
									id: moonGroupId,
									name: moons[0].moonGroupName,
									color: moons[0].moonGroupColor,
									showName: moons[0].moonGroupShowName,
									moonGroupIndex: moons[0].moonGroupIndex,
									moons,
									// switch on the selected moon group if it's the first visit by default, or else just switch on first one
									isEnabled:
										this.clickedClassData.bodyType === 'Moon'
											? moonGroupId === this.clickedClassData.moonGroupId
											: i === 0,
									isSelected: false,
									systemId: moons[0].systemId
								};
							});

							this.modelMoonGroups[this.clickedClassData.systemId] = mappedMoonGroups;
						}

						// if moon is selected, update its moonGroup to 'isSelected' so the UI + 3D can display it
						if (this.clickedClassData.bodyType === 'Moon') {
							const selectedMoonGroup = this.modelMoonGroups[this.clickedClassData.systemId].find(
								(moonGroup) => moonGroup.id === this.clickedClassData.moonGroupId
							);
							selectedMoonGroup.isEnabled = true;
							selectedMoonGroup.isSelected = true;
						}

						this.updateClassMoonData();
					},

					disableMoonGroup(moonGroupIndex) {
						const moonGroup = this.modelMoonGroups[this.clickedClassData.systemId][moonGroupIndex];
						moonGroup.isEnabled = false;
						moonGroup.isSelected = false;

						// to force a re-render of the moon tags + selected groups
						this.regenerateRandomString();

						// resets clicked target back to system planet if the selected entity is a moon and the moon group gets set to disabled
						if (
							(this.clickedClassData &&
								this.clickedClassData.moonGroupId &&
								this.clickedClassData.moonGroupId === moonGroup.id) ||
							(this.zoomedClassData &&
								this.zoomedClassData.moonGroupId &&
								this.zoomedClassData.moonGroupId === moonGroup.id)
						) {
							this.updateClickTarget(orrery.classes._all[this.clickedClassData.systemId].data);
						}

						this.updateClassMoonData();
					},

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

					distanceConverter(value, id) {
						if (!value) {
							console.warn(`Distance required for ${id}.`);
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
							['prop', 'extracts'],
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
							let formattedContent;
							if (content.extract) {
								formattedContent = content.extract;
								formattedContent = formattedContent.replace('<span></span>', '');
								formattedContent = formattedContent.replace('<p><br>', '<p>'); // Halimede article
								// removing everything returned in parentheses since it's usually junk
								// these sometimes come up ( ( nested ) ) too, so am removing them via loop

								let oldFormattedContent;
								do {
									oldFormattedContent = formattedContent;
									formattedContent = formattedContent.replace(/\([^\)\(]*\)/, '');
								} while (oldFormattedContent !== formattedContent);

								formattedContent = formattedContent
									.replaceAll(' ()', '')
									.replaceAll(' ,', ',')
									.replaceAll(' .', '.')
									.replaceAll(',,', ',')
									.replaceAll(' ;', ';')
									.replaceAll('—', ' - ');
							}

							desc.title = content.title;
							desc.content = formattedContent;
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

					isScrolledInView(el, container) {
						const cTop = container.scrollTop;
						const cBottom = cTop + container.clientHeight;

						// NOTE: elTop.offsetTop is relative to the nearest <tbody>!
						const elTop =
							el.offsetTop +
							el.closest('[data-selector="tbody-wrapper"]').offsetTop +
							el.closest('[data-selector="table-wrapper"]').offsetTop;
						const eBottom = elTop + el.clientHeight;

						// true if in view
						return elTop >= cTop && eBottom <= cBottom;
					},

					entityHovered(data) {
						orrery.classes._all[data.id].OrbitLine.eventHovered();
					},
					entityUnhovered(data) {
						orrery.classes._all[data.id].OrbitLine.eventUnhovered();
					},

					switchDetailTabs() {
						if (this.tabGroup === 'tab-desc') {
							if (!this.clickedClassData.description.content) this.getWikipediaData();
						}

						if (this.tabGroup === 'tab-system') {
							// TODO: set this to Wikipedia by default
							if (!this.modelMoonGroups[this.clickedClassData.systemId]) this.tabGroup = 'tab-stats';
							this.$nextTick(() => {
								const elContentSystem = document.querySelector('#content-system .content-wrapper');
								const activeTableRow = elContentSystem.querySelector('tr.entity-targeted');
								if (this.isScrolledInView(activeTableRow, elContentSystem)) return;

								activeTableRow.scrollIntoView({
									block: 'nearest'
								});
							});
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
								if (a.bodyType === 'Star' || b.bodyType === 'Star') return a.bodyType === 'Star' ? -1 : 1;
								else if (a.bodyType === 'Planet' || b.bodyType === 'Planet') return a.bodyType === 'Planet' ? -1 : 1;
								else if (a.bodyType === 'Dwarf Planet' || b.bodyType === 'Dwarf Planet')
									return a.bodyType === 'Dwarf Planet' ? -1 : 1;
								else if (a.bodyType === 'Comet' || b.bodyType === 'Comet') return a.bodyType === 'Comet' ? -1 : 1;
								else if (a.bodyType === 'Moon' || b.bodyType === 'Moon') {
									// further split out 'named moons' vs 'unnamed moons' (ones with 'S/2013-whatever', they're less important)
									return a.bodyType === 'Moon' && !a.displayName.includes('S/2') ? -1 : 1;
								} else if (a.bodyType === 'Asteroid' || b.bodyType === 'Asteroid')
									return a.bodyType === 'Asteroid' ? -1 : 1;
								else return -1;
							})
							.map((result) => {
								return {
									id: result.id,
									index: this.navigationEntities.indexOf(result.id),
									displayName: this.highlightMatchSubstring(result.displayName),
									bodyType: result.bodyType,
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
								? systemKeys.indexOf(this.clickedClassData.systemId)
								: 0;
						const prevIndex = this.clickedClassData && currentIndex !== 0 ? currentIndex - 1 : systemKeys.length - 1;
						// checking to see if entity in prev system was already previously selected
						const prevSystemKey = systemKeys[prevIndex];
						const prevSystem = orrery.classes._all[prevSystemKey];
						this.updateEntity(prevSystem.data);
						this.updateZoomTarget(prevSystem.data);
					},

					goToNextSystem() {
						const systemKeys = this.navigationSystems;
						const currentIndex =
							this.clickedClassData && this.clickedClassData.type !== 'Star'
								? systemKeys.indexOf(this.clickedClassData.systemId)
								: 0;
						const nextIndex = this.clickedClassData && currentIndex + 1 < systemKeys.length ? currentIndex + 1 : 0;
						// checking to see if entity in next system was already previously selected
						const nextSystemKey = systemKeys[nextIndex];
						const nextSystem = orrery.classes._all[nextSystemKey];
						this.updateEntity(nextSystem.data);
						this.updateZoomTarget(nextSystem.data);
					},

					goToPreviousEntity() {
						const keys = this.navigationEntities;
						const currentIndex = keys.indexOf(this.clickedClassData.id);
						const prevIndex = currentIndex !== 0 ? currentIndex - 1 : keys.length - 1;
						const prevEntity = orrery.classes._all[keys[prevIndex]];
						this.updateEntity(prevEntity.data);
						this.updateZoomTarget(prevEntity.data);
					},

					goToNextEntity() {
						const keys = this.navigationEntities;
						const currentIndex = keys.indexOf(this.clickedClassData.id);
						const nextIndex = currentIndex + 1 < keys.length ? currentIndex + 1 : 0;
						const nextEntity = orrery.classes._all[keys[nextIndex]];
						this.updateEntity(nextEntity.data);
						this.updateZoomTarget(nextEntity.data);
					},

					updateEntity(data) {
						this.clickedClassData = data;

						this.systemClassData = this.clickedClassData.aroundPlanet
							? orrery.classes._all[this.clickedClassData.id].planetClass.data
							: this.clickedClassData;
						document.querySelector(':root').style.setProperty('--entity-color', this.clickedClassData.labelColour);
						document.querySelector(':root').style.setProperty('--system-color', this.systemClassData.labelColour);

						this.setMoonGroups();

						if (this.modelMoonGroups[this.clickedClassData.systemId]) {
							for (let i = 0; i < this.modelMoonGroups[this.clickedClassData.systemId].length; i++) {
								document
									.querySelector(':root')
									.style.setProperty(
										`--moon-group-color-${i}`,
										this.modelMoonGroups[this.clickedClassData.systemId][i].color
									);
							}
						}

						// keeping track of what's been selected between each system
						this.modelSystemSelection[this.clickedClassData.systemId] = this.clickedClassData.id;

						this.switchDetailTabs(); // to trigger the API loader for content (if it's needed)
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

					updateClickTarget(data) {
						const clickedClass = orrery.classes._all[data.id];
						document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: clickedClass }));
					},

					updateZoomTarget(data) {
						const clickedClass = orrery.classes._all[data.id];
						orrery.mouseState._clickedClass = clickedClass; // updating _clickedClass here to trigger the _zoomedClass change
						document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: clickedClass }));
						this.resetSearch();
						this.showSearchMobile = false;
					},

					resizeSidebarMobile(e) {
						const diffBottom = window.innerHeight - e.y;
						document.querySelector(':root').style.setProperty('--sidebar-height-mobile', `${diffBottom - 18 * 2}px`);

						const { width, height } = this.orreryRendererEl.getBoundingClientRect();
						this.sidebarMobileHeight = height;
						updateProjectionViewSize(width, height);
					},

					resizeSidebarDesktop(e) {
						const diffRight = window.innerWidth - e.x;
						document.querySelector(':root').style.setProperty('--sidebar-width-desktop', `${diffRight}px`);

						const { width, height } = this.orreryRendererEl.getBoundingClientRect();
						this.sidebarDesktopWidth = diffRight;
						updateProjectionViewSize(width, height);
					},

					evResizeSidebarMobile() {
						document.addEventListener('pointermove', this.resizeSidebarMobile, false);
					},

					evResizeSidebarDesktop() {
						document.addEventListener('pointermove', this.resizeSidebarDesktop, false);
					}
				},
				mounted() {
					this.$refs.lightbox.$on('onOpened', () => {
						window.pauseRender();
					});

					this.$refs.lightbox.$on('onClosed', () => {
						window.startRender();
					});

					// adding renderers
					this.orreryRendererEl.id = 'bg';
					document.querySelector('#renderers-container').append(this.orreryRendererEl);
					this.labelRendererEl.id = 'label-renderer';
					document.querySelector('#renderers-container').append(this.labelRendererEl);

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
						// 		if (this.sidebarIsOpen) {
						// 			this.sidebarIsOpen = false;
						// 		}
						// 	}, 1000);
						// }
					});

					// document.addEventListener('keydown', (e) => {
					// 	if (e.key === 'Escape' && !document.body.classList.contains('vib-open')) {
					// 		this.closeSidebar();
					// 	}
					// });

					const handleResize = () => {
						const { width, height } = this.orreryRendererEl.getBoundingClientRect();
						updateProjectionViewSize(width, height);
					};

					window.addEventListener('resize', handleResize);

					orrery.vueTarget.addEventListener(customEventNames.updateEntityVue, () => {
						this.updateEntity(orrery.mouseState._clickedClass.data);
					});

					orrery.vueTarget.addEventListener(customEventNames.updateZoomEntityVue, () => {
						this.zoomedClassData = orrery.mouseState._zoomedClass.data;
					});

					// orrery.vueTarget.addEventListener(customEventNames.updateZoomTargetVue, () => {
					// 	this.zoomedClassData = orrery.mouseState._zoomedClass.data;
					// });
					// ---

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

					scene.add(skybox(skyboxTexturePaths));

					// targeting Sun by default
					document.dispatchEvent(
						new CustomEvent(customEventNames.updateClickTarget, { detail: orrery.classes._all._sun })
					);

					document.querySelector(':root').style.setProperty('--sidebar-height-mobile', `${this.sidebarMobileHeight}px`);
					document.querySelector(':root').style.setProperty('--sidebar-width-desktop', `${this.sidebarDesktopWidth}px`);

					if (checkIfDesktop()) {
						updateProjectionViewSize(
							window.innerWidth - this.sidebarDesktopWidth,
							this.orreryRendererEl.getBoundingClientRect().height
						);
					} else {
						updateProjectionViewSize(
							this.orreryRendererEl.getBoundingClientRect().width,
							// TODO: am unsure why this magic number needs to exist
							window.innerHeight - this.sidebarMobileHeight - 88
						);
					}

					// scene.add(orrery.bodies._starField);
					// scene.add(orrery.bodies._asteroidBelt);

					// sets z-indexing of planets to be correct
					// checking for overlapping labels (and eventually labels behind planets...)
					// the former needs to be done in the DOM
					// the latter... I'm not completely sure yet
					setInterval(() => {
						labelRenderer.zOrder(scene);
					}, 200);

					// Will cause the Godrays to appear in front of planets...
					const smaaGenerator = new SMAAImageGenerator();
					smaaGenerator.generate().then((images) => {
						// SMAAGenerator returns [searchImage, areaImage];
						const smaaEffect = new SMAAEffect(images[0], images[1], SMAAPreset.MEDIUM, EdgeDetectionMode.COLOR);
						const effects = [smaaEffect, orrery.classes._sun.godRaysEffect];
						const effectPass = new EffectPass(orrery.camera, ...effects);
						composer.addPass(effectPass);
					});

					// RENDER PASSES HERE
					composer.addPass(new RenderPass(orrery.scene, orrery.camera));
					composer.multisampling = 8;
					// ---

					const render = () => {
						delta = 5 * clock.getDelta();
						// if (state.bodies._asteroidBelt) state.bodies._asteroidBelt.rotation.y -= 0.000425 * delta;

						orrery.cameraState._isInPlaneOfReference =
							orrery.camera.position.y < 35000000 && -35000000 < orrery.camera.position.y;

						if (orrery.mouseState._clickedClass) {
							const clickedGroup = orrery.mouseState._clickedClass.labelGroup;
							clickedGroup.getWorldPosition(vectorPosition);
						}

						// if (orrery.mouseState._zoomedClass && orrery.cameraState._zoomToTarget) {
						if (orrery.mouseState._zoomedClass) {
							orrery.controls.target.x += easeTo({ from: orrery.controls.target.x, to: vectorPosition.x });
							orrery.controls.target.y += easeTo({ from: orrery.controls.target.y, to: vectorPosition.y });
							orrery.controls.target.z += easeTo({ from: orrery.controls.target.z, to: vectorPosition.z });
							const zoomTo = orrery.mouseState._zoomedClass.data.zoomTo;
							const distanceToTarget = orrery.controls.getDistance();

							if (orrery.cameraState._zoomToTarget) {
								if (distanceToTarget > zoomTo) {
									const amountComplete = zoomTo / distanceToTarget; // decimal percent completion of camera dolly based on the zoomTo of targetObj
									const amountToIncrease =
										(settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
									orrery.cameraState._dollySpeed = Math.min(
										settings.controls._dollySpeedMax + amountToIncrease,
										settings.controls._dollySpeedMin
									);
									orrery.controls.dollyIn(orrery.cameraState._dollySpeed);
								} else if (distanceToTarget + 0.1 < zoomTo) {
									const amountComplete = distanceToTarget / zoomTo; // decimal percent completion of camera dolly based on the zoomTo of targetObj
									const amountToIncrease =
										(settings.controls._dollySpeedMin - settings.controls._dollySpeedMax) * amountComplete;
									orrery.cameraState._dollySpeed = Math.min(
										settings.controls._dollySpeedMax + amountToIncrease,
										settings.controls._dollySpeedMin
									);
									orrery.controls.dollyOut(orrery.cameraState._dollySpeed);
								}
							}
						}

						orrery.dateTimeDifference = this.dateTimeDifference;
						// making sure to account for -ve numbers, so can reverse orbits based on time if needed
						this.timeShiftTypes[this.currentTimeShiftType] += this.timeShiftTypeCurrentIndex < 0 ? -1 : 1;

						// TODO: recheck this
						if (this.timeShiftTypeCurrentIndex !== 0) {
							for (let i = 0; i < orrery.classes._allIterableLength; i++) {
								orrery.classes._allIterable[i].iteratePosition();
							}
						}

						orrery.controls.update();

						composer.render();
						labelRenderer.render(scene, orrery.camera);
					};

					window.pauseRender = () => document.dispatchEvent(evRenderPause);
					window.startRender = () => document.dispatchEvent(evRenderStart);

					document.addEventListener('renderPause', () => {
						window.cancelAnimationFrame(window.renderLoop);
						console.log('render paused');
					});

					document.addEventListener('renderStart', () => {
						window.animate();
						console.log('render started');
					});

					document.addEventListener('pointerup', () => {
						document.removeEventListener('pointermove', this.resizeSidebarMobile, false);
						document.removeEventListener('pointermove', this.resizeSidebarDesktop, false);
					});

					// using window so RAF can be accessed through solution without importing
					// TODO: can probably be tidied up in future
					window.animate = () => {
						render();
						window.renderLoop = requestAnimationFrame(window.animate);
					};

					document.dispatchEvent(evRenderStart);
				}
			});
		});
	});

// console.log("Scene polycount:", renderer.info.render.triangles)
// console.log("Active Drawcalls:", renderer.info.render.calls)
// console.log("Textures in Memory", renderer.info.memory.textures)
// console.log("Geometries in Memory", renderer.info.memory.geometries)
