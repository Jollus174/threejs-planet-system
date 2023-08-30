import { Scene, Color } from 'three';

declare global {
	interface Window {
		scene: Scene;
		orrery: any;
	}
}

const scene = new Scene();
scene.background = new Color('grey');
window.scene = scene;

export { scene };
