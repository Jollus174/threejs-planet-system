'use strict';
import { Raycaster, Vector2 } from 'three';
import { state } from '../state';
import { settings } from '../settings';
import { controls } from '../controls';
import { getStandardDeviation } from './../utils';
import { getWikipediaData } from '../data/api';

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

// const hasClickedSameTarget = () =>
// 	window.vueOrrery.mouseState._clickedGroup &&
// 	returnHoveredGroup() &&
// 	returnHoveredGroup().name &&
// 	window.vueOrrery.mouseState._clickedGroup.name &&
// 	returnHoveredGroup().name === window.vueOrrery.mouseState._clickedGroup.name;

const initMousePointerEvents = () => {
	window.addEventListener('wheel', () => {
		state.cameraState._zoomToTarget = false;
	});
};

const handleLabelClick = (data) => {
	state.controls.saveState(); // saving state so can use the [Back] button
	document.querySelector('#btn-back').disabled = false;
	const dataStorageKey = data.aroundPlanet ? '_moonLabels' : '_planetLabels';
	const clickedGroupIndex = window.vueOrrery.bodies[dataStorageKey].findIndex((p) =>
		p.data.englishName.includes(data.englishName)
	);
	const clickedGroup = window.vueOrrery.bodies[dataStorageKey][clickedGroupIndex]; // we want to reference + cache content to the original data

	state.cameraState._zoomToTarget = true;
	controls.minDistance = clickedGroup.data.meanRadius * 2;
	document.querySelector('#btn-modal-info').disabled = false;
	window.vueOrrery.mouseState._clickedGroup = clickedGroup; // to get the camera moving

	// updating modal with Wikipedia data
	if (!clickedGroup.data.content) {
		const wikiKey = clickedGroup.data.wikipediaKey || clickedGroup.data.englishName;
		getWikipediaData(wikiKey)
			.then((response) => {
				// TODO: use Vue.set
				console.log(response);
				clickedGroup.data.title = response.title;
				clickedGroup.data.content = response.content;
				clickedGroup.data.image = response.image;

				window.vueOrrery.mouseState._clickedGroup = Object.assign({}, window.vueOrrery.mouseState._clickedGroup, {
					...clickedGroup
				});
			})
			.catch((err) => {
				console.error(err);
			});
	} else {
		window.vueOrrery.mouseState._clickedGroup = Object.assign({}, window.vueOrrery.mouseState._clickedGroup, {
			...clickedGroup
		});
	}
};

export { returnHoveredGroup, initMousePointerEvents, handleLabelClick };
