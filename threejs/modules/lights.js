'use strict';
import * as THREE from 'three';

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
const lightHelper = new THREE.PointLightHelper(pointLight);

export { pointLight, ambientLight, lightHelper };
