'use strict';
import * as THREE from 'three';
import { textureLoader } from '../loadManager';
import { GLTFLoader } from 'three/examples/jsm/loaders/gltfloader';
import { textLabel, text, labelLine, targetLine, orbitLine, rings, clickTarget } from '../objectProps';
import { createCircleTexture } from '../utils';
import { Color } from 'three';

// Making sure to build the moon + planet based off the data that's passed in
const buildMoon = async (moonData, planetGroup) => {
	const { diameter, segments, material } = moonData;

	const moonGroup = new THREE.Group();
	moonGroup.data = moonGroup.data || {};
	moonGroup.data.id = moonData.id;
	moonGroup.data.diameter = moonData.diameter;
	moonGroup.data.orbit = Math.random() * Math.PI * 2;
	moonGroup.data.orbitRadius = moonData.orbitRadius;
	moonGroup.data.orbitSpeed = 0.00001 / moonData.orbitRadius;
	moonGroup.data.name = moonData.name;
	moonGroup.data.zoomTo = moonData.zoomTo || moonData.diameter * 10;
	moonGroup.name = `${moonGroup.data.name} moon group`;
	moonGroup.position.set(planetGroup.position.x, planetGroup.position.y, planetGroup.position.z);

	moonGroup.textGroup = text.build(moonData, planetGroup);
	if (moonGroup.textGroup) moonGroup.add(moonGroup.textGroup);

	moonGroup.labelLine = labelLine.build(moonData);
	if (moonGroup.labelLine) moonGroup.add(moonGroup.labelLine);

	moonGroup.targetLine = targetLine.build(moonData);
	if (moonGroup.targetLine) moonGroup.add(moonGroup.targetLine);

	moonGroup.clickTarget = clickTarget.build(moonData);
	if (moonGroup.clickTarget) moonGroup.add(moonGroup.clickTarget);

	moonGroup.orbitLine = orbitLine.build(moonData);

	moonGroup.position.set(
		planetGroup.position.x + Math.cos(moonGroup.data.orbit) * moonGroup.data.orbitRadius,
		planetGroup.position.y + 0,
		planetGroup.position.z + Math.sin(moonGroup.data.orbit) * moonGroup.data.orbitRadius
	);

	material.map = material.map ? await textureLoader.loadAsync(material.map) : null;
	material.normalMap = material.normalMap ? await textureLoader.loadAsync(material.normalMap) : null;
	material.emissiveMap = material.emissiveMap ? await textureLoader.loadAsync(material.emissiveMap) : null;
	material.emissive = material.emissive ? new Color(material.emissive) : null;

	if (!moonData.modelPath) {
		const moonMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(diameter, segments, segments),
			new THREE.MeshStandardMaterial(material)
		);

		moonMesh.name = `${moonData.name} moon mesh`;
		moonGroup.add(moonMesh);
	} else {
		// if it's a custom model...
		const loader = new GLTFLoader();
		const moonObjectGLTF = await loader.loadAsync(moonData.modelPath);
		const moonObj = moonObjectGLTF.scene.children[0];
		moonObj.material.emissive = material.emissive;
		moonObj.material.emissiveIntensity = material.emissiveIntensity;

		// TODO: temp
		moonObj.scale.set(moonData.modelScale, moonData.modelScale, moonData.modelScale);
		moonGroup.add(moonObj);
	}

	return moonGroup;
};

const buildPlanet = async (planetData) => {
	const { diameter, segments, material } = planetData;
	material.map = material.map ? await textureLoader.loadAsync(material.map) : null;
	material.normalMap = material.normalMap ? await textureLoader.loadAsync(material.normalMap) : null;
	material.emissiveMap = material.emissiveMap ? await textureLoader.loadAsync(material.emissiveMap) : null;

	// create group first, label gets added here
	const planetGroup = new THREE.Group();
	// if (planetGroup.orbitLine) planetGroup.add(planetGroup.orbitLine); // this will set their coordinates incorrectly

	planetGroup.data = planetData.data || {};
	planetGroup.data.id = planetData.id;
	planetGroup.data.name = planetData.name;
	planetGroup.data.diameter = planetData.diameter;
	planetGroup.data.orbitRadius = planetData.orbitRadius;
	planetGroup.data.rotSpeed = 0.005 + Math.random() * 0.01;
	planetGroup.data.rotSpeed *= Math.random() < 0.1 ? -1 : 1;
	planetGroup.data.orbitSpeed = 0.0009 / planetGroup.data.orbitRadius;
	planetGroup.data.orbit = Math.random() * Math.PI * 2; // sets the initial position of each planet along its orbit
	planetGroup.data.zoomTo = planetData.zoomTo || planetData.diameter * 10;
	planetGroup.name = `${planetGroup.data.name} group`;
	planetGroup.rotation.y = THREE.MathUtils.randFloatSpread(360);
	planetGroup.position.set(
		Math.cos(planetGroup.data.orbit) * planetGroup.data.orbitRadius,
		0,
		Math.sin(planetGroup.data.orbit) * planetGroup.data.orbitRadius
	);
	planetGroup.data.cameraDistance = null; // to set in the render loop

	planetGroup.textLabel = textLabel.build(planetGroup);
	planetGroup.add(planetGroup.textLabel);

	planetGroup.textGroup = text.build(planetGroup);
	if (planetGroup.textGroup) planetGroup.add(planetGroup.textGroup);

	planetGroup.labelLine = labelLine.build(planetData);
	if (planetGroup.labelLine) planetGroup.add(planetGroup.labelLine);

	planetGroup.targetLine = targetLine.build(planetData);
	if (planetGroup.targetLine) planetGroup.add(planetGroup.targetLine);

	planetGroup.clickTarget = clickTarget.build(planetData);
	if (planetGroup.clickTarget) planetGroup.add(planetGroup.clickTarget);

	planetGroup.rings = rings.build(planetData);
	if (planetGroup.rings) planetGroup.rings.forEach((ring) => planetGroup.add(ring));

	planetGroup.orbitLine = orbitLine.build(planetData);

	const planetMesh = new THREE.Mesh(
		new THREE.SphereBufferGeometry(diameter, segments, segments),
		new THREE.MeshStandardMaterial(material)
	);
	planetMesh.name = `${planetData.name} mesh`;
	planetMesh.data = planetMesh.data || {};
	planetMesh.data.diameter = planetData.diameter;
	planetGroup.add(planetMesh);

	if (planetData.moons && planetData.moons.length) {
		planetGroup.moonData = planetData.moons; // storing the data here so can access outside the loop
		planetGroup.moons = [];
	}

	return planetGroup;
};

const asteroidBelt = () => {
	const particles = 4000;
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(particles * 3);

	const material = {
		size: 0.1,
		map: createCircleTexture('#FFF', 256),
		transparent: true,
		opacity: 0.5,
		color: new THREE.Color(0xffffff),
		depthWrite: false
	};

	const setAsteroidPosition = (count) => {
		const odd = count % 2;
		const distanceFromParentMin = 2;
		const distanceFromParentMax = 6;
		const distanceFromParentMedian = () => Number.parseFloat((distanceFromParentMin + distanceFromParentMax) / 2);
		const orbitScale = 12;
		const orbitRadian = 2000;
		const distance = count % 3 ? distanceFromParentMax : odd ? distanceFromParentMedian() : distanceFromParentMin;
		let d = distance * orbitScale;

		d = d + count / count.toFixed(0).length;

		const randomNumber = THREE.MathUtils.randInt(1, 30) * Math.random(); // controls spread
		const randomOffset = odd ? randomNumber * -1 : randomNumber;

		// const amplitude = d + randomOffset * (2 + Math.random());
		const amplitude = 114 + randomOffset; // will adjust the ring radius. Can apply randomness to stagger points
		const theta = count + 1 * Math.random() * THREE.MathUtils.degToRad(orbitRadian);

		const posX = amplitude * Math.cos(theta);
		const posY = amplitude * Math.sin(theta);
		const posZ = THREE.MathUtils.randInt(1, 1500);

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

	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();

	const particleSystem = new THREE.Points(geometry, new THREE.PointsMaterial({ ...material }));
	return particleSystem;
};

const skybox = (texturePaths) => {
	const skyboxMaterialArray = texturePaths.map(
		(image) => new THREE.MeshBasicMaterial({ map: textureLoader.load(image), side: THREE.BackSide })
	);
	const skybox = new THREE.Mesh(
		new THREE.BoxBufferGeometry(100000000000, 100000000000, 100000000000),
		skyboxMaterialArray
	);
	skybox.name = 'skybox';

	return skybox;
};

const starField = () => {
	const starfieldObj = new THREE.Object3D();
	starfieldObj.name = 'starfield';

	const stars = 18000,
		spreadAmount = 900;
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(stars * 3);

	const material = {
		size: 0.25,
		map: createCircleTexture('#FFF', 256),
		blending: THREE.AdditiveBlending,
		transparent: true,
		opacity: 0.4,
		color: new THREE.Color(0xffffff),
		depthWrite: false
	};

	const randFloatSpread = (x) => THREE.MathUtils.randFloatSpread(x); // to keep JS Hint happy
	for (let i = 0; i < positions.length; i += 3) {
		const [x, y, z] = Array(3)
			.fill()
			.map(() => randFloatSpread(spreadAmount));
		positions[i] = x;
		positions[i + 1] = y;
		positions[i + 2] = z;
	}

	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();
	const starFieldSystem = new THREE.Points(geometry, new THREE.PointsMaterial({ ...material }));
	starfieldObj.add(starFieldSystem);

	return starfieldObj;
};

export { skybox, starField, asteroidBelt, buildPlanet, buildMoon };
