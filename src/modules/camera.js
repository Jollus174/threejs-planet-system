import { settings } from './settings';
import { PerspectiveCamera } from 'three';

const camera = new PerspectiveCamera(
	settings.camera._fov,
	settings.camera._aspect,
	settings.camera._near,
	settings.camera._far
);

export { camera };
