'use strict';
import { TextureLoader, Mesh, SphereGeometry, MeshStandardMaterial } from 'three';
import sunTexture from './../img/textures/sun.jpg';

const sunMesh = new Mesh(
	new SphereGeometry(2, 40, 40),
	new MeshStandardMaterial({
		map: new TextureLoader().load(sunTexture)
	})
);

export { sunMesh as sun };
