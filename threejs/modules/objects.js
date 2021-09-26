'use strict';
import { TorusGeometry, Mesh, MeshStandardMaterial, SphereGeometry, TextureLoader, AdditiveBlending } from 'three';

const torus = new Mesh(new TorusGeometry(10, 3, 16, 100), new MeshStandardMaterial({ color: 0xff6347 }));

const star = {
	geometry: new SphereGeometry(0.019, 16, 16),
	material: {
		blending: AdditiveBlending,
		transparent: true
	}
};

export { torus, star };
