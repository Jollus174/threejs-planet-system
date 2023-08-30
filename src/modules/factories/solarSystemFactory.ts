'use strict';
import {
	AdditiveBlending,
	BackSide,
	BoxGeometry,
	BufferAttribute,
	BufferGeometry,
	Color,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Points,
	PointsMaterial
} from 'three';
import { textureLoader } from '../loadManager';
import { createCircleTexture } from '../utilities/threeJS';

import spaceFt from '/img/textures/space_ft.jpg';
import spaceBk from '/img/textures/space_bk.jpg';
import spaceUp from '/img/textures/space_up.jpg';
import spaceDn from '/img/textures/space_dn.jpg';
import spaceRt from '/img/textures/space_rt.jpg';
import spaceLt from '/img/textures/space_lt.jpg';

const asteroidBelt = () => {
	const particles = 4000;
	const geometry = new BufferGeometry();
	const positions = new Float32Array(particles * 3);

	const material = {
		size: 0.1,
		map: createCircleTexture('#FFF', 256),
		transparent: true,
		opacity: 0.5,
		color: new Color(0xffffff),
		depthWrite: false
	};

	const setAsteroidPosition = (count: number) => {
		const odd = count % 2;
		const distanceFromParentMin = 2;
		const distanceFromParentMax = 6;
		const distanceFromParentMedian = () => (distanceFromParentMin + distanceFromParentMax) / 2;
		const orbitScale = 12;
		const orbitRadian = 2000;
		const distance = count % 3 ? distanceFromParentMax : odd ? distanceFromParentMedian() : distanceFromParentMin;
		let d = distance * orbitScale;

		d = d + count / count.toFixed(0).length;

		const randomNumber = MathUtils.randInt(1, 30) * Math.random(); // controls spread
		const randomOffset = odd ? randomNumber * -1 : randomNumber;

		// const amplitude = d + randomOffset * (2 + Math.random());
		const amplitude = 114 + randomOffset; // will adjust the ring radius. Can apply randomness to stagger points
		const theta = count + 1 * Math.random() * MathUtils.degToRad(orbitRadian);

		const posX = amplitude * Math.cos(theta);
		const posY = amplitude * Math.sin(theta);
		const posZ = MathUtils.randInt(1, 1500);

		return {
			x: posX,
			y: posY,
			z: odd ? posZ * -1 : posZ
		};
	};

	for (let i = 0; i < positions.length; i += 3) {
		const { x, y, z } = setAsteroidPosition(i);
		positions[i] = x;
		positions[i + 2] = y;
		positions[i + 3] = z;
	}

	geometry.setAttribute('position', new BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();

	const particleSystem = new Points(geometry, new PointsMaterial({ ...material }));
	return particleSystem;
};

const skybox = () => {
	const skyboxTexturePaths = [spaceFt, spaceBk, spaceUp, spaceDn, spaceRt, spaceLt];
	const skyboxMaterialArray = skyboxTexturePaths.map((image) => {
		return new MeshBasicMaterial({
			map: textureLoader.load(image),
			side: BackSide,
			depthTest: false // needed or else will appear in front of shaders
		});
	});
	const skybox = new Mesh(new BoxGeometry(1000000000000, 1000000000000, 1000000000000), skyboxMaterialArray);
	skybox.name = 'skybox';

	return skybox;
};

const starField = () => {
	const starfieldObj = new Object3D();
	starfieldObj.name = 'starfield';

	const stars = 18000,
		spreadAmount = 900;
	const geometry = new BufferGeometry();
	const positions = new Float32Array(stars * 3);

	const material = {
		size: 0.25,
		map: createCircleTexture('#FFF', 256),
		blending: AdditiveBlending,
		transparent: true,
		opacity: 0.4,
		color: new Color(0xffffff),
		depthWrite: false
	};

	const randFloatSpread = (x: number) => MathUtils.randFloatSpread(x);
	for (let i = 0; i < positions.length; i += 3) {
		const [x, y, z] = Array(3)
			// .fill()
			.map(() => randFloatSpread(spreadAmount));
		positions[i] = x;
		positions[i + 1] = y;
		positions[i + 2] = z;
	}

	geometry.setAttribute('position', new BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();
	const starFieldSystem = new Points(geometry, new PointsMaterial({ ...material }));
	starfieldObj.add(starFieldSystem);

	return starfieldObj;
};

export { skybox, starField, asteroidBelt };