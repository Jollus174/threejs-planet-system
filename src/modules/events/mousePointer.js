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

const handleLabelClick = (data) => {
	orrery.controls.saveState(); // saving state so can use the [Back] button
	document.querySelector('#btn-back').disabled = false;
	const dataStorageKey = data.aroundPlanet ? '_moonLabels' : '_planetLabels';
	const clickedGroupIndex = orrery.bodies[dataStorageKey].findIndex((p) =>
		p.data.englishName.includes(data.englishName)
	);
	const clickedGroup = orrery.bodies[dataStorageKey][clickedGroupIndex]; // we want to reference + cache content to the original data

	orrery.cameraState._zoomToTarget = true;
	controls.minDistance = clickedGroup.data.meanRadius * 2;
	document.querySelector('#btn-modal-info').disabled = false;
	orrery.mouseState._clickedGroup = clickedGroup; // to get the camera moving

	// updating modal with Wikipedia data
	if (!clickedGroup.data.content) {
		const wikiKey = clickedGroup.data.wikipediaKey || clickedGroup.data.englishName;
		getWikipediaData(wikiKey)
			.then((response) => {
				console.log(response);
				clickedGroup.data.title = response.title;
				clickedGroup.data.content = response.content;
				clickedGroup.data.image = response.image;
			})
			.catch((err) => {
				console.error(err);
			});
	}
};

export { returnHoveredGroup, initMousePointerEvents, handleLabelClick };
