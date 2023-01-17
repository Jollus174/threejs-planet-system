'use strict';
import * as THREE from 'three';
import { orrery } from './orrery';
import vertexShader from './shaders/debug/vertexShader.glsl';
import fragmentShader from './shaders/debug/fragmentShader.glsl';

const materials = {
	shaderMaterial: new THREE.ShaderMaterial({
		uniforms: {
			logDepthBuffFC: {
				value: 2.0 / (Math.log(orrery.camera.far + 1.0) / Math.LN2)
			}
		},
		vertexShader,
		fragmentShader,
		transparent: false
	}),
	basicMaterial: new THREE.MeshBasicMaterial({
		color: new THREE.Color('purple')
	})
};

const createBasicCube = (size) => {
	const geometry = new THREE.BoxGeometry(size, size, size, 10, 10);

	const boxMesh = new THREE.Mesh(geometry, materials.shaderMaterial);
	boxMesh.name = 'debug cube';
	orrery.scene.add(boxMesh);
};

const createBasicSphere = (size) => {
	const geometry = new THREE.SphereGeometry(size, 64, 64);

	const boxMesh = new THREE.Mesh(geometry, materials.shaderMaterial);
	boxMesh.name = 'debug sphere';
	orrery.scene.add(boxMesh);
};

export { createBasicCube, createBasicSphere };
