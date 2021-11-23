'use strict';
import { Raycaster, Vector2 } from 'three';
import { state } from '../state';
import { settings } from '../settings';
import { controls } from '../controls';
import { getStandardDeviation } from './../utils';
import { setWikipediaData } from '../data/api';
import { vueOrrery } from '../app-orrery';
import { modalInfoButton } from './modals';

const { _mouseClickTimeoutDefault } = settings.mouse;
const mouse = new Vector2();
const raycaster = new Raycaster();

const returnHoveredGroup = () => {
	raycaster.setFromCamera(mouse, state.camera);
	const intersects = raycaster.intersectObjects(state.scene.children, true);
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

const hasClickedSameTarget = () =>
	state.mouseState._clickedGroup &&
	returnHoveredGroup() &&
	returnHoveredGroup().name &&
	state.mouseState._clickedGroup.name &&
	returnHoveredGroup().name === state.mouseState._clickedGroup.name;

const updateClickedGroup = (clickedGroup) => {
	state.mouseState._clickedGroup = clickedGroup;
	if (!clickedGroup) {
		modalInfoButton.disabled = true;
		return;
	}

	state.cameraState._zoomToTarget = true;
	controls.minDistance = state.mouseState._clickedGroup.data.meanRadius * 2;
	modalInfoButton.disabled = false;

	// if (!hasClickedSameTarget()) {
	// 	state.cameraState._rotateCameraYTo = state.mouseState._clickedGroup.position.y + 1.5;
	// }
};

const initMousePointerEvents = () => {
	// window.addEventListener('wheel', () => {
	// 	state.cameraState._zoomToTarget = false;
	// });
};

const handleLabelClick = (data) => {
	state.controls.saveState(); // saving state so can use the [Back] button
	document.querySelector('#position-back').disabled = false;
	const dataStorageKey = data.aroundPlanet ? '_moonLabels' : '_planetLabels';
	const clickedGroupIndex = vueOrrery.bodies[dataStorageKey].findIndex((p) =>
		p.data.englishName.includes(data.englishName)
	);
	const clickedGroup = vueOrrery.bodies[dataStorageKey][clickedGroupIndex]; // we want to reference + cache content to the original data

	if (!clickedGroup.data.content) {
		const wikiKey = clickedGroup.data.wikipediaKey || clickedGroup.data.englishName;
		setWikipediaData(wikiKey, clickedGroup);
	}
	updateClickedGroup(clickedGroup);
};

export { returnHoveredGroup, initMousePointerEvents, updateClickedGroup, handleLabelClick };
