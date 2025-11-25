import React from 'react';
import { useOrrery } from '../../contexts/OrreryContext';

const Navigation: React.FC = () => {
	const { mouseState, updateMouseState } = useOrrery();
	const clickedEntity = mouseState._clickedEntity;

	const currentSystem = clickedEntity
		? clickedEntity.bodyType === 'Star'
			? `The <span class="text-system-color">${clickedEntity.displayName}</span>`
			: `<span class="text-system-color">${clickedEntity.systemName}</span> System`
		: 'Solar System';

	const goToPreviousSystem = () => {
		// TODO: Implement navigation
	};

	const goToNextSystem = () => {
		// TODO: Implement navigation
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
