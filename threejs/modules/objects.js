'use strict';
import { TorusGeometry, Mesh, MeshStandardMaterial, SphereGeometry, AdditiveBlending, Color } from 'three';

const torus = new Mesh(new TorusGeometry(10, 3, 16, 100), new MeshStandardMaterial({ color: 0xff6347 }));

const star = {
	geometry: new SphereGeometry(0.015, 16, 16),
	material: {
		blending: AdditiveBlending,
		transparent: true,
		emissive: new Color(0xffffff),
		emissiveIntensity: 0.5
	}
};

export { torus, star };
