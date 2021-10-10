'use strict';
import * as THREE from 'three';

const asteroidBeltHelper = {
	geometry: new THREE.RingGeometry(20, 23, 90),
	material: {
		color: new THREE.Color(0xfffffff),
		transparent: true
	}
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

	const randomNumber = THREE.MathUtils.randInt(1, 8) * Math.random(); // controls spread
	const randomOffset = odd ? randomNumber * -1 : randomNumber;

	// const amplitude = d + randomOffset * (2 + Math.random());
	const amplitude = 92 + randomOffset; // will adjust the ring radius. Can apply randomness to stagger points
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

export { asteroidBeltHelper, setAsteroidPosition };
