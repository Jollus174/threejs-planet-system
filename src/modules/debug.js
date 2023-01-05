'use strict';
import * as THREE from 'three';
import { orrery } from './orrery';
import vertexShader from './shaders/debug/simpleVertexShader.glsl';
import fragmentShader from './shaders/debug/simpleFragmentShader.glsl';

const createBasicCube = () => {
	const geometry = new THREE.BoxGeometry(100000000, 100000000, 100000000, 10, 10);
	const material = new THREE.ShaderMaterial({
		uniforms: {
			colorA: { type: 'vec3', value: new THREE.Color(0xff0000) },
			colorB: { type: 'vec3', value: new THREE.Color(0x0000ff) }
		},
		vertexShader,
		fragmentShader
	});

	const boxMesh = new THREE.Mesh(geometry, material);
	orrery.scene.add(boxMesh);
};

export { createBasicCube };
