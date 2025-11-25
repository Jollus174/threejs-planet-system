import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOrrery } from '../../contexts/OrreryContext';
import BaseEntity from './BaseEntity';
import type { BodyData } from '../../types';
import { calculateOrbit } from '../../modules/utilities/astronomy';

interface PlanetProps {
	data: BodyData;
	onPointerDown?: () => void;
}

const PLANET_RANGE_THRESHOLD = 100000000; // Distance threshold for loading textures
const TEXTURE_LOAD_DISTANCE = 500000000; // Distance at which to load textures

const Planet: React.FC<PlanetProps> = ({ data, onPointerDown }) => {
	const { camera, cameraState, dateTimeDifference, updateCameraState } = useOrrery();
	const [shouldLoadTextures, setShouldLoadTextures] = useState(false);
	const lastDistanceCheckRef = useRef<number>(0);
	const distanceCheckInterval = 500; // Check distance every 500ms

	// Check distance and update texture loading
	useFrame((state) => {
		if (!camera) return;

		const now = state.clock.getElapsedTime() * 1000; // Convert to milliseconds
		if (now - lastDistanceCheckRef.current < distanceCheckInterval) return;
		lastDistanceCheckRef.current = now;

		// Calculate planet position using the same method as BaseEntity
		const i = (dateTimeDifference * 360) / (data.sideralOrbit || 360);
		const planetPos = calculateOrbit(data.meanAnomaly - i, data, null);

		// Calculate distance from camera to planet
		const distance = camera.position.distanceTo(planetPos);

		// Determine if we should load textures based on distance
		const shouldLoad = distance < TEXTURE_LOAD_DISTANCE;

		if (shouldLoad !== shouldLoadTextures) {
			setShouldLoadTextures(shouldLoad);

			// Update camera state if planet is in range
			if (shouldLoad && distance < PLANET_RANGE_THRESHOLD) {
				updateCameraState({ _currentPlanetInRange: data.id });
			} else if (!shouldLoad || distance >= PLANET_RANGE_THRESHOLD) {
				if (cameraState._currentPlanetInRange === data.id) {
					updateCameraState({ _currentPlanetInRange: '' });
				}
			}
		}
	});

	return (
		<BaseEntity
			data={data}
			orbitLineVisible={true}
			orbitLineOpacity={0.5}
			onPointerDown={onPointerDown}
			loadTextures={shouldLoadTextures}
		/>
	);
};

export default Planet;
