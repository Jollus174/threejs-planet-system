'use strict';
import { Vector3 } from 'three';
import { settings } from '../settings';
import { calculateOrbit } from '../utilities/astronomy';
import { convertToCamelCase } from '../utilities/strings';

import { orrery } from '../orrery';
import { materialData } from './solarSystem';
import {
	addToMoonGroup,
	generalUpdates,
	isInnerPlanet,
	setOrbitCalculations,
	setRings,
	setWikipediaKeys,
	idReplacements
} from './sorting';

const sortData = (data) => {
	const startingOrbitPosition = (objectData) => {
		const parentPlanetData = objectData.aroundPlanet
			? data.find((allData) => allData.id === objectData.aroundPlanet.planet)
			: null;
		const v = new Vector3();
		return v.copy(
			calculateOrbit(
				objectData.meanAnomaly, // TODO: this will be incorrect, but will do for now. Is not date-specific
				objectData,
				parentPlanetData
			)
		);
	};

	const englishifiedData = idReplacements(data);

	for (const item of englishifiedData) {
		item.media = {
			apiRequester: null,
			hasLoaded: false,
			noResults: false,
			hasError: false,
			errors: [],
			items: [],
			total: null,
			more: false,
			loadingMore: false,
			per_page: null,
			lightboxData: []
		};

		item.description = {
			apiRequester: null,
			hasLoaded: false,
			noResults: false,
			hasError: false,
			errors: [],
			title: '',
			content: '',
			image: ''
		};

		item.materialData = materialData[item.id] || null;

		// Math.min to account for huge bodies like Sun
		item.zoomTo = Math.min(item.meanRadius * 16, item.meanRadius + 7000000);

		item.labelColour =
			settings.planetColours[item.id] || settings.planetColours[item.bodyType] || settings.planetColours.default;

		// setting the 'entity types' here rather than further down and redoing the loop
		const key = '_' + convertToCamelCase(item.bodyType);
		orrery.bodies.types[key] = orrery.bodies.types[key] || [];
		orrery.bodies.types[key].push(item);

		generalUpdates(item, englishifiedData);
		addToMoonGroup(item);
		isInnerPlanet(item);
		setRings(item);
		setOrbitCalculations(item);
		setWikipediaKeys(item);
	}

	orrery.bodies._all = [...englishifiedData];
	const sun = orrery.bodies.types._star[0];

	// TODO: sort this out later, assign a 'moonGroup index' to keep track of order better
	const moons = orrery.bodies.types._moon;
	for (const moon of moons) {
		moon.materialData = materialData[moon.id] || null;
		moon.startingPosition = new Vector3();
		moon.startingPosition.copy(startingOrbitPosition(moon));
	}

	// assigning proper moon data to each entity, rather than just the ID that the API provides
	const setMoonsToDataEntity = (entity) => {
		if (entity.moons && entity.moons.length) {
			const eMoons = entity.moons
				.map((eMoon) => moons.find((m) => m.id === eMoon.moon))
				.sort((a, b) => (a.moonGroup > b.moonGroup ? 1 : b.moonGroup > a.moonGroup ? -1 : 0));
			entity.moons = eMoons;
		}
	};

	const dwarfPlanets = orrery.bodies.types._dwarfPlanet;
	for (const dwarfPlanet of dwarfPlanets) {
		dwarfPlanet.startingPosition = new Vector3();
		dwarfPlanet.startingPosition.copy(startingOrbitPosition(dwarfPlanet));

		setMoonsToDataEntity(dwarfPlanet);
	}

	const asteroids = orrery.bodies.types._asteroid;
	for (const asteroid of asteroids) {
		asteroid.labelColour = settings.planetColours.default;
		asteroid.bodyType = 'Asteroid';
		asteroid.startingPosition = new Vector3();
		asteroid.startingPosition.copy(startingOrbitPosition(asteroid));

		setMoonsToDataEntity(asteroid);
	}

	const planets = orrery.bodies.types._planet;
	for (const planet of planets) {
		planet.startingPosition = new Vector3();
		planet.startingPosition.copy(startingOrbitPosition(planet));
		planet.bodyType = 'Planet';

		setMoonsToDataEntity(planet);
	}

	// Building 'Entity Nav' ids with:
	// Planets > Planet Moons > Dwarf Planets > Dwarf Planet Moons > Asteroids
	for (const navSystemName of settings.navigationSystems) {
		const entityItem = orrery.bodies._all.find((allItem) => allItem.id === navSystemName);
		settings.navigationEntities.push(entityItem.id);
		if (entityItem.moons && entityItem.moons.length) {
			for (const moon of entityItem.moons) settings.navigationEntities.push(moon.id);
		}
	}
	// TODO: asteroids n stuff

	return {
		sun,
		moons,
		dwarfPlanets,
		planets,
		asteroids
	};
};

// TODO: when (if) Typescript is set up, would be good to type these
class APIRequest {
	constructor() {
		this.AbortController = new AbortController();
		this.requestTimeout = 15000;
	}

	apiResponse({ errors = [], result = [] } = {}) {
		return { errors, result };
	}

	handleErrors(response) {
		if (!response.ok) {
			throw Error(response.statusText);
		}
		return response;
	}

	async GET(url) {
		const timeoutId = setTimeout(() => {
			this.AbortController.abort();
		}, this.requestTimeout);
		return await fetch(url, { signal: this.AbortController.signal })
			.then(this.handleErrors)
			.then((response) => response.json())
			.then((rJSON) => {
				clearTimeout(timeoutId);
				return this.apiResponse({ result: rJSON });
			})
			.catch((e) => {
				console.error(e);
				return this.apiResponse({ errors: [{ code: 'timeout', message: 'The response timed out.' }] });
			});
	}
}

export { sortData, APIRequest };
