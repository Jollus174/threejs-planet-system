'use strict';
import { state } from '../state';
import { settings } from '../settings';
import { solarSystemData } from '../data/solarSystemData';
import { getRandomArbitrary, calculateOrbit } from '../utils';

const dwarfPlanetList = ['Ceres', 'Eris', 'Makemake', 'Haumea', 'Pluto', 'Orcus'];
const innerPlanets = ['Mercury', 'Venus', 'Earth', 'Mars'];

const startingOrbitPosition = (data) => {
	// console.log(orbitRotationRandomiser);
	const { x, y, z } = calculateOrbit(
		getRandomArbitrary(0, 360), // random position along orbit
		data.perihelion,
		data.aphelion,
		data.inclination,
		data.eccentricity,
		data.orbitRotationRandomiser
	);
	return { x, y, z };
};

const sortAllData = () => {
	const data = solarSystemData;

	// Sorting out all the bodies in the API into separate lists for easier referral
	// The API lists Pluto as a planet, silly API. That's being updated below
	state.bodies._bodiesAll = data;
	state.bodies._sun = data.find((item) => item.englishName === 'Sun');
	state.bodies._sun.labelColour = settings.planetColours.sun;

	// get the initial moons so we can reference them when populating the planets and dwarf planets
	state.bodies._moons = data.filter(
		(item) =>
			item.aroundPlanet !== undefined && item.aroundPlanet !== null && item.perihelion !== 0 && item.aphelion !== 0
		// !item.englishName.includes('S/')
	);
	state.bodies._moons.forEach((moon) => {
		// all the moons will be default grey for now
		moon.labelColour = settings.planetColours.default;
		moon.orbitRotationRandomiser = getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(moon);
		moon.startingPosition = { x, y, z };
	});

	// sorting out dwarf planets
	dwarfPlanetList.forEach((dPlanet) => {
		const dwarfPlanet = data.find((item) => item.englishName.includes(dPlanet));
		dwarfPlanet.isPlanet = false;
		const { x, y, z } = startingOrbitPosition(dwarfPlanet);
		dwarfPlanet.orbitRotationRandomiser = getRandomArbitrary(-1, 1);
		dwarfPlanet.startingPosition = { x, y, z };
		// will only do pluto for now
		if (dwarfPlanet.englishName !== 'Pluto') return;
		state.bodies._dwarfPlanets.push(dwarfPlanet);
		if (dwarfPlanet.moons && dwarfPlanet.moons.length) {
			const moonNames = dwarfPlanet.moons.map((moonData) => moonData.moon);
			dwarfPlanet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = state.bodies._moons.find((moon) => moonName === moon.name);
				if (moonData) dwarfPlanet.moons.push(moonData);
			});
		}
	});

	state.bodies._planets = data.filter((item) => item.isPlanet);
	state.bodies._planets.forEach((planet) => {
		// firstly get the moon names then clear the pre-existing moon array from the API of garbage
		planet.labelColour = settings.planetColours[planet.englishName.toLowerCase()] || settings.planetColours.default;
		planet.isInnerPlanet = innerPlanets.indexOf(planet.englishName) !== -1;
		planet.orbitRotationRandomiser = getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(planet);
		planet.startingPosition = { x, y, z };
		if (planet.moons && planet.moons.length) {
			const moonNames = planet.moons.map((moonData) => moonData.moon); // is called 'moon' not 'name' in the data! Whoa
			planet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = state.bodies._moons.find((moon) => moonName === moon.name);
				if (moonData) planet.moons.push(moonData);
			});
		}
	});

	// manually pushing Vanth to Orcus since the API gets it wrong
	const orcus = state.bodies._dwarfPlanets.find((dPlanet) => dPlanet.englishName.includes('Orcus'));
	if (orcus) {
		orcus.moons = [];
		orcus.aphelion = 7191169645;
		orcus.perihelion = 4529823525;
		orcus.eccentricity = 0.22701;
		orcus.semimajorAxis = 5859748595;
		orcus.inclination = 20.592;
		orcus.moons.push(state.bodies._moons.find((moon) => moon.englishName === 'Vanth'));
	}

	// if not the sun or a planet or a moon, then is a satellite
	state.bodies._satellites = data.filter(
		(item) =>
			item.englishName !== 'Sun' &&
			item.isPlanet === false &&
			item.aroundPlanet === null &&
			!state.bodies._dwarfPlanets.find((dPlanet) => dPlanet.name.includes(item.name))
	);
};

const getWikipediaData = async (articleTitle) => {
	// example URL: https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Jupiter
	const baseUrl = 'https://en.wikipedia.org/w/api.php';
	const queryParams = [
		['format', 'json'],
		['action', 'query'],
		['prop', 'extracts'],
		['exintro', '1'],
		['explaintext', '1'],
		['redirects', '1'],
		['titles', articleTitle],
		['origin', '*']
	];

	const url = `${baseUrl}?${queryParams.map((q) => [q[0], q[1]].join('=')).join('&')}`;
	return await fetch(url)
		.then((response) => {
			if (!response.ok) throw new Error('Error retrieving Wikipedia data');
			return response.json();
		})
		.then((rJSON) => {
			if (rJSON.query && rJSON.query.pages) {
				const content = Object.values(rJSON.query.pages)[0];
				if (content.extract) {
					return content.extract.replace(' ()', '').replace(' ,', ',').replace('  ', ' ');
				} else {
					console.error('Missing Wikipedia page keys');
				}
			}
		});
};

const setWikipediaData = (objectName, targetGroup) => {
	getWikipediaData(objectName)
		.then((response) => {
			if (targetGroup) targetGroup.data.content = response;
			return response;
		})
		.catch((err) => {
			console.error(err);
		});
};

export { sortAllData, setWikipediaData };
