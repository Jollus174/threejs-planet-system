'use strict';
import { Vector3 } from 'three';
import { settings } from '../settings';
import { getRandomArbitrary, calculateOrbit, currentDateTime, convertToCamelCase } from '../utils';
import { orrery } from '../orrery';
import { materialData } from './solarSystem';

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

// manually adding own ring data, API does not have this
const ringData = {
	saturn: [
		{
			inner: 66900,
			outer: 140220,
			tilt: null
		}
	]
};

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

	// adding additional measurement fields to data
	orrery.bodies._all = [...data];
	orrery.bodies._all.forEach((item) => {
		// temp setting
		// TODO: Set these values manually, as the API is incomplete
		item.longAscNode = item.longAscNode !== 0 ? item.longAscNode : getRandomArbitrary(0, 360);
		item.argPeriapsis = item.argPeriapsis !== 0 ? item.argPeriapsis : getRandomArbitrary(0, 360);
		item.meanAnomaly = item.meanAnomaly !== 0 ? item.meanAnomaly : getRandomArbitrary(0, 360);
		//

		// N = longitude of the ascending node
		// i = inclination to the ecliptic (plane of orbit)
		// w = argument of perihelion
		// a = semi-major axis, or mean distance from Sun
		// e = eccentricity (0=circle, 0-1=ellipse, 1=parabola)
		// M = mean anomaly (0 at perihelion; increases uniformly with time)

		item.longOfPeriapsis = item.longAscNode + item.argPeriapsis; // w1
		item.meanLongitude = item.meanAnomaly + item.longOfPeriapsis; // L
		item.perihelionDistance = item.semimajorAxis * (1 - item.eccentricity); // q
		item.aphelionDistance = item.semimajorAxis * (1 + item.eccentricity); // Q
		// item.orbitalPeriod = Math.pow(item.semimajorAxis, 1.5); // P (years if a is in AU) (isn't this Sideral Orbit??)
		item.orbitalPeriod = item.sideralOrbit;
		item.epochOfM = item.meanAnomaly / 360 / item.orbitalPeriod; // T (time of perihelion)
		// v // True Anomaly
		// E // Eccentric Anomaly, this is an auxiliary angle used in Kepler's Equation, when computing the True Anomaly from the Mean Anomaly and the orbital eccentricity.
		item.obliquityOfEcliptic = 23.4293 - 3.563e-7 * currentDateTime();

		item.key = convertToCamelCase(item.englishName);
		item.materialData = materialData[item.key] || null;
		item.diameter = item.meanRadius * 2;
	});

	const sun = orrery.bodies._all.find((item) => item.englishName === 'Sun');
	sun.labelColour = settings.planetColours.sun;
	sun.isSun = true;

	const moons = orrery.bodies._all.filter(
		(item) =>
			item.aroundPlanet !== undefined && item.aroundPlanet !== null && item.perihelion !== 0 && item.aphelion !== 0
	);

	moons.forEach((moon) => {
		// all the moons will be default grey for now
		moon.labelColour = settings.planetColours[moon.englishName.toLowerCase()] || settings.planetColours.default;
		moon.isMajorMoon = majorMoons.indexOf(moon.englishName) !== -1;
		moon.isInnerMoon = innerMoons.indexOf(moon.englishName) !== -1;
		moon.isOuterMoon = !moon.isMajorMoon && !moon.isInnerMoon;
		moon.materialData = materialData[moon.key] || null;
		moon.startingPosition = new Vector3();
		moon.startingPosition.copy(startingOrbitPosition(moon));
	});

	const dwarfPlanetList = ['Pluto', 'Ceres', 'Eris', 'Makemake', 'Haumea', 'Orcus'];
	const dwarfPlanets = dwarfPlanetList.map((dPlanet) =>
		orrery.bodies._all.find((item) => item.englishName.includes(dPlanet))
	);
	dwarfPlanets.forEach((dwarfPlanet) => {
		dwarfPlanet.isPlanet = false;
		dwarfPlanet.isDwarfPlanet = true;
		dwarfPlanet.labelColour = settings.planetColours.default;
		dwarfPlanet.startingPosition = new Vector3();
		dwarfPlanet.startingPosition.copy(startingOrbitPosition(dwarfPlanet));
		if (dwarfPlanet.moons && dwarfPlanet.moons.length) {
			const moonNames = dwarfPlanet.moons.map((moonData) => moonData.moon);
			dwarfPlanet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = moons.find((moon) => moonName === moon.name);
				if (moonData) dwarfPlanet.moons.push(moonData);
			});
		}
	});

	const planets = orrery.bodies._all.filter((item) => item.isPlanet);
	planets.forEach((planet) => {
		// firstly get the moon names then clear the pre-existing moon array from the API of garbage
		planet.labelColour = settings.planetColours[planet.englishName.toLowerCase()] || settings.planetColours.default;
		planet.isInnerPlanet = innerPlanets.indexOf(planet.englishName) !== -1;
		planet.startingPosition = new Vector3();
		planet.startingPosition.copy(startingOrbitPosition(planet));
		if (planet.moons && planet.moons.length) {
			const moonNames = planet.moons.map((moonData) => moonData.moon); // is called 'moon' not 'name' in the data! Whack
			planet.moons = [];
			moonNames.forEach((moonName) => {
				const moonData = moons.find((moon) => moonName === moon.name);
				if (moonData) planet.moons.push(moonData);
			});
		}

		if (ringData[planet.key]) {
			planet.rings = [];
			ringData[planet.key].forEach((ring) => planet.rings.push(ring));
		}
	});

	const satellites = orrery.bodies._all.filter(
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
		// ['explaintext', '1'], // we want the HTML, so just text content. Saves needing to do extra formatting.
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
