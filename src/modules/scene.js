import { Scene, Color } from 'three';

const scene = new Scene();
scene.background = new Color('grey');
window.scene = scene;

export { scene };
