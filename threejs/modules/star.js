'use strict';
import * as THREE from 'three';

const star = new THREE.Mesh(
	new THREE.SphereGeometry(0.25, 24, 24),
	new THREE.MeshStandardMaterial({ color: 0xffffff })
);

const [x, y, z] = Array(3)
	.fill()
	.map(() => THREE.MathUtils.randFloatSpread(100));
star.position.set(x, y, z);

console.log(x, y, z);

export { star as star_test };
