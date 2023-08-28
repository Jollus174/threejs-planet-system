'use strict';
import { PointLight, PointLightHelper, SpotLight, SpotLightHelper, AmbientLight } from 'three';

// TODO: any
const pointLights = (addHelper = false) => {
	const pointLights = [],
		pointLightHelpers = [];

	for (let i = 0; i < 1; i++) {
		const pointLight = new PointLight(0xffffff, 0.8, 0);
		pointLight.position.set(0, 0, 0);
		pointLights.push(pointLight);

		if (addHelper) pointLightHelpers.push(new PointLightHelper(pointLight));
	}

	return [pointLights, pointLightHelpers];
};

const spotLights = (addHelper = false) => {
	const spotLights = [],
		spotLightHelpers = [];

	for (let i = 0; i < 5; i++) {
		const settings = {
			color: 0xffffff,
			intensity: 0.5,
			distance: 0,
			angle: Math.PI / 3,
			penumbra: 1
		};
		const { color, intensity, distance, angle, penumbra } = settings;
		const spotLight = new SpotLight(color, intensity, distance, angle, penumbra);
		const positionAdjuster = i % 2 === 0 ? 10 : -10;

		spotLight.position.set(
			i < 2 ? positionAdjuster : 0,
			i >= 2 && i < 3 ? positionAdjuster : 0,
			i >= 3 ? positionAdjuster : 0
		);
		spotLights.push(spotLight);

		if (addHelper) spotLightHelpers.push(new SpotLightHelper(spotLight));
	}
	return [spotLights, spotLightHelpers];
};

const ambientLights = () => {
	const ambientLights = [];
	ambientLights.push(new AmbientLight(0x090909, 8));

	return [ambientLights];
};

export { pointLights, spotLights, ambientLights };
