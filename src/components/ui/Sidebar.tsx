import React, { useState, useMemo } from 'react';
import { useOrrery } from '../../contexts/OrreryContext';
import Tabs from './Tabs';
import type { BodyData } from '../../types';

const Sidebar: React.FC = () => {
	const { mouseState, updateMouseState, bodies } = useOrrery();
	const [vueRandomString] = useState(() => Math.random().toString(36).substring(2, 10));

	const clickedEntity = mouseState._clickedEntity;

	// Build navigation array: Planet -> Planet's Moons (in order) -> Next Planet -> Next Planet's Moons -> etc.
	// Moons are already sorted by moonGroupIndex, then by semimajorAxis (closest to farthest)
	const navigationEntities = useMemo(() => {
		const entities: BodyData[] = [];

		// Combine planets and dwarf planets, sorted by semimajorAxis
		const allPlanets = [...bodies.types._planet, ...bodies.types._dwarfPlanet].sort(
			(a, b) => a.semimajorAxis - b.semimajorAxis
		);

		// For each planet, add the planet followed by all its moons
		for (const planet of allPlanets) {
			// Add the planet
			entities.push(planet);

			// Add all moons for this planet (already sorted by moonGroupIndex, then semimajorAxis)
			if (planet.moons && Array.isArray(planet.moons) && planet.moons.length > 0) {
				for (const moon of planet.moons) {
					if (moon && typeof moon === 'object' && 'id' in moon) {
						entities.push(moon as BodyData);
					}
				}
			}
		}

		return entities;
	}, [bodies]);

	const goToPreviousEntity = () => {
		if (!clickedEntity || navigationEntities.length === 0) return;

		const currentIndex = navigationEntities.findIndex((entity) => entity.id === clickedEntity.id);
		if (currentIndex === -1) return;

		// If we're on a planet (not a moon), go to the previous planet's last moon
		if (clickedEntity.bodyType !== 'Moon') {
			// Find the previous planet
			let previousPlanetIndex = currentIndex - 1;
			while (previousPlanetIndex >= 0 && navigationEntities[previousPlanetIndex].bodyType === 'Moon') {
				previousPlanetIndex--;
			}

			// If we found a previous planet
			if (previousPlanetIndex >= 0) {
				const previousPlanet = navigationEntities[previousPlanetIndex];
				// Check if this planet has moons by looking at the next entity
				const nextEntityIndex = previousPlanetIndex + 1;
				if (
					nextEntityIndex < navigationEntities.length &&
					navigationEntities[nextEntityIndex].bodyType === 'Moon' &&
					navigationEntities[nextEntityIndex].systemId === previousPlanet.systemId
				) {
					// This planet has moons, find the last one
					let lastMoonIndex = nextEntityIndex;
					while (
						lastMoonIndex + 1 < navigationEntities.length &&
						navigationEntities[lastMoonIndex + 1].bodyType === 'Moon' &&
						navigationEntities[lastMoonIndex + 1].systemId === previousPlanet.systemId
					) {
						lastMoonIndex++;
					}
					// Go to the last moon
					const lastMoon = navigationEntities[lastMoonIndex];
					updateMouseState({
						_clickedEntity: lastMoon,
						_selectedEntity: lastMoon
					});
					return;
				} else {
					// This planet has no moons, go to the planet itself
					updateMouseState({
						_clickedEntity: previousPlanet,
						_selectedEntity: previousPlanet
					});
					return;
				}
			}

			// If no previous planet found, wrap to the last entity
			const lastEntity = navigationEntities[navigationEntities.length - 1];
			updateMouseState({
				_clickedEntity: lastEntity,
				_selectedEntity: lastEntity
			});
			return;
		}

		// If we're on a moon, go to the previous entity (which could be a moon or a planet)
		if (currentIndex === 0) {
			// Already at the first entity, wrap to the last
			const lastEntity = navigationEntities[navigationEntities.length - 1];
			updateMouseState({
				_clickedEntity: lastEntity,
				_selectedEntity: lastEntity
			});
			return;
		}

		const previousEntity = navigationEntities[currentIndex - 1];
		updateMouseState({
			_clickedEntity: previousEntity,
			_selectedEntity: previousEntity
		});
	};

	const goToNextEntity = () => {
		if (!clickedEntity || navigationEntities.length === 0) return;

		const currentIndex = navigationEntities.findIndex((entity) => entity.id === clickedEntity.id);
		if (currentIndex === -1) return;

		// If we're at the last entity, wrap to the first
		if (currentIndex === navigationEntities.length - 1) {
			const firstEntity = navigationEntities[0];
			updateMouseState({
				_clickedEntity: firstEntity,
				_selectedEntity: firstEntity
			});
			return;
		}

		const nextEntity = navigationEntities[currentIndex + 1];
		updateMouseState({
			_clickedEntity: nextEntity,
			_selectedEntity: nextEntity
		});
	};

	return (
		<aside id="sidebar-ui-details" className="sidebar-ui-details" key={vueRandomString}>
			<button
				id="btn-mobile-drag-bar"
				className="btn btn-mobile-drag-bar d-lg-none"
				onPointerDown={() => {
					// TODO: Implement resize handler
				}}
			>
				<i className="fas fa-grip-lines"></i>
			</button>
			<button
				id="btn-desktop-drag-bar"
				className="btn btn-desktop-drag-bar d-none d-lg-flex"
				onPointerDown={() => {
					// TODO: Implement resize handler
				}}
			>
				<i className="fas fa-grip-lines-vertical"></i>
			</button>
			<div className="ui-details">
				{clickedEntity && (
					<>
						<figure className="d-none d-lg-block img-container">
							{clickedEntity.sidebarImage && <img src={clickedEntity.sidebarImage} alt={clickedEntity.displayName} />}
						</figure>
						<div className="title-container">
							<button type="button" className="btn" onClick={goToPreviousEntity}>
								<i className="fas fa-angle-left"></i>
							</button>
							<div className="title-wrapper">
								<h3 className="h3 text-entity-color">{clickedEntity.displayName}</h3>
								<span className="text-type">{clickedEntity.bodyType}</span>
							</div>
							<button type="button" className="btn" onClick={goToNextEntity}>
								<i className="fas fa-angle-right"></i>
							</button>
						</div>
						<Tabs clickedClassData={clickedEntity} />
					</>
				)}
			</div>
		</aside>
	);
};

export default Sidebar;
