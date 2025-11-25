import React, { useMemo } from 'react';
import { BufferGeometry, BufferAttribute, PointsMaterial, MathUtils, AdditiveBlending } from 'three';
import { createCircleTexture } from '../../modules/utilities/threeJS';

const StarField: React.FC = () => {
	const { geometry, material } = useMemo(() => {
		const stars = 18000;
		const spreadAmount = 900;
		const geometry = new BufferGeometry();
		const positions = new Float32Array(stars * 3);

		for (let i = 0; i < positions.length; i += 3) {
			const [x, y, z] = Array(3)
				.fill(0)
				.map(() => MathUtils.randFloatSpread(spreadAmount));
			positions[i] = x;
			positions[i + 1] = y;
			positions[i + 2] = z;
		}

		geometry.setAttribute('position', new BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();

		const material = new PointsMaterial({
			size: 0.25,
			map: createCircleTexture('#FFF', 256),
			blending: AdditiveBlending,
			transparent: true,
			opacity: 0.4,
			color: 0xffffff,
			depthWrite: false
		});

		return { geometry, material };
	}, []);

	return (
		<group name="starfield">
			<points geometry={geometry} material={material} />
		</group>
	);
};

export default StarField;
