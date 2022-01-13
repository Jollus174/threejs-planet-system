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

	data.forEach((item) => {
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
			per_page: null
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

		if (item.displayName === 'Earth') item.sideralOrbit = 365.24;

		if (item.type === 'Moon') {
			if (['metis', 'adrastea', 'amalthea', 'thebe'].indexOf(item.id) !== -1) item.moonGroup = 'Inner';
			if (['io', 'europa', 'ganymede', 'callisto'].indexOf(item.id) !== -1) item.moonGroup = 'Galilean';
			if (['leda', 'ersa', 'pandia', 'himalia', 'lysithea', 'elara', 'dia'].indexOf(item.id) !== -1)
				item.moonGroup = 'Himalia';

			if (
				[
					'euporie',
					'eupheme',
					's2003j18',
					's2010j2',
					'helike',
					's2003j16',
					's2003j2',
					'euanthe',
					's2017j7',
					'hermippe',
					'praxidike',
					'thyone',
					'thelxinoe',
					's2017j3',
					'ananke',
					'mneme',
					's2016j1',
					'orthosie',
					'harpalyke',
					'iocaste',
					's2017j9',
					's2003j12'
				].indexOf(item.id) !== -1
			)
				item.moonGroup = 'Ananke';

			if (
				[
					'erinome',
					'aitne',
					'herse',
					'taygete',
					's2017j2',
					'eukelade',
					'carme',
					's2003j19',
					'isonoe',
					'pasithee',
					's2010j1',
					's2003j24',
					's2017j8',
					's2017j5',
					'kalyke',
					'kale',
					'kallichore',
					's2011j1',
					'chaldene',
					'arche',
					'eirene',
					's2003j9',
					's2003j10',
					'carpo'
				]
					.map((i) => convertToCamelCase(i.replace(' ', '')))
					.indexOf(item.id) !== -1
			)
				item.moonGroup = 'Carme';

			if (
				[
					'pasiphae',
					's2017j6',
					'autonoe',
					'philophrosyne',
					'cyllene',
					'pasiphae',
					'sponde',
					'eurydome',
					'hegemone',
					's2017j1',
					'kore',
					's2011j2',
					'megaclite',
					'aoede',
					's2003j4',
					's2003j23',
					'callirrhoe',
					'sinope'
				].indexOf(item.id) !== -1
			)
				item.moonGroup = 'Pasiphae';

			if (['themisto', 'carpo', 'valetudo'].indexOf(item.id) !== -1) item.moonGroup = 'Misc';

			// Saturn moon groups...
			if (
				[
					'skathi',
					'skoll',
					'hyrrokkin',
					's2006s1',
					'bergelmir',
					'farbauti',
					's2004s30',
					's2004s32',
					's2006s3',
					'kari',
					's2004s38',
					's2004s21'
				].indexOf(item.id) !== -1
			) {
				item.moonGroup = 'Skathi';
				item.direction = 'retrograde';
			}

			if (['narvi', 'bestla', 's2004s36'].indexOf(item.id) !== -1) {
				item.moonGroup = 'Narvi';
				item.direction = 'retrograde';
			}

			if (
				[
					'phoebe',
					's2004s37',
					's2007s2',
					'greip',
					'mundilfari',
					's2004s13',
					's2007s3',
					'suttungr',
					's2004s20',
					'jarnsaxa',
					'hati',
					's2004s17',
					's2004s12',
					's2004s27',
					'thrymr',
					's2004s7',
					'aegir',
					's2004s22',
					's2004s25',
					's2004s23',
					's2004s35',
					's2004s28',
					'loge',
					'fenrir',
					'ymir',
					'surtur',
					's2004s33',
					's2004s39',
					'fornjot',
					's2004s34',
					's2004s26'
				].indexOf(item.id) !== -1
			) {
				item.moonGroup = 'Norse';
				item.direction = 'retrograde';
			}

			if (['albiorix', 'bebhionn', 'erriapus', 'tarvos'].indexOf(item.id) !== -1) {
				item.moonGroup = 'Gallic';
				item.direction = 'prograde';
			}

			if (['prometheus', 'daphnis', 'pan', 'janus', 'epimetheus', 'atlas', 'pandora'].indexOf(item.id) !== -1)
				item.moonGroup = 'ShepherdMoons';
			if (['tethys', 'telesto', 'calypso'].indexOf(item.id) !== -1) item.moonGroup = 'Tethys';
			if (['dione', 'helene', 'polydeuces'].indexOf(item.id) !== -1) item.moonGroup = 'Dione';
			if (['methone', 'anthe', 'pallene'].indexOf(item.id) !== -1) item.moonGroup = 'Alkyonides';
			if (['ijiraq', 'kiviuq', 'paaliaq', 'siarnaq', 'tarqeq'].indexOf(item.id) !== -1) item.moonGroup = 'Inuit';
			if (['hyperion', 'rhea', 'titan', 'iapetus'].indexOf(item.id) !== -1) item.moonGroup = 'OuterLarge';
			if (['mimas', 'enceladus', 'aegaeon', 's2009s1', 's2004s24', 's2004s29', 's2004s31'].indexOf(item.id) !== -1)
				item.moonGroup = 'Misc';

			// Uranus moon groups...
			if (
				[
					'cordelia',
					'ophelia',
					'bianca',
					'cressida',
					'desdemona',
					'juliet',
					'portia',
					'rosalind',
					'cupid',
					'belinda',
					'perdita',
					'puck',
					'mab'
				].indexOf(item.id) !== -1
			)
				item.moonGroup = 'Inner';
			if (['ariel', 'miranda', 'umbriel', 'titania', 'oberon'].indexOf(item.id) !== -1) item.moonGroup = 'Major';
			if (
				[
					'francisco',
					'caliban',
					'stephano',
					'trinculo',
					'sycorax',
					'margaret',
					'prospero',
					'setebos',
					'ferdinand'
				].indexOf(item.id) !== -1
			) {
				item.moonGroup = 'Irregular';
				item.direction = item.id === 'margaret' ? 'Prograde' : 'Retrograde';
			}

			// Neptune moon groups...
			if (['naiad', 'thalassa', 'despina', 'galatea', 'larissa', 'hippocamp', 'proteus'].indexOf(item.id) !== -1)
				item.moonGroup = 'Regular';
			if (['triton', 'nereid', 'halimede', 'sao', 'laomedeia', 'psamathe', 'neso'].indexOf(item.id) !== -1)
				item.moonGroup = 'Irregular';
			if (['triton', 'halimede', 'psamathe', 'neso'].indexOf(item.id) !== -1) item.direction = 'Retrograde';
			if (['nereid', 'sao', 'laomedeia'].indexOf(item.id) !== -1) item.direction = 'Prograde';

			if (!item.moonGroup) item.moonGroup = item.system;
			item.moonGroupId = item.moonGroup.toLowerCase();
		}
	});

	// adding additional measurement fields to data
	orrery.bodies._all = [...data];
	orrery.bodies._all.forEach((item) => {
		// temp setting
		// TODO: Set these values manually, as the API is incomplete
		item.longAscNode = item.longAscNode || getRandomArbitrary(0, 360);
		item.argPeriapsis = item.argPeriapsis || getRandomArbitrary(0, 360);
		item.meanAnomaly = item.meanAnomaly || getRandomArbitrary(0, 360);
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

	// Building 'Entity Nav' ids with:
	// Planets > Planet Moons > Dwarf Planets > Dwarf Planet Moons > Asteroids
	settings.navigationSystems.forEach((navItem) => {
		const entityItem = orrery.bodies._all.find((allItem) => allItem.id === navItem);
		settings.navigationEntities.push(entityItem.id);
		if (entityItem.moons) entityItem.moons.forEach((m) => settings.navigationEntities.push(m.moon));
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
