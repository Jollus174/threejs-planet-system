import { scene } from './scene';
import { controls } from './controls';
import { camera } from './camera';
import { renderer, composer } from './renderers/renderer';
import { labelRenderer } from './renderers/labelRenderer';
import { skybox } from './factories/solarSystemFactory';
import { Clock } from 'three';
import { SolarSystemDataType } from './data/api';
import { Entity } from './objectProps';

export type BodyType = '_all' | '_planet' | '_dwarfPlanet' | '_asteroid' | '_moon' | '_star';

const orrery = {
	scene,
	controls,
	camera,
	renderer,
	composer,
	labelRenderer,
	cameraState: {
		_zoomToTarget: false,
		_dollySpeed: null,
		_rotateToTarget: false,
		_currentPlanetInRange: '',
		_isInPlaneOfReference: false
	},
	mouseState: {
		_mouseClicked: false,
		_mousePosition: [null, null],
		_hoveredClass: {} as Entity | null,
		_clickedClass: {} as Entity | null,
		_zoomedClass: {} as Entity | null,
		_clickedGroup: {} as THREE.Group | null
	},
	skybox: skybox(),
	classes: {
		_all: {},
		_allIterable: [],
		_allIterableLength: 0,
		_moonsIterable: [],
		_planets: {},
		_dwarfPlanets: {},
		_asteroids: {},
		_moons: {},
		_navigable: {}
	},
	bodies: {
		types: {
			_all: [] as SolarSystemDataType[],
			_allPlanets: [] as SolarSystemDataType[],
			_planet: [] as SolarSystemDataType[],
			_dwarfPlanet: [] as SolarSystemDataType[],
			_asteroid: [] as SolarSystemDataType[],
			_moon: [] as SolarSystemDataType[],
			_star: [] as SolarSystemDataType[]
		},
		_sun: null,
		_starField: null,
		_asteroidBelt: null,
		_orbitLines: []
	},
	orbitLines: {
		_orbitLinesVisible: true
	},
	lights: {
		_pointLights: [],
		_spotLights: [],
		_ambientLights: []
	},
	isDesktop: false,
	vueTarget: document.querySelector('#app-orrery'),
	dateTimeDifference: 0,
	time: new Clock()
};

window.orrery = orrery;

export { orrery };
