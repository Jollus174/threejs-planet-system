'use strict';
import { Vector2 } from 'three';
import { orrery } from '../orrery';
import { settings } from '../settings';
import { controls } from '../controls';
import { getStandardDeviation } from './../utils';
import { getWikipediaData } from '../data/api';

const { _mouseClickTimeoutDefault } = settings.mouse;
const mouse = new Vector2();
// const raycaster = new Raycaster();

// const returnHoveredGroup = () => {
// 	raycaster.setFromCamera(mouse, orrery.camera);
// 	const intersects = raycaster.intersectObjects(orrery.scene.children, true);
// 	return intersects;
// };

// const hasClickedSameTarget = () =>
// 	orrery.mouseState._clickedGroup &&
// 	returnHoveredGroup() &&
// 	returnHoveredGroup().name &&
// 	orrery.mouseState._clickedGroup.name &&
// 	returnHoveredGroup().name === orrery.mouseState._clickedGroup.name;

const initMousePointerEvents = () => {
	window.addEventListener('wheel', () => {
		orrery.cameraState._zoomToTarget = false;
	});

	document.querySelector('#btn-back').addEventListener('click', () => {
		orrery.cameraState._zoomToTarget = false;
		document.querySelector('#btn-modal-info').disabled = true;
		orrery.controls.reset();
	});
};

const handleLabelClick = (classRef) => {
	orrery.controls.saveState(); // saving state so can use the [Back] button
	// document.querySelector('#btn-back').disabled = false;

	// checking to see if the item has already been clicked
	// if it has, then zoom to it
	if (orrery.mouseState._clickedClass && orrery.mouseState._clickedClass.data.key === classRef.data.key) {
		orrery.cameraState._zoomToTarget = true; // to get the camera moving
		orrery.cameraState._zoomedClass = classRef;
		controls.minDistance = classRef.data.meanRadius * 8;
	} else {
		orrery.cameraState._zoomToTarget = false;
		orrery.cameraState._zoomedClass = null;
		orrery.mouseState._clickedClass = classRef;
	}

	// document.querySelector('#btn-modal-info').disabled = false;

	// updating modal with Wikipedia data
	if (!classRef.data.content) {
		const wikiKey = classRef.data.wikipediaKey || classRef.data.englishName;
		getWikipediaData(wikiKey)
			.then((response) => {
				classRef.data.title = response.title;
				classRef.data.content = response.content;
				classRef.data.image = response.image;
			})
			.catch((err) => {
				console.error(err);
			});
	}
};

export { initMousePointerEvents, handleLabelClick };
