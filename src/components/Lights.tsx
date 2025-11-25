import React from 'react';
import { PointLight, AmbientLight } from 'three';
import { useOrrery } from '../contexts/OrreryContext';

const Lights: React.FC = () => {
	const { lights } = useOrrery();

	return (
		<>
			{/* Point Lights */}
			{lights._pointLights.map((lightGroup, groupIndex) =>
				lightGroup.map((light: PointLight, lightIndex: number) => (
					<primitive key={`point-${groupIndex}-${lightIndex}`} object={light} />
				))
			)}

			{/* Ambient Lights */}
			{lights._ambientLights.map((lightGroup, groupIndex) =>
				lightGroup.map((light: AmbientLight, lightIndex: number) => (
					<primitive key={`ambient-${groupIndex}-${lightIndex}`} object={light} />
				))
			)}

			{/* Spot Lights - if needed */}
			{lights._spotLights.map((lightGroup, groupIndex) =>
				lightGroup.map((light, lightIndex: number) => (
					<primitive key={`spot-${groupIndex}-${lightIndex}`} object={light} />
				))
			)}
		</>
	);
};

export default Lights;
