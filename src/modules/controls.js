// custom OrbitControls so can expose the dollyIn() / dollyOut() functions
import { OrbitControls } from './custom/jsm/controls/OrbitControls';
import { camera } from './camera';
import { settings } from './settings';
import { labelRenderer } from './renderers/labelRenderer';

const controls = new OrbitControls(camera, labelRenderer.domElement);

controls.minDistance = settings.controls._minDistance;
controls.maxDistance = settings.controls._maxDistance;
controls.enableDamping = settings.controls._enableDamping;
controls.dampingFactor = settings.controls._dampingFactor;
controls.enableKeys = settings.controls._enableKeys;
controls.minPolarAngle = settings.controls._minPolarAngle;
controls.maxPolarAngle = settings.controls._maxPolarAngle;

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
