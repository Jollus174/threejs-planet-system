import { Scene, Color } from 'three';
import { Settings } from './settings';
import { Orrery } from './orrery';

declare global {
	interface Window {
		scene: Scene;
		orrery: typeof Orrery;
		settings: typeof Settings;
		renderLoop: () => void | null;
	}
}

const scene = new Scene();
scene.background = new Color('grey');
window.scene = scene;

export { scene };
