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

const dwarfPlanetList = ['Pluto', 'Ceres', 'Eris', 'Makemake', 'Haumea', 'Orcus', '50000 Quaoar'];

const asteroidsList = [
	'4 Vesta',
	'433 Eros',
	'101955 Bennu',
	'243 Ida',
	'6 Hebe',
	'762 Pulcova',
	'47171 Lempo',
	'951 Gaspra',
	'4179 Toutatis',
	'2867 Steins',
	'5 Astraea',
	'5145 Pholus',
	'2 Pallas',
	'4769 Castalia',
	'624 Hektor',
	'216 Kleopatra',
	'3753 Cruithne',
	'3 Juno',
	'10 Hygiea',
	'16 Psyche',
	'25143 Itokawa',
	'21 Lutetia',
	'253 Mathilde',
	'87 Sylvia'
];

const asteroidMoonsList = ['Remus', 'Petit-Prince'];

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

		item.materialData = materialData[item.id] || null;
		item.diameter = item.meanRadius * 2;
		// Math.min to account for huge bodies like Sun
		item.zoomTo = Math.min(item.meanRadius * 16, item.meanRadius + 7000000);

		item.labelColour =
			settings.planetColours[item.id] || settings.planetColours[item.type] || settings.planetColours.default;

		// setting the 'entity types' here rather than further down and redoing the loop
		const key = '_' + convertToCamelCase(item.type);
		orrery.bodies[key] = orrery.bodies[key] || [];
		orrery.bodies[key].push(item);
	});

	const sun = orrery.bodies._star[0];

	const moons = orrery.bodies._all.filter((m) => m.type === 'Moon').sort((a, b) => a.displayName < b.displayName);
	moons.forEach((moon) => {
		moon.isMajorMoon = majorMoons.indexOf(moon.displayName) !== -1;
		moon.isInnerMoon = innerMoons.indexOf(moon.displayName) !== -1;
		moon.isOuterMoon = !moon.isMajorMoon && !moon.isInnerMoon;
		moon.materialData = materialData[moon.id] || null;
		moon.startingPosition = new Vector3();
		moon.startingPosition.copy(startingOrbitPosition(moon));
	});

	const dwarfPlanets = orrery.bodies._all
		.filter((d) => d.type === 'Dwarf Planet')
		.sort((a, b) => a.displayName < b.displayName);
	dwarfPlanets.forEach((dwarfPlanet) => {
		dwarfPlanet.startingPosition = new Vector3();
		dwarfPlanet.startingPosition.copy(startingOrbitPosition(dwarfPlanet));
	});

	// const asteroids = asteroidsList.map((asteroid) =>
	// 	orrery.bodies._all.find((item) => item.displayName.includes(asteroid))
	// );
	// asteroids.forEach((asteroid) => {
	// 	asteroid.labelColour = settings.planetColours.default;
	// 	asteroid.type = 'Asteroid';
	// 	asteroid.startingPosition = new Vector3();
	// 	asteroid.startingPosition.copy(startingOrbitPosition(asteroid));
	// });

	const planets = orrery.bodies._all.filter((p) => p.type === 'Planet').sort((a, b) => a.displayName < b.displayName);
	planets.forEach((planet) => {
		planet.isInnerPlanet = innerPlanets.indexOf(planet.displayName) !== -1;
		planet.startingPosition = new Vector3();
		planet.startingPosition.copy(startingOrbitPosition(planet));
		planet.type = 'Planet';

		if (ringData[planet.id]) {
			planet.rings = [];
			ringData[planet.id].forEach((ring) => planet.rings.push(ring));
		}
	});

	// const satellites = orrery.bodies._all.filter(
	// 	(item) =>
	// 		item.displayName !== 'Sun' &&
	// 		item.isPlanet === false &&
	// 		item.aroundPlanet === null &&
	// 		!dwarfPlanets.find((dPlanet) => dPlanet.name.includes(item.name))
	// );
	// satellites.forEach((satellite) => {
	// 	satellite.type = 'Satellite or Comet';
	// });

	// Building 'Entity Nav' ids with:
	// Planets > Planet Moons > Dwarf Planets > Dwarf Planet Moons > Asteroids
	settings.systemNavigation.forEach((navItem) => {
		const entityItem = orrery.bodies._all.find((allItem) => allItem.id === navItem);
		settings.entityNavigation.push(entityItem.id);
		if (entityItem.moons) entityItem.moons.forEach((m) => settings.entityNavigation.push(m.moon));
	});
	// TODO: asteroids n stuff

	return {
		sun,
		moons,
		dwarfPlanets,
		planets
		// asteroids
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

const getNASAMediaData = async (tag) => {
	// https://solarsystem.nasa.gov/api/v1/resources/?page=0&per_page=25&order=created_at+desc&search=&href_query_params=category%3Dplanets_jupiter&button_class=big_more_button&tags=jupiter&condition_1=1%3Ais_in_resource_list&category=51
	const baseUrl = 'https://solarsystem.nasa.gov/api/v1/resources/';
	const queryParams = [
		['page', '0'],
		['per_page', '25'],
		['order', 'created_at+desc'],
		// ['search', ''],
		// ['href_query_params', 'category%3Dplanets_jupiter'],
		// ['button_class', 'big_more_button'],
		['tags', 'jupiter'],
		['condition_1', '1%3Ais_in_resource_list']
		// ['category', '51']
	];

	const url = `${baseUrl}?${queryParams.map((q) => [q[0], q[1]].join('=')).join('&')}`;

	return url;
};

export { sortData, getWikipediaData, getNASAMediaData };
