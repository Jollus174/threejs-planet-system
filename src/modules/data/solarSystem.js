import { DoubleSide } from 'three';
import textureSun from './../../img/textures/sun-min.jpg';
import textureMercury from './../../img/textures/mercury.jpg';
import textureVenus from './../../img/textures/venus.jpg';
import textureEarth from './../../img/textures/earth.jpg';
import textureMoon from './../../img/textures/moon.jpg';
import textureMars from './../../img/textures/mars.jpg';

import textureJupiter from './../../img/textures/jupiter.jpg';
import textureIo from './../../img/textures/io.jpg';

import textureSaturn from './../../img/textures/saturn.jpg';
import textureUranus from './../../img/textures/uranus.jpg';
import textureNeptune from './../../img/textures/neptune.jpg';

import textureSaturnRing from './../../img/textures/saturn-ring-alpha.png';
import textureRing from './../../img/textures/texture-ring.jpg';

// import modelDeimos from './../../img/models/deimos.glb';

import normalMercury from './../../img/textures/normal-mercury.jpg';
import normalVenus from './../../img/textures/normal-venus.jpg';
import normalEarth from './../../img/textures/normal-earth.jpg';
import normalMoon from './../../img/textures/normal-moon.jpg';
import normalMars from './../../img/textures/normal-mars.jpg';

import spaceFt from './../../img/textures/space_ft.jpg';
import spaceBk from './../../img/textures/space_bk.jpg';
import spaceUp from './../../img/textures/space_up.jpg';
import spaceDn from './../../img/textures/space_dn.jpg';
import spaceRt from './../../img/textures/space_rt.jpg';
import spaceLt from './../../img/textures/space_lt.jpg';

const skyboxTexturePaths = [spaceFt, spaceBk, spaceUp, spaceDn, spaceRt, spaceLt];

let isLive = false; // HA HAHA this is so shit
const domainPath = isLive ? 'https://joeldoesdigital.com/web-experiments/planet-system/' : './../../img/';

const sunData = {
	id: 0,
	name: 'Sun',
	orbitRadius: 0.001,
	diameter: 1392680,
	segments: 32,
	labelColour: '#ffb01f',
	textColour: '#ffb01f',
	zoomTo: null,
	includeOrbitLine: false,
	includeLabelLine: false,
	includeTargetLine: false,
	spaceBetweenText: 1,
	titleFontSize: 1.2,
	statsFontSize: 0.33,
	stats: {
		diameter: 1391980
	},
	material: {
		map: textureSun,
		normalMap: null,
		emissive: '#FFF',
		emissiveMap: textureSun,
		emissiveIntensity: 0.8,
		side: DoubleSide
	}
};

const rawPlanetData = [
	{
		id: 'mercure',
		name: 'Mercure',
		englishName: 'Mercury',
		isPlanet: true,
		moons: null,
		semimajorAxis: 57909227,
		perihelion: 46001200,
		aphelion: 69816900,
		eccentricity: 0.2056,
		inclination: 7.0,
		mass: {
			massValue: 3.30114,
			massExponent: 23
		},
		vol: {
			volValue: 6.083,
			volExponent: 10
		},
		density: 5.4291,
		gravity: 3.7,
		escape: 4250.0,
		meanRadius: 2439.4,
		equaRadius: 2440.53,
		polarRadius: 2439.7,
		flattening: 0.0,
		dimension: '',
		sideralOrbit: 87.969,
		sideralRotation: 1407.6,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 0.0352,
		avgTemp: 0,
		mainAnomaly: 174.796,
		argPeriapsis: 29.022,
		longAscNode: 48.378,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/mercure'
	},
	{
		id: 'venus',
		name: 'Vénus',
		englishName: 'Venus',
		isPlanet: true,
		moons: null,
		semimajorAxis: 108208475,
		perihelion: 107477000,
		aphelion: 108939000,
		eccentricity: 0.0067,
		inclination: 3.39,
		mass: {
			massValue: 4.86747,
			massExponent: 24
		},
		vol: {
			volValue: 9.2843,
			volExponent: 11
		},
		density: 5.243,
		gravity: 8.87,
		escape: 10360.0,
		meanRadius: 6051.8,
		equaRadius: 6051.8,
		polarRadius: 6051.8,
		flattening: 0.0,
		dimension: '',
		sideralOrbit: 224.701,
		sideralRotation: -5832.5,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 177.36,
		avgTemp: 0,
		mainAnomaly: 50.115,
		argPeriapsis: 54.78,
		longAscNode: 76.785,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/venus'
	},
	{
		id: 'terre',
		name: 'La Terre',
		englishName: 'Earth',
		isPlanet: true,
		moons: [
			{
				moon: 'La Lune',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/lune'
			}
		],
		semimajorAxis: 149598262,
		perihelion: 147095000,
		aphelion: 152100000,
		eccentricity: 0.0167,
		inclination: 0.0,
		mass: {
			massValue: 5.97237,
			massExponent: 24
		},
		vol: {
			volValue: 1.08321,
			volExponent: 12
		},
		density: 5.5136,
		gravity: 9.8,
		escape: 11190.0,
		meanRadius: 6371.0084,
		equaRadius: 6378.1366,
		polarRadius: 6356.8,
		flattening: 0.00335,
		dimension: '',
		sideralOrbit: 365.256,
		sideralRotation: 23.9345,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 23.4393,
		avgTemp: 0,
		mainAnomaly: 358.617,
		argPeriapsis: 85.901,
		longAscNode: 18.272,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/terre'
	},
	{
		id: 'mars',
		name: 'Mars',
		englishName: 'Mars',
		isPlanet: true,
		moons: [
			{
				moon: 'Phobos',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/phobos'
			},
			{
				moon: 'Deïmos',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/deimos'
			}
		],
		semimajorAxis: 227943824,
		perihelion: 206700000,
		aphelion: 249200000,
		eccentricity: 0.0935,
		inclination: 1.85,
		mass: {
			massValue: 6.41712,
			massExponent: 23
		},
		vol: {
			volValue: 1.6318,
			volExponent: 11
		},
		density: 3.9341,
		gravity: 3.71,
		escape: 5030.0,
		meanRadius: 3389.5,
		equaRadius: 3396.19,
		polarRadius: 3376.2,
		flattening: 0.00589,
		dimension: '',
		sideralOrbit: 686.98,
		sideralRotation: 24.6229,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 25.19,
		avgTemp: 0,
		mainAnomaly: 19.412,
		argPeriapsis: 286.231,
		longAscNode: 49.667,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/mars'
	},
	{
		id: 'jupiter',
		name: 'Jupiter',
		englishName: 'Jupiter',
		isPlanet: true,
		moons: [],
		semimajorAxis: 778340821,
		perihelion: 740379835,
		aphelion: 816620000,
		eccentricity: 0.0489,
		inclination: 1.304,
		mass: {
			massValue: 1.89819,
			massExponent: 27
		},
		vol: {
			volValue: 1.43128,
			volExponent: 15
		},
		density: 1.3262,
		gravity: 24.79,
		escape: 60200.0,
		meanRadius: 69911.0,
		equaRadius: 71492.0,
		polarRadius: 66854.0,
		flattening: 0.06487,
		dimension: '',
		sideralOrbit: 4332.589,
		sideralRotation: 9.925,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 3.12,
		avgTemp: 0,
		mainAnomaly: 20.02,
		argPeriapsis: 273.442,
		longAscNode: 100.398,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/jupiter'
	},
	{
		id: 'saturne',
		name: 'Saturne',
		englishName: 'Saturn',
		isPlanet: true,
		moons: [],
		semimajorAxis: 1426666422,
		perihelion: 1349823615,
		aphelion: 1503509229,
		eccentricity: 0.0565,
		inclination: 2.485,
		mass: {
			massValue: 5.68336,
			massExponent: 26
		},
		vol: {
			volValue: 8.2713,
			volExponent: 14
		},
		density: 0.6871,
		gravity: 10.44,
		escape: 36090.0,
		meanRadius: 58232.0,
		equaRadius: 60268.0,
		polarRadius: 54364.0,
		flattening: 0.09796,
		dimension: '',
		sideralOrbit: 10759.22,
		sideralRotation: 10.656,
		aroundPlanet: null,
		discoveredBy: '',
		discoveryDate: '',
		alternativeName: '',
		axialTilt: 26.73,
		avgTemp: 0,
		mainAnomaly: 317.02,
		argPeriapsis: 336.178,
		longAscNode: 113.759,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/saturne'
	},
	{
		id: 'uranus',
		name: 'Uranus',
		englishName: 'Uranus',
		isPlanet: true,
		moons: [],
		semimajorAxis: 2870658186,
		perihelion: 2734998229,
		aphelion: 3006318143,
		eccentricity: 0.0457,
		inclination: 0.772,
		mass: {
			massValue: 8.68127,
			massExponent: 25
		},
		vol: {
			volValue: 6.833,
			volExponent: 13
		},
		density: 1.27,
		gravity: 8.87,
		escape: 21380.0,
		meanRadius: 25362.0,
		equaRadius: 25559.0,
		polarRadius: 24973.0,
		flattening: 0.02293,
		dimension: '',
		sideralOrbit: 30685.4,
		sideralRotation: -17.24,
		aroundPlanet: null,
		discoveredBy: 'William Herschel',
		discoveryDate: '13/03/1781',
		alternativeName: '',
		axialTilt: 97.77,
		avgTemp: 0,
		mainAnomaly: 142.2386,
		argPeriapsis: 98.862,
		longAscNode: 73.967,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/uranus'
	},
	{
		id: 'neptune',
		name: 'Neptune',
		englishName: 'Neptune',
		isPlanet: true,
		moons: [],
		semimajorAxis: 4498396441,
		perihelion: 4459753056,
		aphelion: 4537039826,
		eccentricity: 0.0113,
		inclination: 1.769,
		mass: {
			massValue: 1.02413,
			massExponent: 26
		},
		vol: {
			volValue: 6.254,
			volExponent: 13
		},
		density: 1.638,
		gravity: 11.15,
		escape: 23560.0,
		meanRadius: 24622.0,
		equaRadius: 24764.0,
		polarRadius: 24341.0,
		flattening: 0.01708,
		dimension: '',
		sideralOrbit: 60189.0,
		sideralRotation: 16.11,
		aroundPlanet: null,
		discoveredBy: 'Urbain Le Verrier, John Couch Adams, Johann Galle',
		discoveryDate: '23/09/1846',
		alternativeName: '',
		axialTilt: 28.3,
		avgTemp: 0,
		mainAnomaly: 256.228,
		argPeriapsis: 256.932,
		longAscNode: 131.823,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/neptune'
	},

	{
		id: 'pluton',
		name: 'Pluton',
		englishName: 'Pluto',
		isPlanet: true,
		moons: [
			{
				moon: 'Charon',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/charon'
			},
			{
				moon: 'Nix',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/nix'
			},
			{
				moon: 'Hydra',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/hydra'
			},
			{
				moon: 'Kerberos',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/kerberos'
			},
			{
				moon: 'Styx',
				rel: 'https://api.le-systeme-solaire.net/rest/bodies/styx'
			}
		],
		semimajorAxis: 5906440628,
		perihelion: 4436756954,
		aphelion: 7376124302,
		eccentricity: 0.2488,
		inclination: 17.16,
		mass: {
			massValue: 1.303,
			massExponent: 22
		},
		vol: {
			volValue: 7.15,
			volExponent: 9
		},
		density: 1.89,
		gravity: 0.62,
		escape: 1210,
		meanRadius: 1188.3,
		equaRadius: 1188.3,
		polarRadius: 1195,
		flattening: 0,
		dimension: '',
		sideralOrbit: 90465,
		sideralRotation: -153.2928,
		aroundPlanet: null,
		discoveredBy: 'Clyde W. Tombaugh',
		discoveryDate: '18/02/1930',
		alternativeName: '',
		axialTilt: 122.5,
		avgTemp: 0,
		mainAnomaly: 14.53,
		argPeriapsis: 113.175,
		longAscNode: 110.088,
		rel: 'https://api.le-systeme-solaire.net/rest/bodies/pluton'
	}
];

export { skyboxTexturePaths, sunData, rawPlanetData };
