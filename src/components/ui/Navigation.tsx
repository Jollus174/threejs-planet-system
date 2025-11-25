import React, { useMemo } from 'react';
import { useOrrery } from '../../contexts/OrreryContext';
import type { BodyData } from '../../types';

const Navigation: React.FC = () => {
	const { mouseState, updateMouseState, bodies } = useOrrery();
	const clickedEntity = mouseState._clickedEntity;

	const currentSystem = clickedEntity
		? clickedEntity.bodyType === 'Star'
			? `The <span class="text-system-color">${clickedEntity.displayName}</span>`
			: `<span class="text-system-color">${clickedEntity.systemName}</span> System`
		: 'Solar System';

	// Build navigation array: Sun -> Planets (sorted by distance) -> Dwarf Planets (sorted by distance)
	const navigationEntities = useMemo(() => {
		const entities: BodyData[] = [];

		// Add Sun first
		if (bodies._sun) {
			entities.push(bodies._sun);
		}

		// Add planets sorted by semimajorAxis (distance from sun)
		const sortedPlanets = [...bodies.types._planet].sort((a, b) => a.semimajorAxis - b.semimajorAxis);
		entities.push(...sortedPlanets);

		// Add dwarf planets sorted by semimajorAxis
		const sortedDwarfPlanets = [...bodies.types._dwarfPlanet].sort((a, b) => a.semimajorAxis - b.semimajorAxis);
		entities.push(...sortedDwarfPlanets);

		return entities;
	}, [bodies]);

	const goToPreviousSystem = () => {
		if (!clickedEntity || navigationEntities.length === 0) return;

		// If the clicked entity is a moon, find its parent planet/system
		let entityToNavigate = clickedEntity;
		if (clickedEntity.bodyType === 'Moon' && clickedEntity.systemId) {
			// Find the parent planet/system
			const parentSystem = navigationEntities.find((entity) => entity.systemId === clickedEntity.systemId);
			if (parentSystem) {
				entityToNavigate = parentSystem;
			}
		}

		const currentIndex = navigationEntities.findIndex((entity) => entity.id === entityToNavigate.id);
		if (currentIndex === -1) return;

		// Go to previous entity, wrapping to the end if at the start
		const previousIndex = currentIndex === 0 ? navigationEntities.length - 1 : currentIndex - 1;
		const previousEntity = navigationEntities[previousIndex];

		updateMouseState({
			_clickedEntity: previousEntity,
			_selectedEntity: previousEntity
		});
	};

	const goToNextSystem = () => {
		if (!clickedEntity || navigationEntities.length === 0) return;

		// If the clicked entity is a moon, find its parent planet/system
		let entityToNavigate = clickedEntity;
		if (clickedEntity.bodyType === 'Moon' && clickedEntity.systemId) {
			// Find the parent planet/system
			const parentSystem = navigationEntities.find((entity) => entity.systemId === clickedEntity.systemId);
			if (parentSystem) {
				entityToNavigate = parentSystem;
			}
		}

		const currentIndex = navigationEntities.findIndex((entity) => entity.id === entityToNavigate.id);
		if (currentIndex === -1) return;

		// Go to next entity, wrapping to the start if at the end
		const nextIndex = currentIndex === navigationEntities.length - 1 ? 0 : currentIndex + 1;
		const nextEntity = navigationEntities[nextIndex];

		updateMouseState({
			_clickedEntity: nextEntity,
			_selectedEntity: nextEntity
		});
	};

	return (
		<div className="system-container">
			<button type="button" className="btn btn-rounded" onClick={goToPreviousSystem}>
				<i className="fas fa-angle-left"></i>
			</button>
			<h2 className="h2" dangerouslySetInnerHTML={{ __html: currentSystem }}></h2>
			<button type="button" className="btn btn-rounded" onClick={goToNextSystem}>
				<i className="fas fa-angle-right"></i>
			</button>
		</div>
	);
};

export default Navigation;
