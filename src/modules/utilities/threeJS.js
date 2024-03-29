'use strict';
import { Texture, RingGeometry, Vector3 } from 'three';

// draw a circle to a new canvas so we can render a circle texture (good for Points)
const createCircleTexture = (color, size) => {
	const matCanvas = document.createElement('canvas');
	matCanvas.width = matCanvas.height = size;
	const matContext = matCanvas.getContext('2d');
	// create texture object from canvas.
	const texture = new Texture(matCanvas);
	// Draw a circle
	const center = size / 2;
	matContext.beginPath();
	matContext.arc(center, center, size / 2, 0, 2 * Math.PI, false);
	matContext.closePath();
	matContext.fillStyle = color;
	matContext.fill();
	// need to set needsUpdate
	texture.needsUpdate = true;
	// return a texture made from the canvas
	return texture;
};

// custom UV map so textures can curve correctly (looking at you, rings of Saturn)
const ringUVMapGeometry = (from, to) => {
	const geometry = new RingGeometry(from, to, 90);
	const pos = geometry.attributes.position;
	const v3 = new Vector3();
	for (let i = 0; i < pos.count; i++) {
		v3.fromBufferAttribute(pos, i);
		geometry.attributes.uv.setXY(i, v3.length() < (from + to) / 2 ? 0 : 1, 1);
	}

	return geometry;
};

const fadeTargetLineOpacity = (group, targetLine) => {
	// const { _clickedGroup } = window.vueOrrery.mouseState;
	// let m = targetLine.material;
	// if (_clickedGroup && _clickedGroup.name === group.name) {
	// 	m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
	// } else {
	// 	m.opacity = m.opacity > 0 ? (m.opacity -= 0.05) : 0;
	// }
};

export { createCircleTexture, ringUVMapGeometry, fadeTargetLineOpacity };
