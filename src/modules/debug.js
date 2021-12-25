'use strict';
import * as THREE from 'three';
import { orrery } from './orrery';

const createBasicCube = () => {
	const vertexShader = () => {
		return `
      varying vec3 vUv; 
  
      void main() {
        vUv = position; 
  
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition; 
      }
    `;
	};

	const fragmentShader = () => {
		return `
        uniform vec3 colorA; 
        uniform vec3 colorB; 
        varying vec3 vUv;
  
        void main() {
          gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
        }
    `;
	};

	const geometry = new THREE.BoxBufferGeometry(100000000, 100000000, 100000000, 10, 10);
	// const material = new THREE.MeshBasicMaterial();
	const material = new THREE.ShaderMaterial({
		uniforms: {
			colorA: { type: 'vec3', value: new THREE.Color(0xff0000) },
			colorB: { type: 'vec3', value: new THREE.Color(0x0000ff) }
		},
		// vertexShader: simpleVertexShader,
		// fragmentShader: simpleFragmentShader
		vertexShader: vertexShader(),
		fragmentShader: fragmentShader()
	});

	const boxMesh = new THREE.Mesh(geometry, material);

	orrery.scene.add(boxMesh);
};
