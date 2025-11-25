import React from 'react';
import { useOrrery } from '../../contexts/OrreryContext';
import Planet from './Planet';
import Sun from './Sun';
import Moon from './Moon';

const Planets: React.FC = () => {
	const { bodies } = useOrrery();

	// Don't render if bodies haven't loaded yet
	if (!bodies._allPlanets || bodies._allPlanets.length === 0) {
		return null;
	}

	return (
		<>
			{/* Render Sun */}
			{bodies._sun && <Sun data={bodies._sun} />}

			{/* Render Planets and Dwarf Planets */}
			{bodies._allPlanets.map((planetData) => (
				<React.Fragment key={planetData.id}>
					<Planet data={planetData} />
					{/* Render moons for each planet */}
					{planetData.moons &&
						Array.isArray(planetData.moons) &&
						planetData.moons.map((moonData) => {
							// Check if moonData is a BodyData object (not a MoonReference)
							if (typeof moonData === 'object' && 'id' in moonData) {
								return <Moon key={moonData.id} data={moonData} parentData={planetData} />;
							}
							return null;
						})}
				</React.Fragment>
			))}
		</>
	);
};

export default Planets;
