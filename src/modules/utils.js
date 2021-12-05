'use strict';
import { Texture, BufferGeometry, RingBufferGeometry, Vector3, PointsMaterial, MathUtils } from 'three';

// get deviation between a set of values stored in an array
const getStandardDeviation = (array) => {
	const n = array.length;
	const mean = array.reduce((a, b) => a + b) / n;
	return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const getRandomArbitrary = (min, max) => {
	return Math.random() * (max - min) + min;
};

const calculateOrbit = (i, data, parentPlanetData) => {
	const perihelion = parentPlanetData ? parentPlanetData.meanRadius + data.perihelion : data.perihelion;
	const aphelion = parentPlanetData ? parentPlanetData.meanRadius + data.aphelion : data.aphelion;
	const inclination = data.aphelion * (data.inclination / 90);
	const longAscNode = data.longAscNode !== 0 ? data.longAscNode : 0;
	const eccentricity = data.aphelion * data.eccentricity;

	// standard ellipse
	// h to right, k to up
	// B is the angle to rotate by!
	// x = aCosT + h
	// z = bSinT + k

	// rotated ellipse
	// x' = aCosT * CosB - bSinT * SinB + h
	// z' = aCosT * SinB + bSinT * CosB + k

	// TODO: If I ever implement orbit over time, then longAscNode will need to gradually change

	let x =
		aphelion * Math.sin(MathUtils.degToRad(i)) * Math.sin(MathUtils.degToRad(-longAscNode)) -
		perihelion * Math.cos(MathUtils.degToRad(i)) * Math.cos(MathUtils.degToRad(-longAscNode));
	const y = Math.sin(MathUtils.degToRad(i)) * inclination;
	let z =
		aphelion * Math.sin(MathUtils.degToRad(i)) * Math.cos(MathUtils.degToRad(-longAscNode)) +
		perihelion * Math.cos(MathUtils.degToRad(i)) * Math.sin(MathUtils.degToRad(-longAscNode));

	x = x - data.aphelion * data.eccentricity * Math.sin(MathUtils.degToRad(-longAscNode));
	z = z + data.perihelion * data.eccentricity * Math.sin(MathUtils.degToRad(-longAscNode));

	// x = Math.sin(MathUtils.degToRad(i + orbitRandom)) * aphelion + eccentricityAdj;
	// y = Math.sin(MathUtils.degToRad(i + orbitRandom)) * inclinationAdj;
	// z = Math.cos(MathUtils.degToRad(i + orbitRandom)) * perihelion;

	return { x, y, z };
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
// eg: xFrom += easeTo({ from: xFrom, to: xTo });
const easeTo = ({ from = null, to = null, incrementer = 10 } = {}) => {
	return (to - from) / incrementer;
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

const numberWithCommas = (n) => {
	if (!n) return;
	return n.toLocaleString();
};

const getBreakpoint = () =>
	window.getComputedStyle(document.querySelector('body'), '::before').getPropertyValue('content').replace(/["']/g, '');

const checkIfDesktop = () => ['screen-lg', 'screen-xl'].includes(getBreakpoint());

const convertToKebabCase = (str) => {
	return str.replace(/\W/g, '-').toLowerCase();
};

const convertToCamelCase = (str) => {
	// get rid of anything that's a weird character and convert it to a space, then capitalise every item except for first, then join everything together
	return str
		.toLowerCase()
		.replace(/\W/g, ' ')
		.split(' ')
		.map((item, index) => (index === 0 ? item : item.charAt(0).toUpperCase() + item.slice(1)))
		.join('');
};

export {
	getStandardDeviation,
	getRandomArbitrary,
	calculateOrbit,
	createCircleTexture,
	createCircleFromPoints,
	ringUVMapGeometry,
	easeTo,
	fadeTargetLineOpacity,
	numberWithCommas,
	getBreakpoint,
	checkIfDesktop,
	convertToKebabCase,
	convertToCamelCase
};
