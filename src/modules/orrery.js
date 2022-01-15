import { scene } from './scene';
import { controls } from './controls';
import { camera } from './camera';

const orrery = {
	scene,
	controls,
	camera,
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
		_hoveredClass: null,
		_clickedClass: null,
		_zoomedClass: null
	},
	skybox: null,
	classes: {
		_all: {},
		_planets: {},
		_dwarfPlanets: {},
		_asteroids: {},
		_moons: {},
		_navigable: {}
	},
	bodies: {
		types: {
			_all: [],
			_planet: [],
			_dwarfPlanet: [],
			_asteroid: [],
			_moon: []
		},
		_sun: null,
		_starField: null,
		_asteroidBelt: null,
		_planetLabels: {},
		_moonLabels: {},
		_dwarfPlanetLabels: {},
		_allPlanets: [],
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
	vueTarget: document.querySelector('#app-orrery')
};

window.orrery = orrery;

export { orrery };
