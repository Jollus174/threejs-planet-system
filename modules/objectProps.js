'use strict';
import * as THREE from 'three';
import { createCircleFromPoints, numberWithCommas, ringUVMapGeometry } from './utils';
import { state } from './state';
import { settings } from './settings';
import { checkIfDesktop, easeTo, fadeTargetLineOpacity, calculateOrbit, getRandomArbitrary } from './utils';
import { textureLoader, fontLoader } from './loadManager'; // still not 100% sure if this creates a new instantiation of it, we don't want that
import { CSS2DObject } from './custom/jsm/renderers/CSS2DRenderer';
import { updateClickedGroup } from './events/mousePointer';
import { asteroidBelt } from './factories/solarSystemFactory';

const setOrbitVisibility = () => {
	return (state.orbitLines._orbitLinesVisible = settings.orbitLines._orbitVisibilityCheckbox.checked);
};

class OrbitLine {
	constructor(data, objectGroup) {
		this.data = data;
		this.orbitLineName = `${this.data.englishName} orbit line`;
		this.orbitMesh = null;
		this.objectGroup = objectGroup;
	}

	build() {
		const isMoon = this.data.aroundPlanet;
		const isDwarfPlanet = state.bodies._dwarfPlanets.find((dPlanet) => dPlanet.name === this.data.name);
		const points = [];
		for (let i = 0; i <= 360; i += 0.03) {
			const { x, y, z } = calculateOrbit(
				i,
				this.data.perihelion,
				this.data.aphelion,
				this.data.inclination,
				this.data.eccentricity
			);
			points.push(new THREE.Vector3(x, y, z));
		}

		this.orbitMesh = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({
				color: isMoon ? settings.planetColours.default : '#FFF',
				transparent: true,
				opacity: isDwarfPlanet ? 0.2 : 1,
				visible: setOrbitVisibility()
			})
		);

		this.orbitMesh.name = this.orbitLineName;
		state.bodies._orbitLines.push(this.orbitMesh);
		this.objectGroup.parent.add(this.orbitMesh);
	}

	remove() {
		const i = state.bodies._orbitLines.findIndex((o) => o.name === this.orbitLineName);
		state.bodies._orbitLines.splice(i, 1);
		this.objectGroup.parent.remove(this.orbitMesh);
	}
}

const handleLabelClick = (data) => {
	state.cameraState._zoomToTarget = true;
	state.controls.saveState(); // saving state so can use the [Back] button
	document.querySelector('#position-back').disabled = false;
	const isMoon = data.aroundPlanet;
	const clickedGroup = state.bodies[isMoon ? '_moonLabels' : '_planetLabels'].find((p) =>
		p.data.englishName.includes(data.englishName)
	);
	updateClickedGroup(clickedGroup);
};

class MoonLabelClass {
	constructor(data, planetGroup) {
		this.data = data;
		this.labelDiv = document.createElement('div');
		this.labelGroup = new THREE.Group();
		this.OrbitLine = new OrbitLine(data, this.labelGroup);
		this.intervalCheckDistance = null;
		this.evtHandleLabelClick = null;
		this.planetGroup = planetGroup;
	}

	build() {
		this.labelDiv.className = 'label is-moon';
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `<div class="label-text">${this.data.englishName}</div>`;
		const CSSObj = new CSS2DObject(this.labelDiv);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);
		state.bodies._moonLabels.push(this.labelGroup);

		// calculate orbit
		const { x, y, z } = calculateOrbit(
			getRandomArbitrary(0, 360), // random position along orbit
			this.data.perihelion,
			this.data.aphelion,
			this.data.inclination,
			this.data.eccentricity
		);
		this.labelGroup.position.set(x, y, z);

		this.evtHandleLabelClick = () => handleLabelClick(this.data);
		this.labelDiv.addEventListener('pointerdown', this.evtHandleLabelClick);

		this.planetGroup.add(this.labelGroup);
		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();
	}

	remove() {
		this.labelDiv.removeEventListener('pointerdown', this.evtHandleLabelClick);
		this.OrbitLine.remove();

		this.labelGroup.children.forEach((child) => {
			this.labelGroup.remove(child);
		});
		state.bodies._moonLabels.splice(
			state.bodies._moonLabels.findIndex((m) => m.name.includes(this.data.englishName)),
			1
		);
		this.planetGroup.remove(this.labelGroup);
	}
}

class PlanetLabelClass {
	constructor(data) {
		this.data = data;
		this.labelDiv = document.createElement('div');
		this.labelGroup = new THREE.Group();
		this.OrbitLine = new OrbitLine(data, this.labelGroup);
		this.intervalCheckDistance = null;
		this.evtHandleLabelClick = null;
	}

	build() {
		this.labelDiv.className = 'label is-planet';
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `<div class="label-text">${this.data.englishName}</div>`;
		const CSSObj = new CSS2DObject(this.labelDiv);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);
		state.bodies._planetLabels.push(this.labelGroup);

		// calculate orbit
		const { x, y, z } = calculateOrbit(
			getRandomArbitrary(0, 360), // random position along orbit
			this.data.perihelion,
			this.data.aphelion,
			this.data.inclination,
			this.data.eccentricity
		);
		this.labelGroup.position.set(x, y, z);

		this.evtHandleLabelClick = () => handleLabelClick(this.data);
		this.labelDiv.addEventListener('pointerdown', this.evtHandleLabelClick);

		this.intervalCheckDistance = setInterval(() => {
			this.handleDistance();
		}, 200);

		state.scene.add(this.labelGroup);
		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();
	}

	handleDistance() {
		const distance = state.camera.position.distanceTo(this.labelGroup.position);

		// either 1000000 or 10000000
		if (distance < 60000000) {
			// console.log(`${this.data.englishName} is in range`);
			state.cameraState._currentPlanetInRange = this.data.englishName;
			this.labelDiv.classList.add('in-range');
			if (
				this.data.moons &&
				!state.bodies.classes._moonLabels.find((m) => m.data.englishName === this.data.moons[0].englishName)
			) {
				this.data.moons.forEach((moon) => {
					const moonLabelClass = new MoonLabelClass(moon, this.labelGroup);
					state.bodies.classes._moonLabels.push(moonLabelClass);
					moonLabelClass.build(); // TODO: this should be a promise
				});
			}
		} else {
			this.labelDiv.classList.remove('in-range');

			if (
				state.cameraState._currentPlanetInRange &&
				this.labelGroup.name.includes(state.cameraState._currentPlanetInRange)
			) {
				state.bodies.classes._moonLabels.forEach((moonClass, i) => {
					moonClass.remove();
					state.bodies.classes._moonLabels.splice(i, 1);
				});
				if (!state.bodies.classes._moonLabels.length) {
					state.cameraState._currentPlanetInRange = '';
				}
			}
		}

		if (this.data.englishName === 'Sun') {
			state.cameraState._currentZoomDistanceThreshold =
				distance < settings.systemZoomDistanceThresholds[0]
					? 0
					: distance < settings.systemZoomDistanceThresholds[1]
					? 1
					: 2;
		}

		if (this.data.isInnerPlanet) {
			if (state.cameraState._currentZoomDistanceThreshold === 0) {
				this.labelDiv.classList.remove('faded');
			} else {
				this.labelDiv.classList.add('faded');
			}
		}
	}

	remove() {
		this.labelDiv.removeEventListener('pointerdown', this.evtHandleLabelClick);
		clearInterval(this.intervalCheckDistance);
		this.orbitLine.remove();

		this.labelGroup.children.forEach((child) => this.labelGroup.remove(child));
		state.scene.remove(this.labelGroup);
	}
}

const labelLine = {
	build: (item) => {
		if (!item.includeLabelLine) return;

		const labelGeometry = {
			origInnerRadius: item.diameter * 1.01,
			origOuterRadius: item.diameter * 1.01,
			origSegments: 90
		};
		const labelLine = new THREE.Mesh(
			new THREE.RingBufferGeometry(
				labelGeometry.origInnerRadius,
				labelGeometry.origOuterRadius,
				labelGeometry.origSegments,
				1,
				labelGeometry.origThetaStart,
				labelGeometry.origThetaLength
			),
			new THREE.MeshBasicMaterial({
				color: item.labelColour,
				transparent: true,
				opacity: 0.8,
				blending: THREE.AdditiveBlending,
				side: THREE.FrontSide
				// depthTest: false,
				// depthWrite: false
			})
		);
		labelLine.name = `${item.name} group label line`;
		labelLine.data = labelLine.data || {};
		labelLine.data.labelGeometryOriginal = labelGeometry;
		labelLine.data.planetIsTargeted = false;
		// labelLine.renderOrder = 998;

		return labelLine;
	},

	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.labelLine) return;
		const labelLine = planetGroup.labelLine;

		labelLine.lookAt(state.camera.position);
		let innerRadius = labelLine.geometry.parameters.innerRadius;
		let outerRadius = labelLine.geometry.parameters.outerRadius;
		const { origOuterRadius, origSegments } = labelLine.data.labelGeometryOriginal;
		let regenerate = false;
		if (
			state.mouseState._hoveredGroups.length &&
			state.mouseState._hoveredGroups.some((g) => g.name === planetGroup.name)
		) {
			if (outerRadius < origOuterRadius * 1.1) {
				outerRadius += easeTo({ from: outerRadius, to: origOuterRadius * 1.1, incrementer: 15 });
				regenerate = true;
			}
			if (regenerate) {
				labelLine.geometry.dispose(); // running this is recommended but seems pointless
				labelLine.geometry = new THREE.RingGeometry(innerRadius, outerRadius, origSegments);
			}
		} else {
			if (outerRadius > origOuterRadius) {
				// will interpolate linearly
				outerRadius += easeTo({ from: outerRadius * 1.1, to: origOuterRadius, incrementer: 15 });
				regenerate = true;
			}
			if (regenerate) {
				labelLine.geometry.dispose();
				labelLine.geometry = new THREE.RingGeometry(innerRadius, outerRadius, origSegments);
			}
		}
	}
};

const rings = {
	build: (item) => {
		if (!item.rings) return;
		const ringsArr = [];
		item.rings.forEach((ring, i) => {
			const ringMesh = new THREE.Mesh(
				ringUVMapGeometry(ring.start, ring.end),
				new THREE.MeshBasicMaterial({
					...ring.material,
					map: textureLoader.load(ring.material.map)
				})
			);

			ringMesh.name = `${item.name} ring ${i}`;
			ringMesh.rotation.x = THREE.Math.degToRad(ring.angle);
			ringsArr.push(ringMesh);
		});

		return ringsArr;
	},
	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.rings) return;
		const rings = planetGroup.rings;
		rings.forEach((ring) => {
			ring.rotation.z += 0.01;
		});
	}
};

const targetLine = {
	build: (item) => {
		if (!item.includeTargetLine) return;
		// the 1.01 helps offset larger bodies like Jupiter
		const targetLineProps = createCircleFromPoints(item.diameter * 1.2);
		const { geometry, material } = targetLineProps;

		const targetLine = new THREE.Points(geometry, material);
		targetLine.renderOrder = 999;
		targetLine.name = `${item.name} target line`;

		return targetLine;
	},

	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.targetLine) return;
		const targetLine = planetGroup.targetLine;
		targetLine.lookAt(state.camera.position);
		fadeTargetLineOpacity(planetGroup, targetLine);
	}
};

const clickTarget = {
	build: (item) => {
		const clickTargetSizeMobile = Math.min(item.diameter * 50, 8),
			clickTargetSizeDesktop = Math.min(item.diameter * 50, item.diameter + 0.5);

		const clickTargetMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(checkIfDesktop() ? clickTargetSizeDesktop : clickTargetSizeMobile, 10, 10),
			new THREE.MeshBasicMaterial({
				side: THREE.FrontSide,
				visible: false, // this should allow it to be picked up by Raycaster, whilst being invisible
				wireframe: true,
				transparent: true,
				opacity: 0.2
			})
		);

		clickTargetMesh.name = `${item.name} click target`;
		clickTargetMesh.data = clickTargetMesh.data || {};
		clickTargetMesh.data.clickTargetSizeMobile = clickTargetSizeMobile;
		clickTargetMesh.data.clickTargetSizeDesktop = clickTargetSizeDesktop;

		return clickTargetMesh;
	},

	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.clickTarget) return;
		if (planetGroup.data.cameraDistance - planetGroup.data.zoomTo < Math.min(30, planetGroup.data.diameter * 40)) {
			// making sure the geometry is only redrawn once to save performance
			if (planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.data.diameter) {
				planetGroup.clickTarget.geometry.dispose();
				planetGroup.clickTarget.geometry = new THREE.SphereBufferGeometry(planetGroup.data.diameter, 10, 10);
			}
		} else {
			if (
				(state.isDesktop &&
					planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.clickTarget.data.clickTargetSizeDesktop) ||
				(!state.isDesktop &&
					planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.clickTarget.data.clickTargetSizeMobile)
			) {
				planetGroup.clickTarget.geometry.dispose();
				planetGroup.clickTarget.geometry = new THREE.SphereBufferGeometry(
					state.isDesktop
						? planetGroup.clickTarget.data.clickTargetSizeDesktop
						: planetGroup.clickTarget.data.clickTargetSizeMobile,
					10,
					10
				);
			}
		}
	}
};

export { setOrbitVisibility, PlanetLabelClass, OrbitLine, labelLine, targetLine, rings, clickTarget };
