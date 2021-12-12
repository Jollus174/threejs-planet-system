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
		_rotateCameraYTo: null,
		_currentZoomDistanceThreshold: 0,
		_currentPlanetInRange: ''
	},
	mouseState: {
		_mouseHasMoved: false,
		_mouseClicked: false,
		_mouseHeld: false,
		_mouseClickTimeout: null,
		_mouseClickLocation: [null, null],
		_mousePosition: [null, null],
		_mouseHoverTarget: null, // contains a hoverTimeout
		_clickedGroup: null,
		_hoveredGroups: []
	},
	skybox: null,
	classes: {
		_planets: {},
		_dwarfPlanets: {}
	},
	bodies: {
		_all: [],
		_sun: {},
		_dwarfPlanets: [],
		_starField: null,
		_asteroidBelt: null,
		_planetLabels: {},
		_moonLabels: {},
		_dwarfPlanetLabels: {},
		_planets: {},
		_allPlanets: [],
		_moons: [],
		_satellites: [],
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
	isDesktop: false
};

window.orrery = orrery;

export { orrery };
