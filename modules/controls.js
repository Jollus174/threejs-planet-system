// custom OrbitControls so can expose the dollyIn() / dollyOut() functions
import { OrbitControls } from './custom/jsm/controls/OrbitControls';
import { camera } from './camera';
import { renderer } from './renderer';

// window.controls = state.controls;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.1;
controls.maxDistance = 650;
controls.enableKeys = true;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 2.5;
controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW',
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS',
	IN: 'KeyF',
	OUT: 'KeyV'
};
controls.listenToKeyEvents(document);

export { controls };
