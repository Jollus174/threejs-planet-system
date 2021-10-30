import { PerspectiveCamera } from 'three';

const camera = new PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);

export { camera };
