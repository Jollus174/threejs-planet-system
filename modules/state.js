import { scene } from './scene';
import { controls } from './controls';
import { camera } from './camera';

const state = {
	scene,
	controls,
	camera,
	cameraState: {
		_zoomToTarget: false,
		_dollySpeed: null,
		_rotateToTarget: false,
		_rotateCameraYTo: null,
		_currentZoomDistanceThreshold: 0
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
	bodies: {
		_bodiesAll: [],
		_sun: {},
		_dwarfPlanets: [],
		_starField: null,
		_asteroidBelt: null,
		_planetLabels: [],
		_moonLabels: [],
		_dwarfPlanetLabels: [],
		// _planetGroups: [],
		_planets: [],
		_moons: [],
		_satellites: [],
		_orbitLines: [],
		_labelLines: [],
		_targetLines: [],
		_textGroups: [],
		_textLabels: [],
		_navigable: [],
		_inRange: [],
		classes: {
			_planetLabels: []
		}
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

export { state };
