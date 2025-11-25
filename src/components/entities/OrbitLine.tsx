import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, BufferGeometry, LineBasicMaterial, Color, BufferAttribute, AdditiveBlending } from 'three';
import { calculateOrbit } from '../../modules/utilities/astronomy';
import { useOrrery } from '../../contexts/OrreryContext';
import type { BodyData } from '../../types';

interface OrbitLineProps {
	data: BodyData;
	parentData: BodyData | null;
	visible: boolean;
	opacity: number;
	onHover?: () => void;
	onUnhover?: () => void;
}

const OrbitLine: React.FC<OrbitLineProps> = ({ data, parentData, visible, opacity, onHover, onUnhover }) => {
	const lineRef = useRef<Line>(null);
	const geometryRef = useRef<BufferGeometry | null>(null);
	const vertexCountRef = useRef<number | null>(null);
	const colorsRef = useRef<Float32Array | null>(null);

	const amountOfOrbitToDraw = data.bodyType === 'Moon' ? 180 : 330;
	const startColor = useMemo(
		() => new Color(data.moonGroupColor || data.labelColour),
		[data.moonGroupColor, data.labelColour]
	);
	const endColor = useMemo(() => new Color('black'), []);

	const setColors = (geometry: BufferGeometry, vertexCount: number) => {
		const lerpAcc = data.bodyType === 'Moon' ? 0.75 : 1;
		const lerpIncrementer = 1 / amountOfOrbitToDraw / lerpAcc;
		const colors = colorsRef.current || new Float32Array(vertexCount * 3);
		colorsRef.current = colors;

		if (data.sideralOrbitDirection === 'Prograde') {
			for (let c = amountOfOrbitToDraw; c >= 0; c -= 1) {
				const lerpColor = new Color(startColor);
				lerpColor.lerpColors(startColor, endColor, c * lerpIncrementer);
				colors[c * 3 + 0] = lerpColor.r;
				colors[c * 3 + 1] = lerpColor.g;
				colors[c * 3 + 2] = lerpColor.b;
			}
		} else {
			for (let c = 0; c <= amountOfOrbitToDraw; c += 1) {
				const lerpColor = new Color(startColor);
				lerpColor.lerpColors(startColor, endColor, c * lerpIncrementer);
				colors[c * 3 + 0] = lerpColor.r;
				colors[c * 3 + 1] = lerpColor.g;
				colors[c * 3 + 2] = lerpColor.b;
			}
		}

		geometry.setAttribute('color', new BufferAttribute(colors, 3));
	};

	const drawLine = (iterator: number = 0): BufferGeometry => {
		const orbitPoints = [];
		for (
			let theta = data.meanAnomaly - iterator;
			theta <= data.meanAnomaly + amountOfOrbitToDraw - iterator;
			theta += 1
		) {
			orbitPoints.push(calculateOrbit(theta, data, parentData));
		}

		// Reuse geometry if it exists, just update positions
		let geometry = geometryRef.current;
		if (!geometry) {
			geometry = new BufferGeometry();
			geometryRef.current = geometry;
		}

		geometry.setFromPoints(orbitPoints);
		const vertexCount = geometry.getAttribute('position').count;
		vertexCountRef.current = vertexCount;

		setColors(geometry, vertexCount);
		return geometry;
	};

	// Initial geometry creation
	const initialGeometry = useMemo(() => drawLine(0), []);

	// Material
	const material = useMemo(
		() =>
			new LineBasicMaterial({
				transparent: true,
				opacity,
				visible,
				blending: AdditiveBlending,
				vertexColors: true
			}),
		[opacity, visible]
	);

	const { dateTimeDifference } = useOrrery();
	const lastUpdateRef = useRef<number>(0);
	const updateThreshold = 1; // Only update if the change is significant enough (1 degree)

	// Update geometry in render loop - throttled to prevent excessive updates
	useFrame(() => {
		if (!lineRef.current || !visible) return;

		const i = (dateTimeDifference * 360) / (data.sideralOrbit || 360);
		// Only update if the change is significant enough to warrant a redraw
		const change = Math.abs(i - lastUpdateRef.current);

		if (change > updateThreshold) {
			drawLine(i);
			// Update the line's geometry reference if needed
			if (lineRef.current.geometry !== geometryRef.current && geometryRef.current) {
				lineRef.current.geometry = geometryRef.current;
			}
			lastUpdateRef.current = i;
		}
	});

	// Update material opacity
	useEffect(() => {
		if (material) {
			material.opacity = opacity;
			material.visible = visible;
		}
	}, [opacity, visible, material]);

	const lineObject = useMemo(() => {
		const line = new Line(initialGeometry, material);
		line.name = `${data.id} orbit line`;
		return line;
	}, [initialGeometry, material, data.id]);

	return <primitive ref={lineRef} object={lineObject} onPointerOver={onHover} onPointerOut={onUnhover} />;
};

export default OrbitLine;
