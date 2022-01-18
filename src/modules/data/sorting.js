'use strict';
import { convertToId } from '../utilities/strings';
import { currentDateTime } from '../utilities/time';
import { getRandomArbitrary } from '../utilities/numeric';
import { wikipediaKeys } from './wikipediaKeys';

const addToMoonGroup = (item) => {
	if (item.bodyType === 'Moon') {
		if (['moon'].indexOf(item.id) !== -1) {
			item.moonGroup = '';
			item.moonGroupColor = '#82898f';
		}

		if (['phobos', 'deimos'].indexOf(item.id) !== -1) {
			item.moonGroup = '';
			item.moonGroupColor = '#fc6f43';
		}

		if (['metis', 'adrastea', 'amalthea', 'thebe'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Inner';
			item.moonGroupColor = '#e89c47';
		}

		if (['io', 'europa', 'ganymede', 'callisto'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Galilean';
			item.moonGroupColor = '#58b548';
		}
		if (['leda', 'ersa', 'pandia', 'himalia', 'lysithea', 'elara', 'dia'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Himalia';
			item.moonGroupColor = '#cda434';
		}

		if (
			[
				'euporie',
				'eupheme',
				's2003J18',
				's2010J2',
				'helike',
				's2003J16',
				's2003J2',
				'euanthe',
				's2017J7',
				'hermippe',
				'praxidike',
				'thyone',
				'thelxinoe',
				's2017J3',
				'ananke',
				'mneme',
				's2016J1',
				'orthosie',
				'harpalyke',
				'iocaste',
				's2017J9',
				's2003J12'
			].indexOf(item.id) !== -1
		) {
			item.moonGroup = 'Ananke';
			item.moonGroupColor = '#bebd7f';
		}

		if (
			[
				'erinome',
				'aitne',
				'herse',
				'taygete',
				's2017J2',
				'eukelade',
				'carme',
				's2003J19',
				'isonoe',
				'pasithee',
				's2010J1',
				's2017J8',
				's2017J5',
				'kalyke',
				'kale',
				'kallichore',
				's2011J1',
				'chaldene',
				'arche',
				'eirene',
				's2003J9',
				's2003J10',
				's2003J24'
			].indexOf(item.id) !== -1
		) {
			item.moonGroup = 'Carme';
			item.moonGroupColor = '#ea899a';
		}

		if (
			[
				'pasiphae',
				's2017J6',
				'autonoe',
				'philophrosyne',
				'cyllene',
				'pasiphae',
				'sponde',
				'eurydome',
				'hegemone',
				's2017J1',
				'kore',
				's2011J2',
				'megaclite',
				'aoede',
				's2003J4',
				's2003J23',
				'callirrhoe',
				'sinope'
			].indexOf(item.id) !== -1
		) {
			item.moonGroup = 'Pasiphae';
			item.moonGroupColor = '#1b9dbe';
		}

		if (['themisto', 'carpo', 'valetudo'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Misc';
			item.moonGroupColor = '#82898f';
		}

		// Saturn moon groups...
		if (
			[
				'skathi',
				'skoll',
				'hyrrokkin',
				's2006S1',
				'bergelmir',
				'farbauti',
				's2004S30',
				's2004S32',
				's2006S3',
				'kari',
				's2004S38',
				's2004S21'
			].indexOf(item.id) !== -1
		) {
			item.moonGroup = 'Skathi';
			item.direction = 'retrograde';
			item.moonGroupColor = '#826c34';
		}

		if (['narvi', 'bestla', 's2004S36'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Narvi';
			item.direction = 'retrograde';
			item.moonGroupColor = '#ff7514';
		}

		if (
			[
				'phoebe',
				's2004S37',
				's2007S2',
				'greip',
				'mundilfari',
				's2004S13',
				's2007S3',
				'suttungr',
				's2004S20',
				'jarnsaxa',
				'hati',
				's2004S17',
				's2004S12',
				's2004S27',
				'thrymr',
				's2004S7',
				'aegir',
				's2004S22',
				's2004S25',
				's2004S23',
				's2004S35',
				's2004S28',
				'loge',
				'fenrir',
				'ymir',
				'surtur',
				's2004S33',
				's2004S39',
				'fornjot',
				's2004S34',
				's2004S26'
			].indexOf(item.id) !== -1
		) {
			item.moonGroup = 'Norse';
			item.direction = 'retrograde';
			item.moonGroupColor = '#5c67ff';
		}

		if (['albiorix', 'bebhionn', 'erriapus', 'tarvos'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Gallic';
			item.direction = 'prograde';
			item.moonGroupColor = '#826c34';
		}

		if (['prometheus', 'daphnis', 'pan', 'janus', 'epimetheus', 'atlas', 'pandora'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Shepherd Moons';
			item.moonGroupColor = '#ff6075';
		}
		if (['tethys', 'telesto', 'calypso'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Tethys';
			item.moonGroupColor = '#a98307';
		}
		if (['dione', 'helene', 'polydeuces'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Dione';
			item.moonGroupColor = '#256d7b';
		}
		if (['methone', 'anthe', 'pallene'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Alkyonides';
			item.moonGroupColor = '#606e8c';
		}
		if (['ijiraq', 'kiviuq', 'paaliaq', 'siarnaq', 'tarqeq'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Inuit';
			item.moonGroupColor = '#ff9652';
		}
		if (['hyperion', 'rhea', 'titan', 'iapetus'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Outer Large';
			item.moonGroupColor = '#8673a1';
		}
		if (['mimas', 'enceladus', 'aegaeon', 's2009S1', 's2004S24', 's2004S29', 's2004S31'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Misc';
		}

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
		) {
			item.moonGroup = 'Inner';
			item.moonGroupColor = '#ff4c98';
		}

		if (['ariel', 'miranda', 'umbriel', 'titania', 'oberon'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Major';
			item.moonGroupColor = '#ff8b7b';
		}

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
			item.moonGroupColor = '#308446';
		}

		// Neptune moon groups...
		if (['naiad', 'thalassa', 'despina', 'galatea', 'larissa', 'hippocamp', 'proteus'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Regular';
			item.moonGroupColor = '#dc9d00';
		}
		if (['triton', 'nereid', 'halimede', 'sao', 'laomedeia', 'psamathe', 'neso'].indexOf(item.id) !== -1) {
			item.moonGroup = 'Irregular';
			item.moonGroupColor = '#7fb5b5';
		}
		if (['triton', 'halimede', 'psamathe', 'neso'].indexOf(item.id) !== -1) item.direction = 'Retrograde';
		if (['nereid', 'sao', 'laomedeia'].indexOf(item.id) !== -1) item.direction = 'Prograde';

		if (['charon', 'nix', 'hydra', 'kerberos', 'styx'].indexOf(item.id) !== -1) {
			item.moonGroup = '';
			item.moonGroupColor = '#ff8333';
		}

		if (!item.moonGroupColor) {
			item.moonGroupColor = '#82898f';
		}

		item.moonGroupId = item.moonGroup ? item.moonGroup.toLowerCase() : '';
	}
};

const isInnerPlanet = (item) => {
	const innerPlanets = ['Mercury', 'Venus', 'Earth', 'Mars'];

	if (item.bodyType === 'planet' && innerPlanets.indexOf(item.displayName) !== -1) {
		item.isInnerPlanet = true;
	}
};

const setRings = (item) => {
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

	// TODO: This will eventually be 'englishId' because of Monsiour French API Dev's data
	if (ringData[item.id]) {
		item.rings = [];
		for (const ring of ringData[item.id]) {
			item.rings.push(ring);
		}
	}
};

const setOrbitCalculations = (item) => {
	// TODO: Set these values manually, as the API is incomplete
	item.longAscNode = item.longAscNode || getRandomArbitrary(0, 360);
	item.argPeriapsis = item.argPeriapsis || getRandomArbitrary(0, 360);
	item.meanAnomaly = item.meanAnomaly || getRandomArbitrary(0, 360);
	// no negative rotations, thanks
	item.sideralRotation = !!item.sideralRotation ? Math.abs(parseFloat(item.sideralRotation)) : item.sideralRotationl;
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
	item.meanRadius = item.meanRadius || 0.01;
	item.diameter = item.meanRadius * 2;

	if (item.displayName === 'Earth') item.sideralOrbit = 365.24;
};

const setWikipediaKeys = (item) => {
	item.wikipediaKey = wikipediaKeys.find(
		(w) => w.name.toLowerCase() === item.name.toLowerCase().replace('(', '').replace(')', '') || w.id === item.id
	).wikipediaKey;
};

const generalUpdates = (item, items) => {
	// if (item.id === 's20151364721') {
	// 	item.id = 'mk2';
	// 	item.displayName = 'MK2';
	// }
	item.discoveredBy = item.discoveredBy.replace('S&eacute;bastien', 'Sebastien');

	if (item.aroundPlanet) {
		const planet = items.find((i) => i.id === item.aroundPlanet.planet);
		planet.systemId = planet.systemId || convertToId(planet.displayName);
		planet.systemName = planet.displayName;
		item.systemId = planet.systemId;
		item.systemName = planet.systemName;
	} else {
		item.systemId = item.systemId || convertToId(item.displayName);
		item.systemName = item.displayName;
	}
};

const idReplacements = (itemList) => {
	// needing to replace the French planet IDs for each moon with English ones, same for planets, etc
	// getting rid 'englishName', it's going to just be the 'name'. All in English and no French references in the data

	const items = itemList;

	// doing a pass for ID replacements
	for (const item of items) {
		item.displayName = item.englishName;
		item.englishId = item.englishId || convertToId(item.englishName); // temp ID so can map the French Ids to the English ones

		if (item.aroundPlanet) {
			const planet = items.find((i) => i.id === item.aroundPlanet.planet);
			planet.englishId = planet.englishId || convertToId(planet.englishName);
			item.aroundPlanet.planet = planet.englishId;
		}

		if (item.moons && item.moons.length) {
			for (const entityMoon of item.moons) {
				const moonRef = items.find((i) => i.name === entityMoon.moon);
				moonRef.englishId = moonRef.englishId || convertToId(moonRef.englishName);
				entityMoon.moon = moonRef.englishId;
			}
		}
	}

	// doing a second pass to remove the 'englishXX' keys, they should be the normal keys
	// also updating display names
	for (const item of items) {
		item.name = item.englishName;
		item.id = item.englishId;
		if (item.aroundPlanet) delete item.aroundPlanet.rel;
		if (item.moons && item.moons.length) {
			for (const moon of item.moons) {
				delete moon.rel;
			}
		}
		delete item.englishName;
		delete item.englishId;

		if (item.discoveredBy && item.discoveredBy.includes('Hubble')) item.discoveredBy = 'Hubble Space Telescope';
		if (item.name === 'Moon') item.displayName = 'The Moon';
		if (item.id === 'dactyl') item.displayName = 'Dactyl';
		if (item.id === 'ceres') item.displayName = 'Ceres';
		if (item.id === 'eris') item.displayName = 'Eris';
		if (item.id === 'makemake') item.displayName = 'Makemake';
		if (item.id === 'haumea') item.displayName = 'Haumea';
		if (item.id === 'orcus') item.displayName = 'Orcus';
		if (item.id === 'quaoar') item.displayName = 'Quaoar';
	}

	return items;
};

export {
	addToMoonGroup,
	isInnerPlanet,
	setRings,
	setOrbitCalculations,
	setWikipediaKeys,
	generalUpdates,
	idReplacements
};
