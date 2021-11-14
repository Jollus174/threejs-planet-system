'use strict';
import { state } from '../state';
import { settings } from '../settings';

const baseUrl = 'https://api.le-systeme-solaire.net/rest.php/bodies'; // get everything, better off this way since will return the sun, all planets, non-planets, and satellites. Difficult to differentiate them via different API calls
const dataStorage = window.localStorage;
const dwarfPlanetList = ['Ceres', 'Eris', 'Makemake', 'Haumea', 'Pluto', 'Orcus'];

const getAllData = async () => {
	const headers = new Headers({
		'Content-Type': 'application/json'
	});

	// TODO: include way to clear localStorage
	if (!dataStorage.getItem('bodiesAll')) {
		const response = await fetch(baseUrl, headers);
		if (!response.ok) {
			throw new Error(`Error retrieving API data. ${response.status}`);
		}

		const data = await response.json();
		dataStorage.setItem('bodiesAll', JSON.stringify([...data.bodies]));
		return data.bodies;
	} else {
		return await JSON.parse(dataStorage.getItem('bodiesAll'));
	}
};

const sortAllData = async () => {
	await getAllData().then((data) => {
		// Sorting out all the bodies in the API into separate lists for easier referral
		// The API lists Pluto as a planet, silly API. That's being updated below
		state.bodies._bodiesAll = data;
		state.bodies._sun = data.find((item) => item.englishName === 'Sun');

		// get the initial moons so we can reference them when populating the planets and dwarf planets
		state.bodies._moons = data.filter((item) => item.aroundPlanet !== undefined && item.aroundPlanet !== null);
		state.bodies._moons.forEach((moon) => {
			// all the moons will be default grey for now
			moon.labelColour = settings.planetColours.default;
		});

		// sorting out dwarf planets
		dwarfPlanetList.forEach((dPlanet) => {
			const dwarfPlanet = data.find((item) => item.englishName.includes(dPlanet));
			dwarfPlanet.isPlanet = false;
			// will only do pluto for now
			if (dwarfPlanet.englishName !== 'Pluto') return;
			state.bodies._dwarfPlanets.push(dwarfPlanet);
			if (dwarfPlanet.moons && dwarfPlanet.moons.length) {
				const moonNames = dwarfPlanet.moons.map((moonData) => moonData.moon);
				dwarfPlanet.moons = [];
				moonNames.forEach((moonName) => {
					dwarfPlanet.moons.push(state.bodies._moons.find((moon) => moonName === moon.name));
				});
			}
		});

		state.bodies._planets = data.filter((item) => item.isPlanet);
		state.bodies._planets.forEach((planet) => {
			// firstly get the moon names then clear the pre-existing moon array from the API of garbage
			planet.labelColour = settings.planetColours[planet.englishName.toLowerCase()] || settings.planetColours.default;
			if (planet.moons && planet.moons.length) {
				const moonNames = planet.moons.map((moonData) => moonData.moon); // is called 'moon' not 'name' in the data! Whoa
				planet.moons = [];
				moonNames.forEach((moonName) => {
					planet.moons.push(state.bodies._moons.find((moon) => moonName === moon.name));
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
	});
};

export { sortAllData };
