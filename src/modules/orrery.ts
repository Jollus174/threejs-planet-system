import { scene } from './scene';
import { controls } from './controls';
import { camera } from './camera';
import { renderer, composer } from './renderers/renderer';
import { labelRenderer } from './renderers/labelRenderer';
import { skybox } from './factories/solarSystemFactory';
import { AmbientLight, Clock, PointLight, SpotLight } from 'three';
import { SolarSystemDataType } from './data/api';
import { DwarfPlanet, Entity, Moon, OrbitLine, Planet, Sun } from './objectProps';

export type BodyType = '_all' | '_planet' | '_dwarfPlanet' | '_asteroid' | '_moon' | '_star';

const Orrery = {
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
		_all: {} as { [key: string]: Entity },
		_allIterable: [] as Entity[],
		_allIterableLength: 0,
		_moonsIterable: [] as Moon[],
		_planets: {} as { [key: string]: Planet },
		_dwarfPlanets: {} as { [key: string]: DwarfPlanet },
		_asteroids: {},
		_moons: {} as { [key: string]: Moon },
		_navigable: {},
		_sun: {} as Sun
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
		_sun: {} as SolarSystemDataType,
		_starField: null,
		_asteroidBelt: null,
		_orbitLines: [] as OrbitLine[]
	},
	orbitLines: {
		_orbitLinesVisible: true
	},
	lights: {
		_pointLights: [] as PointLight[],
		_spotLights: [] as SpotLight[],
		_ambientLights: [] as AmbientLight[]
	},
	isDesktop: false,
	vueTarget: document.querySelector('#app-orrery'),
	dateTimeDifference: 0,
	time: new Clock()
};

window.orrery = Orrery;

export { Orrery };
