'use strict';
import { Texture, BufferGeometry, RingBufferGeometry, Vector3, PointsMaterial } from 'three';
import { state } from './state';
import { settings } from './settings';

// get deviation between a set of values stored in an array
const getStandardDeviation = (array) => {
	const n = array.length;
	const mean = array.reduce((a, b) => a + b) / n;
	return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

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

const createCircleFromPoints = (radius) => {
	const points = [];

	for (let i = 0; i <= 360; i++) {
		points.push(new Vector3(Math.sin(i * (Math.PI / 180)) * radius, Math.cos(i * (Math.PI / 180)) * radius, 0));
	}

	const geometry = new BufferGeometry().setFromPoints(points);

	const lineProps = {
		geometry,
		material: new PointsMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.05,
			size: radius * 0.01,
			depthTest: false,
			depthWrite: false
		})
	};
	lineProps.renderOrder = 997;

	return lineProps;
};

// custom UV map so textures can curve correctly (looking at you, rings of Saturn)
const ringUVMapGeometry = (from, to) => {
	const geometry = new RingBufferGeometry(from, to, 90);
	const pos = geometry.attributes.position;
	const v3 = new Vector3();
	for (let i = 0; i < pos.count; i++) {
		v3.fromBufferAttribute(pos, i);
		geometry.attributes.uv.setXY(i, v3.length() < (from + to) / 2 ? 0 : 1, 1);
	}

	return geometry;
};

// returns a value that we should iterate over
// chuck this in the render() function for it to work
const easeTo = ({ from = null, to = null, incrementer = 10 } = {}) => {
	return (to - from) / incrementer;
};

const fadeTextOpacity = (group, text) => {
	const { _clickedGroup } = state.mouseState;
	const { _textOpacityDefault } = settings.text;

	if (
		_clickedGroup &&
		_clickedGroup.name === group.name &&
		group.data.cameraDistance < group.data.zoomTo + 14 &&
		group.data.cameraDistance > group.data.zoomTo - 1
	) {
		text.material.forEach((m) => {
			m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
		});
	} else {
		text.material.forEach((m) => {
			m.opacity = m.opacity > _textOpacityDefault ? (m.opacity -= 0.05) : 0;
		});
	}
};

const calculatePlanetDistance = (planet) => state.camera.position.distanceTo(planet.position);

const fadeTargetLineOpacity = (group, targetLine) => {
	const { _clickedGroup } = state.mouseState;
	let m = targetLine.material;
	if (_clickedGroup && _clickedGroup.name === group.name) {
		m.opacity = m.opacity < 1 ? (m.opacity += 0.025) : 1;
	} else {
		m.opacity = m.opacity > 0 ? (m.opacity -= 0.05) : 0;
	}
};

const numberWithCommas = (n) => {
	if (!n) return;
	return n.toLocaleString();
};

const getBreakpoint = () =>
	window.getComputedStyle(document.querySelector('body'), '::before').getPropertyValue('content').replace(/["']/g, '');

const checkIfDesktop = () => ['screen-lg', 'screen-xl'].includes(getBreakpoint());

export {
	getStandardDeviation,
	createCircleTexture,
	createCircleFromPoints,
	ringUVMapGeometry,
	easeTo,
	calculatePlanetDistance,
	fadeTargetLineOpacity,
	fadeTextOpacity,
	numberWithCommas,
	getBreakpoint,
	checkIfDesktop
};
