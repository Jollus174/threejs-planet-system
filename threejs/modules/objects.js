'use strict';
import {
	TorusGeometry,
	Mesh,
	MeshStandardMaterial,
	SphereBufferGeometry,
	AdditiveBlending,
	Color,
	RingGeometry
} from 'three';

const torus = new Mesh(new TorusGeometry(10, 3, 16, 100), new MeshStandardMaterial({ color: 0xff6347 }));

const star = {
	geometry: new SphereBufferGeometry(0.015, 16, 16),
	material: {
		blending: AdditiveBlending,
		transparent: true,
		emissive: new Color(0xffffff),
		emissiveIntensity: 0.5
	}
};

const asteroidBelt = {
	geometry: new RingGeometry(20, 23, 90),
	material: {
		color: new Color(0xfffffff),
		transparent: true
	}
};

export { torus, star, asteroidBelt };
