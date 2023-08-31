'use strict';
import { Vector3 } from 'three';
import { settings } from '../settings';
import { calculateOrbit } from '../utilities/astronomy';
import { convertToCamelCase } from '../utilities/strings';

import { BodyType, orrery } from '../orrery';
import { MaterialDataType, materialData } from './solarSystem';
import {
	addToMoonGroup,
	generalUpdates,
	isInnerPlanet,
	setOrbitCalculations,
	setRings,
	setWikipediaKeys,
	setSidebarImage,
	idReplacements
} from './sorting';

// interface MoonType extends SolarSystemDataType {
// 	moon: string;
// }

export interface SolarSystemDataType {
	id: string;
	name: string;
	displayName: string;
	englishName: string;
	englishId: string;
	isPlanet: boolean;
	moons: SolarSystemDataType[] | null;

	semimajorAxis: number;
	perihelion: number;
	aphelion: number;
	eccentricity: number;
	inclination: number;
	mass: {
		massValue: number;
		massExponent: number;
	};
	vol: {
		volValue: number;
		volExponent: number;
	};
	density: number;
	gravity: number;
	escape: number;
	meanRadius: number;
	polarRadius: number;
	flattening: number;
	dimension: string;
	sideralOrbit: number;
	sideralRotation: number;
	aroundPlanet: {
		planet: string;
		rel?: string;
	} | null;
	discoveredBy: string;
	discoveryDate: string;
	alternativeName: string;
	axialTilt: number;
	avgTemp: number;
	mainAnomaly: number;
	argPeriapsis: number;
	longAscNode: number;
	bodyType: 'Asteroid' | 'Comet' | 'Dwarf Planet' | 'Moon' | 'Planet' | 'Star';
	// custom
	rel?: string;
	isInnerPlanet: boolean;
	meanAnomaly: number;
	longOfPeriapsis: number;
	meanLongitude: number;
	perihelionDistance: number;
	aphelionDistance: number;
	orbitalPeriod: number;
	epochOfM: number;
	obliquityOfEcliptic: number;
	diameter: number;
	rings: {
		inner: number;
		outer: number;
	}[];
	media: {
		hasLoaded: boolean;
		noResults: boolean;
		hasError: boolean;
		errors: any[];
		items: any;
		total: number | null;
		more: boolean;
		loadingMore: boolean;
		per_page: number | null;
		lightboxData: any[];
	};
	description: {
		hasLoaded: boolean;
		noResults: boolean;
		hasError: boolean;
		errors: any[];
		title: string;
		content: string;
		image: string;
	};
	materialData: MaterialDataType;
	zoomTo: number;
	labelColour: string;
	systemId: string;
	systemName: string;
	sideralOrbitDirection: 'Prograde' | 'Retrograde';
	moonGroupName: string;
	moonGroupColor: string;
	moonGroupShowName: boolean;
	moonGroupIndex: number;
	moonGroupDefaultEnabled: boolean;
	moonGroupId: string;
	wikipediaKey: string;
	sidebarImage?: string;
	startingPosition: Vector3;
	moon: string;
}

export interface SolarSystemDataTypes {
	bodies: SolarSystemDataType[];
}

const sortData = (data: SolarSystemDataTypes) => {
	const { bodies } = data;
	const startingOrbitPosition = (objectData: any) => {
		const parentPlanetData = objectData.aroundPlanet
			? bodies.find((allData) => allData.id === objectData.aroundPlanet.planet)
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

	const englishifiedData = {
		bodies: idReplacements(data)
	};

	const orreryTypes = orrery.bodies.types;

	for (const item of englishifiedData.bodies) {
		item.media = {
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
		item.zoomTo = Math.min(item.meanRadius * 8, item.meanRadius + 7000000);

		const planetColours: { [key: string]: string } = settings.planetColours;
		item.labelColour = planetColours[item.id] || planetColours[item.bodyType] || planetColours.default;

		// setting the 'entity types' here rather than further down and redoing the loop

		const typeKey = ('_' + convertToCamelCase(item.bodyType)) as BodyType;
		let orreryType: SolarSystemDataType[] = orreryTypes[typeKey];
		orreryType = orreryTypes[typeKey] || [];
		orreryType.push(item);

		generalUpdates(item, englishifiedData);
		addToMoonGroup(item);
		isInnerPlanet(item);
		setRings(item);
		setOrbitCalculations(item);
		setWikipediaKeys(item);
		setSidebarImage(item);
	}

	let orreryAllType: SolarSystemDataType[] = orreryTypes['_all'];
	orreryAllType = [...englishifiedData.bodies];
	const sun = orreryTypes._star[0];

	const moons = orreryTypes._moon as SolarSystemDataType[];
	for (const moon of moons) {
		moon.materialData = materialData[moon.id] || null;
		moon.startingPosition = new Vector3();
		moon.startingPosition.copy(startingOrbitPosition(moon));
	}

	// assigning proper moon data to each entity, rather than just the ID that the API provides
	const setMoonsToDataEntity = (entity: SolarSystemDataType) => {
		if (entity?.moons?.length) {
			const eMoons = entity.moons
				.map((eMoon: SolarSystemDataType) => moons.find((m: SolarSystemDataType) => m.id === eMoon.moon)!)
				// sorting by moonGroupIndex, then by distance from planet
				.sort((a, b) => {
					if (!a || !b) return 0;
					if (a.moonGroupIndex > b.moonGroupIndex) return 1;
					if (a.moonGroupIndex < b.moonGroupIndex) return -1;
					if (a.semimajorAxis > b.semimajorAxis) return 1;
					if (a.semimajorAxis < b.semimajorAxis) return -1;
					return 0;
				});
			if (eMoons) entity.moons = eMoons;
		}
	};

	const dwarfPlanets = orrery.bodies.types._dwarfPlanet as SolarSystemDataType[];
	for (const dwarfPlanet of dwarfPlanets) {
		dwarfPlanet.startingPosition = new Vector3();
		dwarfPlanet.startingPosition.copy(startingOrbitPosition(dwarfPlanet));

		setMoonsToDataEntity(dwarfPlanet);
	}

	// const asteroids = orrery.bodies.types._asteroid;
	// for (const asteroid of asteroids) {
	// 	asteroid.labelColour = settings.planetColours.default;
	// 	asteroid.bodyType = 'Asteroid';
	// 	asteroid.startingPosition = new Vector3();
	// 	asteroid.startingPosition.copy(startingOrbitPosition(asteroid));

	// 	setMoonsToDataEntity(asteroid);
	// }

	const planets = orrery.bodies.types._planet as SolarSystemDataType[];
	for (const planet of planets) {
		planet.startingPosition = new Vector3();
		planet.startingPosition.copy(startingOrbitPosition(planet));
		planet.bodyType = 'Planet';

		setMoonsToDataEntity(planet);
	}

	// Building 'Entity Nav' ids with:
	// Planets > Planet Moons > Dwarf Planets > Dwarf Planet Moons > Asteroids
	for (const navSystemName of settings.navigationSystems) {
		const entityItem = orreryAllType.find((allItem: SolarSystemDataType) => allItem.id === navSystemName)!;
		const { navigationEntities }: { navigationEntities: string[] } = settings;
		navigationEntities.push(entityItem.id);
		if (entityItem.moons && entityItem.moons.length) {
			for (const moon of entityItem.moons) navigationEntities.push(moon.id);
		}
	}
	// TODO: asteroids n stuff

	return {
		sun,
		moons,
		dwarfPlanets,
		planets
		// asteroids
	};
};

type ErrorType = {
	code: string;
	message: string;
};

type APIResponseType = {
	ok?: boolean;
	statusText?: string;
	result?: any;
	errors?: ErrorType[];
};

class APIRequest {
	AbortController: AbortController;
	requestTimeout: number;

	constructor() {
		this.AbortController = new AbortController();
		this.requestTimeout = 15000;
	}

	apiResponse(response: APIResponseType) {
		const { errors = [], result = {} } = response;
		return { errors, result };
	}

	async GET(url: string) {
		const timeoutId = setTimeout(() => {
			this.AbortController.abort();
		}, this.requestTimeout);

		try {
			const response = await fetch(url, { signal: this.AbortController.signal });

			if (!response.ok) throw Error(response.statusText);
			const json = (await response.json()) as SolarSystemDataTypes;
			clearTimeout(timeoutId);

			const successResponse = {
				result: json
			} as APIResponseType;
			return this.apiResponse(successResponse);
		} catch (err) {
			console.error(err);
			const errResponse = {
				errors: [{ code: 'timeout', message: 'The response timed out.' }]
			} as APIResponseType;
			return this.apiResponse(errResponse);
		}
	}
}

export { sortData, APIRequest };
