'use strict';
import { Raycaster, Vector2 } from 'three';
import { orrery } from '../orrery';
import { settings } from '../settings';
import { controls } from '../controls';
import { getStandardDeviation } from './../utils';
import { getWikipediaData } from '../data/api';

const { _mouseClickTimeoutDefault } = settings.mouse;
const mouse = new Vector2();
const raycaster = new Raycaster();

const returnHoveredGroup = () => {
	raycaster.setFromCamera(mouse, orrery.camera);
	const intersects = raycaster.intersectObjects(orrery.scene.children, true);
	let objsClickable = intersects.filter(
		(intersect) => intersect.object && intersect.object.name.includes('click target')
	);

	const findParentGroup = (obj) => {
		let objParent = obj.parent;
		if (!objParent) return null;
		if (objParent.type === 'Group') return objParent;
		objParent = objParent.parent;
		if (objParent.type === 'Group') return objParent;
		objParent = objParent.parent;
		if (objParent.type === 'Group') return objParent;

		return null;
	};

	return objsClickable.length && objsClickable[0].object ? findParentGroup(objsClickable[0].object) : null;
};

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

const handleLabelClick = (data, labelGroup) => {
	orrery.controls.saveState(); // saving state so can use the [Back] button
	document.querySelector('#btn-back').disabled = false;
	const clickedItem = data;

	orrery.cameraState._zoomToTarget = true;
	controls.minDistance = clickedItem.meanRadius * 8;
	document.querySelector('#btn-modal-info').disabled = false;
	orrery.mouseState._clickedGroup = labelGroup; // to get the camera moving

	// updating modal with Wikipedia data
	if (!clickedItem.content) {
		const wikiKey = clickedItem.wikipediaKey || clickedItem.englishName;
		getWikipediaData(wikiKey)
			.then((response) => {
				console.log(response);
				clickedItem.title = response.title;
				clickedItem.content = response.content;
				clickedItem.image = response.image;
			})
			.catch((err) => {
				console.error(err);
			});
	}
};

export { returnHoveredGroup, initMousePointerEvents, handleLabelClick };
