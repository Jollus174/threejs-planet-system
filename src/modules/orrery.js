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
		_all: [],
		_star: [],
		_dwarfPlanet: [],
		_starField: null,
		_asteroidBelt: null,
		_planetLabels: {},
		_moonLabels: {},
		_dwarfPlanetLabels: {},
		_planet: [],
		_allPlanets: [],
		_moon: [],
		_asteroid: [],
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
