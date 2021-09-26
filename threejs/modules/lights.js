'use strict';
import { PointLight, AmbientLight, PointLightHelper } from 'three';
const pointLight = new PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new AmbientLight(0xffffff);
const lightHelper = new PointLightHelper(pointLight);

export { pointLight, ambientLight, lightHelper };
