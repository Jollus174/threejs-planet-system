'use strict';
import { TextureLoader, MeshBasicMaterial, BoxGeometry, Mesh, BackSide } from 'three';

const textureLoader = new TextureLoader();
const materialPaths = [
	'img/textures/space_ft.png',
	'img/textures/space_bk.png',
	'img/textures/space_up.png',
	'img/textures/space_dn.png',
	'img/textures/space_rt.png',
	'img/textures/space_lt.png'
];
const materialArray = materialPaths.map(
	(image) => new MeshBasicMaterial({ map: textureLoader.load(image), side: BackSide })
);

const skybox = new Mesh(new BoxGeometry(1200, 1200, 1200), materialArray);
skybox.name = 'skybox';

export { skybox };
