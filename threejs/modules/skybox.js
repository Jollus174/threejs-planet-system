'use strict';
import { TextureLoader, MeshBasicMaterial, BoxGeometry, Mesh, BackSide } from 'three';
import spaceFt from './../img/textures/space_ft.jpg';
import spaceBk from './../img/textures/space_bk.jpg';
import spaceUp from './../img/textures/space_up.jpg';
import spaceDn from './../img/textures/space_dn.jpg';
import spaceRt from './../img/textures/space_rt.jpg';
import spaceLt from './../img/textures/space_lt.jpg';

const textureLoader = new TextureLoader();
const materialPaths = [spaceFt, spaceBk, spaceUp, spaceDn, spaceRt, spaceLt];
const materialArray = materialPaths.map(
	(image) => new MeshBasicMaterial({ map: textureLoader.load(image), side: BackSide })
);

const skybox = new Mesh(new BoxGeometry(1200, 1200, 1200), materialArray);
skybox.name = 'skybox';

export { skybox };
