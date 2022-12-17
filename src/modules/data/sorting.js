'use strict';
import { convertToId, convertToKebabCase, hsl } from '../utilities/strings';
import { currentDateTime } from '../utilities/time';
import { getRandomArbitrary } from '../utilities/numeric';
import { wikipediaKeys } from './wikipediaKeys';

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

			// TODO: remove moons around asteroids, no support for those yet
			// if (planet.bodyType === 'Asteroid') {
			// 	console.log(`the cursed asteroid satellite entity is ${item.name}`);
			// }
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
		// if (item.id.toLowerCase().includes('dactyl')) item.displayName = 'Dactyl';

		if (['eris', 'ceres', 'makemake', 'haumea', 'orcus'].some((i) => item.displayName.toLowerCase().includes(i))) {
			item.displayName = item.displayName.split(' ')[1];
			item.bodyType = 'Dwarf Planet';
		}
	}

	return items;
};

const generalUpdates = (item, items) => {
	// misc item replacements + updates

	if (item.id === '_s20151364721') item.displayName = 'MK2';
	if (item.name === 'S/2017 J 9') item.semimajorAxis = 21487000;

	if (item.aroundPlanet) {
		const planet = items.find((i) => i.id === item.aroundPlanet.planet);
		planet.systemId = planet.systemId || convertToId(planet.name); // be mindful that NAME is used here instead of DISPLAY NAME
		planet.systemName = planet.displayName;
		item.systemId = planet.systemId;
		item.systemName = planet.systemName;
	} else {
		item.systemId = item.systemId || convertToId(item.name);
		item.systemName = item.displayName;
	}
};

const addToMoonGroup = (item) => {
	if (item.bodyType === 'Moon') {
		if (['_moon'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Earth';
			item.moonGroupColor = hsl(208, 6, 54);
			item.moonGroupShowName = false;
			item.moonGroupIndex = 0;
		}

		if (['_phobos', '_deimos'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Mars';
			item.moonGroupColor = hsl(1, 97, 50);
			item.moonGroupShowName = false;
			item.moonGroupIndex = 0;
		}

		if (['_io', '_europa', '_ganymede', '_callisto'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Galilean';
			item.moonGroupColor = hsl(111);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 0;
		}
		if (['_metis', '_adrastea', '_amalthea', '_thebe'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Inner';
			item.moonGroupColor = hsl(32);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 1;
		}
		if (['_leda', '_ersa', '_pandia', '_himalia', '_lysithea', '_elara', '_dia'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Himalia';
			item.moonGroupColor = hsl(255);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 2;
		}
		if (
			[
				'_euporie',
				'_eupheme',
				'_s2003J18',
				'_s2010J2',
				'_helike',
				'_s2003J16',
				'_s2003J2',
				'_euanthe',
				'_s2017J7',
				'_hermippe',
				'_praxidike',
				'_thyone',
				'_thelxinoe',
				'_s2017J3',
				'_ananke',
				'_mneme',
				'_s2016J1',
				'_orthosie',
				'_harpalyke',
				'_iocaste',
				'_s2017J9',
				'_s2003J12'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Ananke';
			item.moonGroupColor = hsl(59);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 3;
		}
		if (
			[
				'_erinome',
				'_aitne',
				'_herse',
				'_taygete',
				'_s2017J2',
				'_eukelade',
				'_carme',
				'_s2003J19',
				'_isonoe',
				'_pasithee',
				'_s2010J1',
				'_s2017J8',
				'_s2017J5',
				'_kalyke',
				'_kale',
				'_kallichore',
				'_s2011J1',
				'_chaldene',
				'_arche',
				'_eirene',
				'_s2003J9',
				'_s2003J10',
				'_s2003J24'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Carme';
			item.moonGroupColor = hsl(350);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 4;
		}
		if (
			[
				'_pasiphae',
				'_s2017J6',
				'_autonoe',
				'_philophrosyne',
				'_cyllene',
				'_pasiphae',
				'_sponde',
				'_eurydome',
				'_hegemone',
				'_s2017J1',
				'_kore',
				'_s2011J2',
				'_megaclite',
				'_aoede',
				'_s2003J4',
				'_s2003J23',
				'_callirrhoe',
				'_sinope'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Pasiphae';
			item.moonGroupColor = hsl(192);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 5;
		}
		if (['_themisto', '_carpo', '_valetudo'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Misc';
			item.moonGroupColor = hsl(208, 0, 80);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 6;
		}

		// Saturn moon groups...
		if (['_hyperion', '_rhea', '_titan', '_iapetus'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Outer Large';
			item.moonGroupColor = hsl(265);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 0;
		}
		if (
			[
				'_skathi',
				'_skoll',
				'_hyrrokkin',
				'_s2006S1',
				'_bergelmir',
				'_farbauti',
				'_s2004S30',
				'_s2004S32',
				'_s2006S3',
				'_kari',
				'_s2004S38',
				'_s2004S21'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Skathi';
			item.direction = 'retrograde';
			item.moonGroupColor = hsl(43);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 1;
		}
		if (['_narvi', '_bestla', '_s2004S36'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Narvi';
			item.direction = 'retrograde';
			item.moonGroupColor = hsl(25);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 2;
		}
		if (
			[
				'_phoebe',
				'_s2004S37',
				'_s2007S2',
				'_greip',
				'_mundilfari',
				'_s2004S13',
				'_s2007S3',
				'_suttungr',
				'_s2004S20',
				'_jarnsaxa',
				'_hati',
				'_s2004S17',
				'_s2004S12',
				'_s2004S27',
				'_thrymr',
				'_s2004S7',
				'_aegir',
				'_s2004S22',
				'_s2004S25',
				'_s2004S23',
				'_s2004S35',
				'_s2004S28',
				'_loge',
				'_fenrir',
				'_ymir',
				'_surtur',
				'_s2004S33',
				'_s2004S39',
				'_fornjot',
				'_s2004S34',
				'_s2004S26'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Norse';
			item.direction = 'retrograde';
			item.moonGroupColor = hsl(236);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 3;
		}
		if (['_albiorix', '_bebhionn', '_erriapus', '_tarvos'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Gallic';
			item.direction = 'prograde';
			item.moonGroupColor = hsl(43);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 4;
		}
		if (['_prometheus', '_daphnis', '_pan', '_janus', '_epimetheus', '_atlas', '_pandora'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Shepherd Moons';
			item.moonGroupColor = hsl(352);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 5;
		}
		if (['_tethys', '_telesto', '_calypso'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Tethys';
			item.moonGroupColor = hsl(86);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 6;
		}
		if (['_dione', '_helene', '_polydeuces'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Dione';
			item.moonGroupColor = hsl(190);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 7;
		}
		if (['_methone', '_anthe', '_pallene'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Alkyonides';
			item.moonGroupColor = hsl(221);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 8;
		}
		if (['_ijiraq', '_kiviuq', '_paaliaq', '_siarnaq', '_tarqeq'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Inuit';
			item.moonGroupColor = hsl(24);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 9;
		}
		if (
			['_mimas', '_enceladus', '_aegaeon', '_s2009S1', '_s2004S24', '_s2004S29', '_s2004S31'].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Misc';
			item.moonGroupShowName = true;
			item.moonGroupIndex = 10;
		}

		// Uranus moon groups...
		if (['_ariel', '_miranda', '_umbriel', '_titania', '_oberon'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Major';
			item.moonGroupColor = hsl(7);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 0;
		}
		if (
			[
				'_cordelia',
				'_ophelia',
				'_bianca',
				'_cressida',
				'_desdemona',
				'_juliet',
				'_portia',
				'_rosalind',
				'_cupid',
				'_belinda',
				'_perdita',
				'_puck',
				'_mab'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Inner';
			item.moonGroupColor = hsl(334);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 1;
		}
		if (
			[
				'_francisco',
				'_caliban',
				'_stephano',
				'_trinculo',
				'_sycorax',
				'_margaret',
				'_prospero',
				'_setebos',
				'_ferdinand'
			].indexOf(item.id) !== -1
		) {
			item.moonGroupName = 'Irregular';
			item.moonGroupColor = hsl(136);
			item.moonGroupShowName = true;
			item.direction = item.id === '_margaret' ? 'Prograde' : 'Retrograde';
			item.moonGroupIndex = 2;
		}

		// Neptune moon groups...
		if (['_naiad', '_thalassa', '_despina', '_galatea', '_larissa', '_hippocamp', '_proteus'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Regular';
			item.moonGroupColor = hsl(43);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 0;
		}
		if (['_triton', '_nereid', '_halimede', '_sao', '_laomedeia', '_psamathe', '_neso'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Irregular';
			item.moonGroupColor = hsl(180);
			item.moonGroupShowName = true;
			item.moonGroupIndex = 1;
		}

		// TODO: Unsure if using this yet
		if (['_triton', '_halimede', '_psamathe', '_neso'].indexOf(item.id) !== -1) item.direction = 'Retrograde';
		if (['_nereid', '_sao', 'laomedeia'].indexOf(item.id) !== -1) item.direction = 'Prograde';
		// ---

		if (['_charon', '_nix', '_hydra', '_kerberos', '_styx'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Pluto';
			item.moonGroupColor = hsl(24);
			item.moonGroupShowName = false;
			item.moonGroupIndex = 0;
		}

		if (['_dysnomia'].indexOf(item.id) !== -1) {
			item.moonGroupName = 'Eris';
			item.moonGroupColor = hsl(16, null, 50);
			item.moonGroupShowName = false;
			item.moonGroupIndex = 0;
		}

		if (!item.moonGroupColor) {
			item.moonGroupColor = hsl(208, 6, 54);
		}

		item.moonGroupId = item.moonGroupName ? convertToId(item.moonGroupName) : '';
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
		_saturn: [
			{
				// TODO: these numbers are likely inaccurate
				inner: 66900,
				outer: 180220, // looks more rad
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
	item.wikipediaKey = wikipediaKeys.find((w) => w.id === item.id).wikipediaKey;
};

const setSidebarImage = (item) => {
	item.sidebarImage = `/img/sidebar-images/${convertToKebabCase(item.id.replace('_', ''))}.jpg`;
};

export {
	addToMoonGroup,
	isInnerPlanet,
	setRings,
	setOrbitCalculations,
	setWikipediaKeys,
	setSidebarImage,
	idReplacements,
	generalUpdates
};
