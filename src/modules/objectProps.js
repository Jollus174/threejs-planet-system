'use strict';
import * as THREE from 'three';
import { createCircleFromPoints, numberWithCommas, ringUVMapGeometry } from './utils';
import { orrery } from './orrery';
import { scene } from './scene';
import { settings } from './settings';
import { checkIfDesktop, easeTo, fadeTargetLineOpacity, calculateOrbit, getRandomArbitrary } from './utils';
import { textureLoader, fontLoader } from './loadManager'; // still not 100% sure if this creates a new instantiation of it, we don't want that
import { CSS2DObject } from './custom/jsm/renderers/CSS2DRenderer';
import { asteroidBelt } from './factories/solarSystemFactory';
import { handleLabelClick } from './events/mousePointer';
import { gsap } from 'gsap';

const planetRangeThreshold = 80000000;
const planetOrbitLineRangeThreshold = 2000000;

const setOrbitVisibility = () => {
	return (orrery.orbitLines._orbitLinesVisible = settings.orbitLines._orbitVisibilityCheckbox.checked);
};

class OrbitLine {
	constructor(data, objectGroup) {
		this.data = data;
		this.orbitLineName = `${this.data.englishName} orbit line`;
		this.orbitMesh = null;
		this.objectGroup = objectGroup;
		this.fadingIn = false;
		this.fadingOut = false;
	}

	build({ renderInvisible = false } = {}) {
		const isMoon = this.data.aroundPlanet;
		const isDwarfPlanet = orrery.bodies._dwarfPlanets.find((dPlanet) => dPlanet.name === this.data.name);
		const points = [];
		for (let i = 0; i <= 360; i += 1) {
			const { x, y, z } = calculateOrbit(
				i,
				this.data.perihelion,
				this.data.aphelion,
				this.data.inclination,
				this.data.eccentricity,
				this.data.orbitRotationRandomiser
			);
			points.push(new THREE.Vector3(x, y, z));
		}

		const opacityDefault = isDwarfPlanet ? 0.2 : 1;
		const stemCurve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.95);
		const orbitPoints = stemCurve.getPoints(360);

		// create geometry using 360 points on the circle
		const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
		const startColor = new THREE.Color(this.data.labelColour);
		const endColor = new THREE.Color('black');

		const vertCnt = geometry.getAttribute('position').count;
		const lerpIncrementer = 1 / 360 / 1.5; // how much fade we want

		const colors = new Float32Array(vertCnt * 3);
		for (let i = 0; i <= 360; i++) {
			const lerpColor = new THREE.Color(startColor);
			lerpColor.lerpColors(startColor, endColor, i * lerpIncrementer);

			colors[i * 3 + 0] = lerpColor.r;
			colors[i * 3 + 1] = lerpColor.g;
			colors[i * 3 + 2] = lerpColor.b;
		}

		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		const material = new THREE.LineBasicMaterial({
			color: isMoon ? settings.planetColours.default : '#FFF',
			transparent: true,
			opacity: 0,
			// visible: setOrbitVisibility()
			visible: !renderInvisible,
			// blending: THREE.AdditiveBlending,
			vertexColors: true
		});
		this.orbitMesh = new THREE.Line(geometry, material);

		// this.orbitMesh = new THREE.Mesh(line, material);
		this.orbitMesh = new THREE.Line(geometry, material);

		// this.orbitMesh.computeLineDistances();

		this.orbitMesh.name = this.orbitLineName;
		this.orbitMesh.data = this.orbitMesh.data || {};
		this.orbitMesh.data.opacityDefault = opacityDefault;
		orrery.bodies._orbitLines.push(this.orbitMesh);
		this.objectGroup.parent.add(this.orbitMesh);

		// initial page load
		if (this.orbitMesh.material.opacity === 0) this.fadeIn();
	}

	fadeOut() {
		if (!this.fadingOut && this.orbitMesh.material.opacity !== 0) {
			this.fadingOut = true;
			gsap.to(this.orbitMesh.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					// TODO: debug mode complete message?
					this.fadingOut = false;
					this.visible = false;
				}
			});
		}
	}

	fadeIn() {
		if (!this.fadingIn && this.orbitMesh.material.opacity !== this.orbitMesh.data.opacityDefault) {
			this.fadingIn = true;
			this.visible = true;
			gsap.to(this.orbitMesh.material, {
				opacity: this.orbitMesh.data.opacityDefault,
				duration: 0.5,
				onComplete: () => {
					this.fadingIn = false;
				}
			});
		}
	}

	remove() {
		if (!this.fadingOut) {
			this.fadingOut = true;
			gsap.to(this.orbitMesh.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					this.fadingOut = false;
					const i = orrery.bodies._orbitLines.findIndex((o) => o.name === this.orbitLineName);
					orrery.bodies._orbitLines.splice(i, 1);
					this.objectGroup.parent.remove(this.orbitMesh);
				}
			});
		}
	}
}

class MoonLabelClass {
	constructor(data, planetGroup) {
		this.data = data;
		this.labelDiv = document.createElement('div');
		this.labelGroup = new THREE.Group();
		this.OrbitLine = new OrbitLine(data, this.labelGroup);
		this.intervalCheckDistance = null;
		this.evtHandleLabelClick = null;
		this.planetGroup = planetGroup;
		this.fadingIn = false;
		this.fadingOut = false;
		this.isAdded = false;
	}

	build() {
		this.labelDiv.className = 'label is-moon';
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `
			<div class="label-content" style="opacity: 0;">
				<div class="label-circle"></div>
				<div class="label-text">${this.data.englishName}</div>
			</div>
			`;
		const CSSObj = new CSS2DObject(this.labelDiv);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);
		orrery.bodies._moonLabels.push(this.labelGroup);

		// calculate orbit
		const { x, y, z } = this.data.startingPosition;
		this.labelGroup.position.set(x, y, z);

		this.evtHandleLabelClick = () => handleLabelClick(this.data);
		this.labelDiv.addEventListener('pointerdown', this.evtHandleLabelClick);

		this.intervalCheckDistance = setInterval(() => {
			this.handleDistance();
		}, 200);

		this.planetGroup.add(this.labelGroup);

		// building orbitLine after the group is added to the scene, so the group has a parent
		// limiting the number of orbitLines RENDERED to save memory
		const visibleAtBuild = this.planetGroup.data.moons.length < 20 || this.data.perihelion < 10000000;
		this.OrbitLine.build({ renderInvisible: !visibleAtBuild });

		gsap.to(this.labelDiv.querySelector('.label-content'), {
			opacity: 1,
			duration: 1,
			onComplete: () => {
				this.isAdded = true;
			}
		});
	}

	handleDistance() {
		const distance = orrery.camera.position.distanceTo({
			x: this.planetGroup.position.x + this.labelGroup.position.x,
			y: this.planetGroup.position.y + this.labelGroup.position.y,
			z: this.planetGroup.position.z + this.labelGroup.position.z
		});

		if (this.OrbitLine) {
			if (distance < 3000) {
				this.OrbitLine.fadeOut();
			} else {
				// fixing conflict here with what the PLANET wants to do...
				// this will prevent flickering
				const distancePlanetFromSun = orrery.camera.position.distanceTo(this.planetGroup.position);
				if (distancePlanetFromSun < planetRangeThreshold) {
					this.OrbitLine.fadeIn();
				}
			}
		}
	}

	remove() {
		if (!this.fadingOut && this.isAdded) {
			// fading out OrbitLine BEFORE planet (once the planet is gone, so is the line)
			if (this.OrbitLine) this.OrbitLine.remove();

			this.fadingOut = true;
			gsap.to(this.labelDiv.querySelector('.label-content'), {
				opacity: 0,
				duration: 0.5,
				onComplete: () => {
					this.labelDiv.removeEventListener('pointerdown', this.evtHandleLabelClick);
					clearInterval(this.intervalCheckDistance);

					// snap the camera back to the planet if the clicked group moon is deloaded
					if (
						orrery.mouseState._clickedGroup &&
						orrery.mouseState._clickedGroup.data &&
						orrery.mouseState._clickedGroup.data.aroundPlanet
					) {
						orrery.mouseState._clickedGroup = orrery.mouseState._clickedGroup.parent;
					}

					this.labelGroup.children.forEach((child) => {
						this.labelGroup.remove(child);
					});
					orrery.bodies._moonLabels.splice(
						orrery.bodies._moonLabels.findIndex((m) => m.name.includes(this.data.englishName)),
						1
					);

					this.planetGroup.remove(this.labelGroup);
					this.isAdded = false;
				}
			});
		}
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
		this.fadingIn = false;
		this.fadingOut = false;
		this.isVisible = false;
	}

	build() {
		this.labelDiv.className = `label ${
			this.data.isPlanet || this.data.englishName === 'Sun' ? 'is-planet' : 'is-dwarf-planet'
		}`;
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `
			<div class="label-content" style="opacity: 0;">
				<div class="label-circle"></div>
				<div class="label-text">${this.data.englishName}</div>
			</div>
			`;
		const CSSObj = new CSS2DObject(this.labelDiv);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);
		orrery.bodies._planetLabels.push(this.labelGroup);

		// calculate orbit
		if (this.data.startingPosition) {
			const { x, y, z } = this.data.startingPosition;
			this.labelGroup.position.set(x, y, z);
		} else {
			this.labelGroup.position.set(0, 0, 0);
		}

		this.evtHandleLabelClick = () => handleLabelClick(this.data);
		this.labelDiv.addEventListener('pointerdown', this.evtHandleLabelClick);

		this.intervalCheckDistance = setInterval(() => {
			this.handleDistance();
		}, 200);

		scene.add(this.labelGroup);
		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();

		this.fadeIn();
	}

	fadeOut() {
		if (!this.fadingOut && this.isVisible) {
			this.fadingOut = true;
			const labelContent = this.labelDiv.querySelector('.label-content');
			gsap.to(labelContent, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					// TODO: debug mode complete message?
					this.fadingOut = false;
					this.isVisible = false;
					labelContent.style.pointerEvents = 'none';
				}
			});
		}
	}

	fadeIn() {
		if (!this.fadingIn && !this.isVisible) {
			this.fadingIn = true;
			this.visible = true;
			const labelContent = this.labelDiv.querySelector('.label-content');
			gsap.to(labelContent, {
				opacity: 1,
				duration: 1,
				onComplete: () => {
					this.fadingIn = false;
					this.isVisible = true;
					labelContent.style.pointerEvents = 'all';
				}
			});
		}
	}

	handleDistance() {
		const distance = orrery.camera.position.distanceTo(this.labelGroup.position);

		// TODO: need to specify between INNER moons and OUTER moons... some are really far away...
		if (distance < planetRangeThreshold) {
			orrery.cameraState._currentPlanetInRange = this.data.englishName;
			this.labelDiv.classList.add('in-range');

			// Fade the orbitLine opacity depending on distance here
			if (distance < planetOrbitLineRangeThreshold) {
				this.OrbitLine.fadeOut();
			} else {
				this.OrbitLine.fadeIn();
			}

			// this seems inefficient since it's iterating through the array many times...
			// should we have some kind of render queue?
			if (
				this.data.moons &&
				!orrery.bodies.classes._moonLabels.find((m) => m.data.englishName === this.data.moons[0].englishName)
			) {
				this.data.moons.forEach((moon) => {
					const moonLabelClass = new MoonLabelClass(moon, this.labelGroup);
					orrery.bodies.classes._moonLabels.push(moonLabelClass);
					moonLabelClass.build(); // TODO: this should be a promise
				});
			}
		} else {
			this.labelDiv.classList.remove('in-range');

			if (
				orrery.cameraState._currentPlanetInRange &&
				this.labelGroup.name.includes(orrery.cameraState._currentPlanetInRange)
			) {
				orrery.bodies.classes._moonLabels.forEach((moonClass, i) => {
					moonClass.remove();
					orrery.bodies.classes._moonLabels.splice(i, 1);
				});
				if (!orrery.bodies.classes._moonLabels.length) {
					orrery.cameraState._currentPlanetInRange = '';
				}
			}
		}

		if (this.data.englishName === 'Sun') {
			orrery.cameraState._currentZoomDistanceThreshold =
				distance < settings.systemZoomDistanceThresholds[0]
					? 0
					: distance < settings.systemZoomDistanceThresholds[1]
					? 1
					: 2;
		}

		if (this.data.isInnerPlanet) {
			if (orrery.cameraState._currentZoomDistanceThreshold === 0) {
				this.fadeIn();
				this.OrbitLine.fadeIn();
			} else {
				this.fadeOut();
				this.OrbitLine.fadeOut();
			}
		}
	}

	remove() {
		this.labelDiv.removeEventListener('click', this.evtHandleLabelClick);
		clearInterval(this.intervalCheckDistance);
		this.OrbitLine.remove();

		this.labelGroup.children.forEach((child) => this.labelGroup.remove(child));
		scene.remove(this.labelGroup);
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

		labelLine.lookAt(orrery.camera.position);
		let innerRadius = labelLine.geometry.parameters.innerRadius;
		let outerRadius = labelLine.geometry.parameters.outerRadius;
		const { origOuterRadius, origSegments } = labelLine.data.labelGeometryOriginal;
		let regenerate = false;
		if (
			orrery.mouseState._hoveredGroups.length &&
			orrery.mouseState._hoveredGroups.some((g) => g.name === planetGroup.name)
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
		targetLine.lookAt(orrery.camera.position);
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
				(orrery.isDesktop &&
					planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.clickTarget.data.clickTargetSizeDesktop) ||
				(!orrery.isDesktop &&
					planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.clickTarget.data.clickTargetSizeMobile)
			) {
				planetGroup.clickTarget.geometry.dispose();
				planetGroup.clickTarget.geometry = new THREE.SphereBufferGeometry(
					orrery.isDesktop
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
