'use strict';
import { Raycaster, Vector2 } from 'three';
import { state } from '../state';
import { settings } from '../settings';
import { getStandardDeviation } from './../utils';

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

const initMousePointerEvents = () => {
	window.addEventListener('mousemove', (e) => {
		state.mouseState._mouseHasMoved = true;
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	});

	window.addEventListener('pointerdown', (e) => {
		state.mouseState._mouseClicked = true;
		state.mouseState._mouseClickTimeout = _mouseClickTimeoutDefault;
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		state.mouseState._mouseClickLocation = [mouse.x, mouse.y];
	});

	window.addEventListener('pointerup', () => {
		state.mouseState._mouseClicked = false;

		// check pointer position deviation for x + y to see if we should unlock the camera from its target
		const oldMousePos = [state.mouseState._mouseClickLocation[0], state.mouseState._mouseClickLocation[1]];
		const newMousePos = [mouse.x, mouse.y];
		const xDeviation = getStandardDeviation([oldMousePos[0], newMousePos[0]]),
			yDeviation = getStandardDeviation([oldMousePos[1], newMousePos[1]]);

		const mouseHasDeviated = Math.abs(xDeviation) > 0.002 || Math.abs(yDeviation) > 0.002;
		if (mouseHasDeviated || state.mouseState._mouseHeld) return;

		state.mouseState._clickedGroup = returnHoveredGroup();
		if (state.mouseState._clickedGroup) {
			// This is because since the mesh is bound to its parent, it's xyz is 0,0,0 and therefore useless
			state.mouseState._easeToTarget = true;
			state.mouseState._zoomToTarget = true;
			state.controls.update();
		}

		// after releasing click, if mouse has deviated (we're playing with orbit controls), KEEP the target!
		// also check that the same target hasn't been clicked, and that whatever has been clicked on is NOT clickable
		if (
			!mouseHasDeviated &&
			!state.mouseState._mouseHeld &&
			!state.mouseState._clickedGroup &&
			!hasClickedSameTarget()
		) {
			// creating new instance of controls xyz so it doesn't keep tracking an object
			const newTarget = { ...state.controls.target };
			const { x, y, z } = newTarget;

			// To make camera stop following
			state.mouseState._easeToTarget = false;
			state.controls.target.set(x, y, z);
			state.controls.update();
			state.mouseState._clickedGroup = null;
		}
	});
};

export { returnHoveredGroup, initMousePointerEvents };
