'use strict';
import * as THREE from 'three';
import { orrery } from './orrery';
import vertexShader from './shaders/debug/simpleVertexShader.glsl';
import fragmentShader from './shaders/debug/simpleFragmentShader.glsl';

const createBasicCube = () => {
	const geometry = new THREE.BoxGeometry(100000000, 100000000, 100000000, 10, 10);
	const materials = {
		shaderMaterial: new THREE.ShaderMaterial({
			uniforms: {
				colorA: { type: 'vec3', value: new THREE.Color(0xff0000) },
				colorB: { type: 'vec3', value: new THREE.Color(0x0000ff) }
			},
			vertexShader,
			fragmentShader
		}),
		basicMaterial: new THREE.MeshBasicMaterial()
	};

	const boxMesh = new THREE.Mesh(geometry, materials.shaderMaterial);
	orrery.scene.add(boxMesh);
};

export { createBasicCube };
