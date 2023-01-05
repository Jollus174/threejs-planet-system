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
import { asteroidBelt, skybox, starField } from './modules/factories/solarSystemFactory';
import { initMousePointerEvents } from './modules/events/mousePointer';
import { Planet, DwarfPlanet, Asteroid, Sun, Moon } from './modules/objectProps';
import { sortData, APIRequest } from './modules/data/api';

import {
	RenderPass,
	EffectPass,
	SMAAEffect,
	GodRaysEffect,
	SMAAPreset,
	EdgeDetectionMode,
	SMAAImageGenerator,
	SelectiveBloomEffect,
	BlendFunction,
	KernelSize
} from 'postprocessing';

import { customEventNames } from './modules/events/customEvents';
import { evRenderPause, evRenderStart } from './modules/events/events';

import Vue from 'vue/dist/vue.js';
import LightBox from './modules/custom/vue-it-bigger_custom/LightBox.vue';
import { format, add, differenceInHours } from 'date-fns';

window.settings = settings;
window.renderLoop = '';

window.renderer = renderer;
window.composer = composer;

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
	// renderer.setSize(width, height);
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
		const buildPromises = [];
		buildPromises.push(orrery.classes._sun.build());
		for (const planet of Object.values(orrery.classes._planets)) buildPromises.push(planet.build());
		for (const dwarfPlanet of Object.values(orrery.classes._dwarfPlanets)) buildPromises.push(dwarfPlanet.build());

		Promise.all(buildPromises).then(() => {
			orrery.classes._allIterable = Object.values(orrery.classes._all);
			orrery.classes._moonsIterable = orrery.classes._allIterable.filter((c) => c.data.bodyType === 'Moon');

			Vue.component('lightbox', LightBox);
			new Vue({
				el: orrery.vueTarget,
				data: {
					searchQuery: '',
					navigationSystems: settings.navigationSystems,
					navigationEntities: settings.navigationEntities,
					showSearchMobile: false,
					clickedClassData: orrery.classes._all._sun.data,
					zoomedClassData: null,
					sidebarMobileHeight: 400,
					sidebarDesktopWidth: 600,
					systemClassData: orrery.classes._all._sun.data,
					modelSystemSelection: {}, // for keeping track of what's selected between systems
					modelSidebarImages: {}, // for keeping track of which images have been loaded, so can apply a loading spinner if needed
					modelMoonGroups: {},
					tabGroup: 'tab-stats', // TODO: set this to Wikipedia by default
					vueRandomString: randomString(8),
					timeShiftTypes: { hours: 0, days: 0, months: 0 },
					timeShiftTypeCurrentIndex: 0,
					dateTimeCurrent: new Date(),
					timeShiftSystemOnly: false,
					orreryRendererEl: renderer.domElement,
					labelRendererEl: labelRenderer.domElement,
					sidebar: {
						imageLoading: true,
						imageError: true,
						imagesQueue: [], // gross, but is here to allow loading spinners to only appear when needed
						images: [],
						loadingTimeout: null
					}
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
						if (!this.clickedClassData || !this.clickedClassData.semimajorAxis) return null;
						// to be in km or AU depending on amount
						const parentEntity = this.clickedClassData.aroundPlanet
							? orrery.classes._all[this.clickedClassData.aroundPlanet.planet].data.displayName
							: 'Sun';

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
							.filter((item) => item.bodyType !== 'Asteroid' && item.bodyType !== 'Comet')
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
						if (i === 1) return 'hours';
						else if (i === 2) return 'days';
						else if (i === 3) return 'months';
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
						const days = format(this.dateTimeShifted, 'dd');
						const months = format(this.dateTimeShifted, 'MMM');
						const years = format(this.dateTimeShifted, 'yyyy');

						return `<time class="days">${days}</time> / <time class="months">${months}</time> / <time class="years">${years}</time>`;
					}
				},
				methods: {
					timeShiftForwards() {
						if (this.timeShiftTypeCurrentIndex < 3) {
							this.timeShiftTypeCurrentIndex++;
						}
					},
					timeShiftBackwards() {
						if (-3 < this.timeShiftTypeCurrentIndex) {
							this.timeShiftTypeCurrentIndex--;
						}
					},
					timeShiftReset() {
						for (const timeShiftType of Object.keys(this.timeShiftTypes)) this.timeShiftTypes[timeShiftType] = 0;
						for (const entity of orrery.classes._allIterable) entity.resetLabelGroupPosition();
					},
					timeShiftStop() {
						this.timeShiftTypeCurrentIndex = 0;
					},
					toggleTimeShiftSystemOnly() {
						this.timeShiftSystemOnly = !this.timeShiftSystemOnly;
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
									// switch on the selected moon group if it's the first visit by default, or else just switch it on if it's set to be on during the data parsing at start
									isEnabled:
										this.clickedClassData.bodyType === 'Moon'
											? moonGroupId === this.clickedClassData.moonGroupId
											: !moons[0].hasOwnProperty('moonGroupDefaultEnabled') ||
											  moons[0].moonGroupDefaultEnabled === true,
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
						// https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
						const baseUrl = 'https://images-api.nasa.gov';
						const queryParams = [
							['keywords', key],
							['page', pageNumber || '1'],
							['media_type', 'image']
						];

						return `${baseUrl}/search?${queryParams.map((q) => [q[0], q[1]].join('=')).join('&')}`;
					},

					getNASAMediaData(isLoadingMore) {
						// to stop making repeated requests to endpoints that return no results
						if (this.clickedClassData.media.noResults) return;

						if (isLoadingMore) this.clickedClassData.media.loadingMore = true;
						this.clickedClassData.media.errors.splice(0);

						const url = isLoadingMore
							? this.clickedClassData.media.loadMoreLink
							: this.generateNASAMediaUrl(this.clickedClassData.name);
						const apiRequest = this.clickedClassData.media.apiRequester || new APIRequest();
						apiRequest.GET(url).then((response) => {
							const media = this.clickedClassData.media;
							media.hasLoaded = true;
							if (response.errors.length) {
								media.hasError = true;
								for (const error of response.errors) media.errors.push(error);
								return;
							}

							if (
								!response.result ||
								!response.result.collection ||
								!response.result.collection.items ||
								!response.result.collection.items.length
							) {
								media.noResults = true;
								return;
							}

							this.clickedClassData.media.loadingMore = false;
							this.clickedClassData.media.loadMoreLink = response.result.collection.links
								? response.result.collection.links.find((link) => link.rel === 'next').href
								: '';

							for (const item of response.result.collection.items) {
								const { title, description, nasa_id, secondary_creator } = item.data[0]; // not sure why it's an array in the returned data
								const thumb = item.links[0].href;

								const mediaThumbnail = { title, thumb };
								media.items.push(mediaThumbnail);

								const formattedDetails = description
									// splitting desc by paragraphs so can work with it
									// removing paragraphs with links back to NASA's FAQs and such, looks weird
									.replaceAll('\n', '')
									.trim()
									.split('</p>')
									.filter((p) => !p.toLowerCase().includes('href'))
									.join('</p>');
								media.lightboxData.push({
									type: 'image',
									thumb,
									src: `https://images-assets.nasa.gov/image/${nasa_id}/${nasa_id}~orig.jpg`,
									caption: formattedDetails || title,
									copyright: secondary_creator
								});
							}
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
									displayName: result.displayName,
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
						this.updateZoomTarget(nextSystem.data);
					},

					goToPreviousEntity() {
						const keys = this.navigationEntities;
						const currentIndex = keys.indexOf(this.clickedClassData.id);
						const prevIndex = currentIndex !== 0 ? currentIndex - 1 : keys.length - 1;
						const prevEntity = orrery.classes._all[keys[prevIndex]];
						this.updateZoomTarget(prevEntity.data);
					},

					goToNextEntity() {
						const keys = this.navigationEntities;
						const currentIndex = keys.indexOf(this.clickedClassData.id);
						const nextIndex = currentIndex + 1 < keys.length ? currentIndex + 1 : 0;
						const nextEntity = orrery.classes._all[keys[nextIndex]];
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

						// checking to see if image has been loaded previously so can apply a loading spinner
						// also stopping redundant requests being made for images that were already loaded
						if (this.modelSidebarImages[this.clickedClassData.id] === undefined) {
							// making the loading spinner appear after 400ms so it doesn't appear instantly after every image switch
							// TODO: this bugs out and it sometimes gets stuck on perma-spinner
							// this.sidebar.loadingTimeout = setTimeout(() => {
							// 	this.sidebar.imageLoading = true;
							// }, 400);
							this.sidebar.imagesQueue.push(this.clickedClassData.sidebarImage);
						} else {
							// image was already loaded previously, and is in the cache
							if (this.modelSidebarImages[this.clickedClassData.id] === '') {
								// this image load had failed
								this.sidebar.imageError = true;
							} else {
								// this image load was successful
								this.sidebar.images.push(this.clickedClassData.sidebarImage);
								this.sidebar.imageError = false;
							}
						}

						// keeping track of what's been selected between each system
						this.modelSystemSelection[this.clickedClassData.id] = this.clickedClassData.id;

						this.switchDetailTabs(); // to trigger the API loader for content (if it's needed)
					},

					resetSearch() {
						this.searchQuery = '';
						for (const searchInput of [...document.querySelectorAll('[data-selector="search"] input')])
							searchInput.value = '';
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

					// using V-model is a no-go on Android due to compositions
					// https://github.com/vuejs/vue/issues/9777
					updateSearchQuery(e) {
						if (e.key === 'Enter') {
							if (!this.searchQuery) return;
							this.updateZoomTarget(this.searchResults[0].data);
							e.target.value = '';
						} else {
							this.searchQuery = e.target.value;
						}
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
					},

					imageLoad() {
						clearTimeout(this.sidebar.loadingTimeout);
						this.sidebar.imageLoading = false;
						this.sidebar.imageError = false;
						this.sidebar.images.push(this.sidebar.imagesQueue[this.sidebar.imagesQueue.length - 1]);
						const { id } = this.clickedClassData;
						if (this.modelSidebarImages[id] === undefined) {
							this.modelSidebarImages[id] = this.sidebar.imagesQueue[this.sidebar.imagesQueue.length - 1];
						}
					},
					imageError() {
						clearTimeout(this.sidebar.loadingTimeout);
						const { id } = this.clickedClassData;
						this.sidebar.imageLoading = false;
						this.sidebar.imageError = true;
						if (this.modelSidebarImages[id] === undefined) {
							this.modelSidebarImages[id] = '';
						}
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
						if (!e.target.closest('[data-selector="search"]')) {
							this.resetSearch();
						}
					});

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
							lightObjsArr.forEach((lightObj) => orrery.scene.add(lightObj));
						});
					});

					orrery.scene.add(skybox());

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

					// orrery.scene.add(orrery.bodies._starField);
					// orrery.scene.add(orrery.bodies._asteroidBelt);

					// sets z-indexing of planets to be correct
					// checking for overlapping labels (and eventually labels behind planets...)
					// the former needs to be done in the DOM
					// the latter... I'm not completely sure yet
					setInterval(() => {
						labelRenderer.zOrder(orrery.scene);
					}, 200);

					const geometry = new THREE.SphereGeometry(0.01, 32, 32);
					const material = new THREE.MeshBasicMaterial({ color: 'orange' });
					const sphere = new THREE.Mesh(geometry, material);
					orrery.scene.add(sphere);

					// RENDER PASSES HERE
					composer.addPass(new RenderPass(orrery.scene, orrery.camera));
					// TODO: reinvestigate this. Upgrading ThreeJS caused this line to generate errors
					// composer.multisampling = 8;

					const godRaysEffect = new GodRaysEffect(orrery.camera, sphere, {
						blurriness: 2,
						density: 0.86,
						decay: 0.92,
						weight: 0.3,
						exposure: 0.54,
						samples: 60,
						clampMax: 1.0
					});

					// Will cause the Godrays to appear in front of planets...
					const smaaGenerator = new SMAAImageGenerator();
					smaaGenerator.generate().then((images) => {
						// SMAAGenerator returns [searchImage, areaImage];
						const smaaEffect = new SMAAEffect(images[0], images[1], SMAAPreset.MEDIUM, EdgeDetectionMode.COLOR);
						const selectiveBloomEffect = new SelectiveBloomEffect(orrery.scene, orrery.camera, {
							kernelSize: KernelSize.SMALL,
							blurScale: 0.15,
							luminanceThreshold: 0,
							luminanceSmoothing: 0.6,
							// height: 480
							// intensity: 2,
							intensity: 5,
							blendFunction: BlendFunction.ADD
						});
						window.selectiveBloomEffect = selectiveBloomEffect;

						// const effects = [smaaEffect, orrery.classes._sun.godRaysEffect, selectiveBloomEffect];
						const effects = [godRaysEffect, smaaEffect, orrery.classes._sun.godRaysEffect];
						const effectPass = new EffectPass(orrery.camera, ...effects);
						// effectPass.renderToScreen = true;
						composer.addPass(effectPass);
					});

					// setTimeout(() => {
					// 	const orbitLines = window.scene.children.filter((c) => c.name.includes('orbit line'));
					// 	orbitLines.forEach((l) => window.selectiveBloomEffect.selection.add(l));
					// 	// window.selectiveBloomEffect.update();
					// 	console.log(window.selectiveBloomEffect.getSelection());
					// 	// window.selectiveBloomEffect.setEnabled = true;
					// 	console.log('lines added!');
					// }, 2000);

					// ---

					const scaleVector = new THREE.Vector3();
					let scaleFactor = 4;

					const render = () => {
						var scale = scaleVector.subVectors(sphere.position, orrery.camera.position).length() / scaleFactor;
						sphere.scale.set(scale, scale, scale);

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

							if (orrery.cameraState._zoomToTarget && !orrery.camera.target) {
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
								} else {
									orrery.controls.target = orrery.mouseState._zoomedClass.labelGroup.getWorldPosition(vectorPosition);
								}
							}
						}

						orrery.dateTimeDifference = this.dateTimeDifference;
						// making sure to account for -ve numbers, so can reverse orbits based on time if needed
						this.timeShiftTypes[this.currentTimeShiftType] += this.timeShiftTypeCurrentIndex < 0 ? -1 : 1;

						if (this.timeShiftTypeCurrentIndex !== 0) {
							if (this.timeShiftSystemOnly) {
								for (const moon of orrery.classes._moonsIterable) {
									moon.iteratePosition();
								}
							} else {
								for (const entity of orrery.classes._allIterable) {
									entity.iteratePosition();
								}
							}
						}

						orrery.controls.update();

						composer.render();
						labelRenderer.render(orrery.scene, orrery.camera);

						for (const entity of orrery.classes._allIterable) {
							entity.draw();
						}
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
