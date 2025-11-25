import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, BufferGeometry, LineDashedMaterial, Color, Vector3, MathUtils } from 'three';
import type { BodyData } from '../../types';

interface EquatorLineProps {
	data: BodyData;
	visible: boolean;
	diameter: number;
}

const EquatorLine: React.FC<EquatorLineProps> = ({ data, visible, diameter }) => {
	const lineRef = useRef<Line>(null);

	const geometry = useMemo(() => {
		const equatorPoints = [];
		for (let theta = 0; theta < 360; theta++) {
			const r = diameter * 1.1;
			const x = Math.sin(MathUtils.degToRad(theta * -1)) * r;
			const z = Math.cos(MathUtils.degToRad(theta)) * r;
			equatorPoints.push(new Vector3(x, 0, z));
		}
		const geom = new BufferGeometry().setFromPoints(equatorPoints);
		return geom;
	}, [diameter]);

	const color = useMemo(
		() => ((data.sideralRotation ?? 0) >= 0 ? new Color(0.933, 0.4, 0.4) : new Color(0.2, 0.8, 0.933)),
		[data.sideralRotation]
	);

	const material = useMemo(
		() =>
			new LineDashedMaterial({
				color,
				visible,
				scale: 10 / diameter,
				dashSize: 3,
				gapSize: 2,
				transparent: true,
				opacity: 0.3
			}),
		[color, visible, diameter]
	);

	useEffect(() => {
		if (lineRef.current) {
			lineRef.current.computeLineDistances();
		}
	}, []);

	useFrame((state) => {
		if (lineRef.current) {
			lineRef.current.rotation.y = state.clock.getElapsedTime() * (-1 / 50);
		}
	});

	const lineObject = useMemo(() => {
		const line = new Line(geometry, material);
		line.name = `${data.id} equator line`;
		return line;
	}, [geometry, material, data.id]);

	return <primitive ref={lineRef} object={lineObject} />;
};

export default EquatorLine;
