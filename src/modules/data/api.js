'use strict';
import { settings } from '../settings';
import { getRandomArbitrary, calculateOrbit } from '../utils';
import { degToRad } from 'three/src/math/mathutils';

const innerPlanets = ['Mercury', 'Venus', 'Earth', 'Mars'];
const majorMoons = [
	// Earth
	'Moon',

	// Jupiter
	'Io',
	'Europa',
	'Ganymede',
	'Callisto',

	// Saturn
	'Titan',
	'Dione',
	'Enceladus',
	'Hyperion',
	'Iapetus',
	'Mimas',
	'Rhea',
	'Tethys',

	// Uranus
	'Miranda',
	'Ariel',
	'Umbriel',
	'Titania',
	'Oberon'
];
const innerMoons = [
	// Earth
	'Moon',

	// Mars
	'Phobos',
	'Deimos',

	// Jupiter
	'Metis',
	'Adrastea',
	'Amalthea',
	'Thebe',

	// Saturn
	'Aegaeon',
	'Anthe',
	'Atlas',
	'Daphnis',
	'Epimetheus',
	'Helene',
	'Janus',
	'Methone',
	'Mimas',
	'Pan',
	'Pandora',
	'Polydeuces',
	'Prometheus',
	'S/2009 S 1',
	'Telesto',

	// Uranus
	'Belinda',
	'Bianca',
	'Cordelia',
	'Cressida',
	'Cupid',
	'Desdemona',
	'Juliet',
	'Mab',
	'Ophelia',
	'Perdita',
	'Portia',
	'Puck',
	'Rosalind',

	// Neptune
	'Despina',
	'Galatea',
	'Hippocamp',
	'Larissa',
	'Naiad',
	'Proteus',
	'Thalassa',

	// Pluto
	'Charon',
	'Hydra',
	'Kerberos',
	'Nix',
	'Styx',

	// Eris
	'Dysnomia',

	// Makemake
	'S/2015 (136472) 1',

	// Haumea
	'Hiʻiaka',
	'Namaka',

	// Orcus
	'Vanth'
];

const startingOrbitPosition = (data) => {
	// console.log(orbitRotationRandomiser);
	const { x, y, z } = calculateOrbit(
		// getRandomArbitrary(0, 360), // random position along orbit
		getRandomArbitrary(0, 0), // random position along orbit
		data.perihelion,
		data.aphelion,
		data.inclination,
		data.eccentricity,
		data.orbitRotationRandomiser
	);
	return { x, y, z };
};

const sortData = (data) => {
	const sun = data.find((item) => item.englishName === 'Sun');
	sun.labelColour = settings.planetColours.sun;
	sun.isSun = true;

	const moons = data.filter(
		(item) =>
			item.aroundPlanet !== undefined && item.aroundPlanet !== null && item.perihelion !== 0 && item.aphelion !== 0
	);

	moons.forEach((moon) => {
		// all the moons will be default grey for now
		moon.labelColour = settings.planetColours[moon.englishName.toLowerCase()] || settings.planetColours.default;
		moon.isMajorMoon = majorMoons.indexOf(moon.englishName) !== -1;
		moon.isInnerMoon = innerMoons.indexOf(moon.englishName) !== -1;
		moon.longAscNode = moon.longAscNode !== 0 ? moon.longAscNode : getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(moon);
		moon.startingPosition = { x, y, z };
	});

	const dwarfPlanetList = ['Pluto', 'Ceres', 'Eris', 'Makemake', 'Haumea', 'Orcus'];
	const dwarfPlanets = dwarfPlanetList.map((dPlanet) => data.find((item) => item.englishName.includes(dPlanet)));
	dwarfPlanets.forEach((dwarfPlanet) => {
		dwarfPlanet.isPlanet = false;
		dwarfPlanet.isDwarfPlanet = true;
		dwarfPlanet.labelColour = settings.planetColours.default;
		dwarfPlanet.orbitRotationRandomiser = getRandomArbitrary(0, 360);
		dwarfPlanet.longAscNode = dwarfPlanet.longAscNode !== 0 ? dwarfPlanet.longAscNode : getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(dwarfPlanet);
		dwarfPlanet.startingPosition = { x, y, z };
		if (dwarfPlanet.moons && dwarfPlanet.moons.length) {
			const moonNames = dwarfPlanet.moons.map((moonData) => moonData.moon);
			dwarfPlanet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = moons.find((moon) => moonName === moon.name);
				if (moonData) dwarfPlanet.moons.push(moonData);
			});
		}
	});

	const planets = data.filter((item) => item.isPlanet);
	planets.forEach((planet) => {
		// firstly get the moon names then clear the pre-existing moon array from the API of garbage
		planet.labelColour = settings.planetColours[planet.englishName.toLowerCase()] || settings.planetColours.default;
		planet.isInnerPlanet = innerPlanets.indexOf(planet.englishName) !== -1;
		planet.orbitRotationRandomiser = getRandomArbitrary(0, 360);
		const { x, y, z } = startingOrbitPosition(planet);
		planet.startingPosition = { x, y, z };
		if (planet.moons && planet.moons.length) {
			const moonNames = planet.moons.map((moonData) => moonData.moon); // is called 'moon' not 'name' in the data! Whack
			planet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = moons.find((moon) => moonName === moon.name);
				if (moonData) planet.moons.push(moonData);
			});
		}
	});

	const satellites = data.filter(
		(item) =>
			item.englishName !== 'Sun' &&
			item.isPlanet === false &&
			item.aroundPlanet === null &&
			!dwarfPlanets.find((dPlanet) => dPlanet.name.includes(item.name))
	);

	return {
		sun,
		moons,
		dwarfPlanets,
		planets,
		satellites
	};
};

const getWikipediaData = async (articleTitle) => {
	// example URL: https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Jupiter
	const baseUrl = 'https://en.wikipedia.org/w/api.php';
	const imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/';
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

export { sortData, getWikipediaData };
