'use strict';
import { settings } from '../settings';
import { solarSystemData } from '../data/solarSystemData';
import { getRandomArbitrary, calculateOrbit } from '../utils';
import { vueOrrery } from '../app-orrery';

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
	window.data = data;

	vueOrrery.bodies._sun = data.find((item) => item.englishName === 'Sun');
	vueOrrery.bodies._sun.labelColour = settings.planetColours.sun;

	// get the initial moons so we can reference them when populating the planets and dwarf planets
	vueOrrery.bodies._moons = data.filter(
		(item) =>
			item.aroundPlanet !== undefined && item.aroundPlanet !== null && item.perihelion !== 0 && item.aphelion !== 0
	);

	// TODO: should use Vue.set for these...
	vueOrrery.bodies._moons.forEach((moon) => {
		// all the moons will be default grey for now
		moon.labelColour = settings.planetColours.default;
		moon.orbitRotationRandomiser = getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(moon);
		moon.startingPosition = { x, y, z };
	});

	// sorting out dwarf planets
	// TODO: should use Vue.set for these...
	// This should be moved to the Vue app
	dwarfPlanetList.forEach((dPlanet) => {
		const dwarfPlanet = data.find((item) => item.englishName.includes(dPlanet));
		dwarfPlanet.isPlanet = false;
		const { x, y, z } = startingOrbitPosition(dwarfPlanet);
		dwarfPlanet.orbitRotationRandomiser = getRandomArbitrary(-1, 1);
		dwarfPlanet.startingPosition = { x, y, z };
		// will only do pluto for now
		if (dwarfPlanet.englishName !== 'Pluto') return;
		vueOrrery.bodies._dwarfPlanets.push(dwarfPlanet);
		if (dwarfPlanet.moons && dwarfPlanet.moons.length) {
			const moonNames = dwarfPlanet.moons.map((moonData) => moonData.moon);
			dwarfPlanet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = vueOrrery.bodies._moons.find((moon) => moonName === moon.name);
				if (moonData) dwarfPlanet.moons.push(moonData);
			});
		}
	});

	vueOrrery.bodies._planets = data.filter((item) => item.isPlanet);
	vueOrrery.bodies._planets.forEach((planet) => {
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
				const moonData = vueOrrery.bodies._moons.find((moon) => moonName === moon.name);
				if (moonData) planet.moons.push(moonData);
			});
		}
	});

	// if not the sun or a planet or a moon, then is a satellite
	vueOrrery.bodies._satellites = data.filter(
		(item) =>
			item.englishName !== 'Sun' &&
			item.isPlanet === false &&
			item.aroundPlanet === null &&
			!vueOrrery.bodies._dwarfPlanets.find((dPlanet) => dPlanet.name.includes(item.name))
	);
};

const getWikipediaData = async (articleTitle) => {
	// example URL: https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Jupiter
	const baseUrl = 'https://en.wikipedia.org/w/api.php';
	const queryParams = [
		['format', 'json'],
		['action', 'query'],
		['prop', 'extracts|pageimages'],
		['exintro', '1'],
		// ['explaintext', '1'], // we want the HTML, so just text content. Saves me needed to do extra formatting.
		['redirects', '1'],
		['titles', articleTitle],
		['origin', '*'],
		['pithumbsize', 100]
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
				let formattedContent;
				let image = null;
				if (content.extract) {
					formattedContent = content.extract;
					formattedContent = formattedContent.replace('<span></span>', '');
					formattedContent = formattedContent.replace(' ()', '').replace(' ,', ',');
				}

				if (content.thumbnail) {
					image = content.thumbnail;
					image.alt = content.pageimage;
				}

				// TODO: if not enough content, can we grab more?

				return {
					title: content.title,
					content: formattedContent,
					image
				};
			} else {
				console.error('Missing Wikipedia page keys');
			}
		});
};

const setWikipediaData = (objectName, targetGroup) => {
	getWikipediaData(objectName)
		.then((response) => {
			if (targetGroup) {
				// TODO: use Vue.set
				targetGroup.data.title = response.title;
				targetGroup.data.content = response.content;
				targetGroup.data.image = response.image;
			}
			return response;
		})
		.catch((err) => {
			console.error(err);
		});
};

export { sortAllData, setWikipediaData };
