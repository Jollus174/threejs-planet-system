import React, { useMemo } from 'react';
import { BufferGeometry, BufferAttribute, PointsMaterial, MathUtils } from 'three';
import { createCircleTexture } from '../../modules/utilities/threeJS';

const AsteroidBelt: React.FC = () => {
	const { geometry, material } = useMemo(() => {
		const particles = 4000;
		const geometry = new BufferGeometry();
		const positions = new Float32Array(particles * 3);

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
			positions[i + 1] = y;
			positions[i + 2] = z;
		}

		geometry.setAttribute('position', new BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();

		const material = new PointsMaterial({
			size: 0.1,
			map: createCircleTexture('#FFF', 256),
			transparent: true,
			opacity: 0.5,
			color: 0xffffff,
			depthWrite: false
		});

		return { geometry, material };
	}, []);

	return <points geometry={geometry} material={material} name="asteroidBelt" />;
};

export default AsteroidBelt;
