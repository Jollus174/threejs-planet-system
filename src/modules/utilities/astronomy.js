'use strict';
import { MathUtils, Vector3 } from 'three';

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
	let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
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

const kmToAU = (km) => km / 149598000;
const AUToKm = (au) => au * 149598000;

export { calculateOrbit, kmToAU, AUToKm };
