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

const calculateOrbit = (index, data, parentPlanetData) => {
	const semimajorAxis = parentPlanetData ? parentPlanetData.meanRadius + data.semimajorAxis : data.semimajorAxis;
	// http://www.stjarnhimlen.se/comp/ppcomp.html#4
	// finding eccentric anomaly
	const M = MathUtils.degToRad(data.meanAnomaly + index); // mean anomaly (in radians) (this is what will iterate)
	const e = data.eccentricity;
	const a = semimajorAxis;
	const N = MathUtils.degToRad(data.longAscNode); // longitude of ascending node (in radians)
	const w = MathUtils.degToRad(data.argPeriapsis); // arg of periapis (in radians)
	const i = MathUtils.degToRad(data.inclination);

	// iterating for accuracy
	let E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));
	E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
	E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));

	// v = True Anomaly
	// a = semi-major axis
	// xv = r * cos(v) = a * ( cos(E) - e )
	// yv = r * sin(v) = a * ( sqrt(1.0 - e*e) * sin(E) )
	// v = atan2( yv, xv )
	// r = sqrt( xv*xv + yv*yv )
	const xv = a * (Math.cos(E) - e);
	const yv = a * (Math.sqrt(1 - Math.pow(e, 2)) * Math.sin(E));
	const v = Math.atan2(yv, xv);
	const r = Math.sqrt(Math.pow(xv, 2) + Math.pow(yv, 2));

	// Now for the position in space...
	const vec3 = new Vector3();
	vec3.setX(r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i)));
	vec3.setY(r * (Math.sin(v + w) * Math.sin(i)));
	vec3.setZ(r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i)));

	// ecliptic longitude and latitude
	// const lonecl = Math.atan2(yh, xh);
	// const latecl = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

	return vec3;
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

const checkDOMElementOverlap = (a, b, threshold) => {
	const overlapThreshold = threshold || 0;
	return !(
		a.right < b.left + overlapThreshold ||
		a.left + overlapThreshold > b.right ||
		a.bottom - overlapThreshold / 2 < b.top ||
		a.top + overlapThreshold / 2 > b.bottom
	);
};

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

const currentDateTime = () => {
	const currDate = new Date();
	const day = currDate.getDate();
	const month = currDate.getMonth();
	const year = currDate.getFullYear();

	// const d = 367 * year - (7 * (year + (month + 9) / 12)) / 4 + (275 * month) / 9 + day - 730530; // days since 2000
	// 7981.444444444496
	const d =
		367 * year -
		(7 * (year + (month + 9) / 12)) / 4 -
		(3 * ((year + (month - 9) / 7) / 100 + 1)) / 4 +
		(275 * month) / 9 +
		day -
		730515; // days since 2000 (should work for all time)
	// 7980

	return d;
};

const kmToAU = (km) => km / 149598000;
const AUToKm = (au) => au * 149598000;

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
	checkDOMElementOverlap,
	convertToKebabCase,
	convertToCamelCase,
	currentDateTime,
	kmToAU,
	AUToKm
};
