// @ts-ignore
// custom OrbitControls so can expose the dollyIn() / dollyOut() functions
import { OrbitControls } from '/custom/jsm/controls/OrbitControls.js';

import { camera } from './camera';
import { Settings } from './settings';
import { labelRenderer } from './renderers/labelRenderer';

const controls = new OrbitControls(camera, labelRenderer.domElement);

controls.minDistance = Settings.controls._minDistance;
controls.maxDistance = Settings.controls._maxDistance;
controls.enableDamping = Settings.controls._enableDamping;
controls.dampingFactor = Settings.controls._dampingFactor;
controls.enableKeys = Settings.controls._enableKeys;
controls.minPolarAngle = Settings.controls._minPolarAngle;
controls.maxPolarAngle = Settings.controls._maxPolarAngle;

controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW',
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS',
	IN: 'KeyF',
	OUT: 'KeyV'
};
// controls.listenToKeyEvents(document.querySelector('#bg'));

export { controls };
