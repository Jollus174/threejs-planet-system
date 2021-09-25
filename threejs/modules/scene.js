'use strict';
import * as THREE from 'three';

const scene = new THREE.Scene();
const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

export { scene };
