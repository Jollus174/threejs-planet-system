import { scene } from './scene';
import { controls } from './controls';
import { camera } from './camera';

const state = {
	scene,
	controls,
	camera,
	cameraState: {
		_easeToTarget: false,
		_zoomToTarget: false,
		_dollySpeed: null
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
	bodies: {
		_sun: null,
		_starField: null,
		_asteroidBelt: null,
		_planetGroups: [],
		_moonGroups: [],
		_orbitLines: [],
		_labelLines: [],
		_targetLines: [],
		_textGroups: []
	},
	orbitLines: {
		_orbitLinesVisible: true
	},
	lights: {},
	isDesktop: false
};

export { state };
