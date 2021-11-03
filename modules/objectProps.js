'use strict';
import * as THREE from 'three';
import { createCircleFromPoints, numberWithCommas, ringUVMapGeometry } from './utils';
import { state } from './state';
import { settings } from './settings';
import { checkIfDesktop, easeTo, fadeTextOpacity, fadeTargetLineOpacity } from './utils';
import { textureLoader, fontLoader } from './loadManager'; // still not 100% sure if this creates a new instantiation of it, we don't want that

const setOrbitVisibility = () => {
	return (state.orbitLines._orbitLinesVisible = settings.orbitLines._orbitVisibilityCheckbox.checked);
};

const text = {
	build: (item) => {
		if (!item.textColour) return;
		const fontGroup = new THREE.Group();
		const { _textOpacityDefault, _fontSettings } = settings.text;

		const createTextMesh = (geo, color) => {
			const textMesh = new THREE.Mesh(geo, [
				new THREE.MeshBasicMaterial({
					color,
					side: THREE.FrontSide,
					depthTest: false,
					depthWrite: false,
					opacity: _textOpacityDefault,
					transparent: true
				}), // front
				new THREE.MeshBasicMaterial({
					color,
					side: THREE.FrontSide,
					opacity: _textOpacityDefault,
					transparent: true,
					depthTest: false,
					depthWrite: false
				}) // side
			]);

			textMesh.renderOrder = 999; // will force text to always render on top, even on weird stuff (like Saturn's rings)

			return textMesh;
		};

		fontLoader.load(`fonts/futura-lt_book.json`, (font) => {
			// am only including the uppercase glyphs for this
			const titleGeo = new THREE.TextGeometry(item.name.toUpperCase(), {
				font,
				size: item.titleFontSize,
				height: 0.05,
				..._fontSettings
			});
			titleGeo.computeBoundingBox(); // for aligning the text

			const titleMesh = createTextMesh(titleGeo, item.textColour);

			const centreOffsetY = -0.5 * (titleGeo.boundingBox.max.y - titleGeo.boundingBox.min.y);
			const rightOffset = titleGeo.boundingBox.min.x;
			const arbitraryExtraValue = item.spaceBetweenText;
			fontGroup.position.x = rightOffset; // will CENTRE the group, to use as a foundation for positioning other elements
			titleMesh.position.x = 0 - titleGeo.boundingBox.max.x - item.size - arbitraryExtraValue; // will align text to the LEFT of the planet
			titleMesh.position.y = centreOffsetY;
			titleMesh.name = `${item.name} title`;

			fontGroup.add(titleMesh);

			fontLoader.load(`fonts/sylfaen_regular.json`, (font) => {
				const stats = item.stats || {};
				const { distanceToSun, diameter, spinTime, orbitTime, gravity, distanceFromPlanet } = stats;

				const textArray = [];
				const textValues = [
					distanceToSun ? `Distance to Sun: ${numberWithCommas(distanceToSun)} km` : null,
					distanceFromPlanet ? `Distance from ${item.parentName}: ${numberWithCommas(distanceFromPlanet)} km` : null,
					diameter ? `Diameter: ${numberWithCommas(diameter)} km` : null,
					spinTime ? `Spin Time: ${numberWithCommas(spinTime)} Days` : null,
					orbitTime ? `Orbit Time: ${numberWithCommas(orbitTime)} Days` : null,
					gravity ? `Gravity: ${gravity} G` : null
				];
				textValues.forEach((val) => {
					if (val !== null) textArray.push(val);
				});

				const descGeo = new THREE.TextGeometry(textArray.join('\n'), {
					font,
					size: item.statsFontSize,
					..._fontSettings
				});
				descGeo.computeBoundingBox(); // for aligning the text

				const descMesh = createTextMesh(descGeo, 0xffffff);
				// descMesh.scale.set(item.statsScale, item.statsScale, item.statsScale); // sorry Sun, we're doing this the proper way

				const centreOffsetY = -0.5 * (descGeo.boundingBox.max.y - descGeo.boundingBox.min.y);
				const arbitraryExtraValue = item.spaceBetweenText;
				descMesh.position.x = item.size + arbitraryExtraValue; // will align text to the LEFT of the planet
				descMesh.position.y = 0 - centreOffsetY - 0.13; // this value seems to correct the v-alignment, not sure why
				descMesh.name = `${item.name} desc`;
				fontGroup.add(descMesh);
			});
		});

		fontGroup.name = `${item.name} text group`;

		return fontGroup;
	},

	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.textGroup) return;
		planetGroup.textGroup.lookAt(state.camera.position);
		planetGroup.textGroup.children.forEach((text) => fadeTextOpacity(planetGroup, text));
	}
};

const labelLine = {
	build: (item) => {
		if (!item.includeLabelLine) return;

		const labelGeometry = {
			origInnerRadius: item.size * 1.01 + 0.1 + 0.1,
			origOuterRadius: item.size * 1.01 + 0.1 + 0.1,
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
		if (state.mouseState._hoveredGroups.some((g) => g.name === planetGroup.name)) {
			if (outerRadius < origOuterRadius + 0.075) {
				outerRadius += easeTo({ from: outerRadius, to: origOuterRadius + 0.075, incrementer: 15 });
				regenerate = true;
			}
			if (regenerate) {
				labelLine.geometry.dispose(); // running this is recommended but seems pointless
				labelLine.geometry = new THREE.RingGeometry(innerRadius, outerRadius, origSegments);
			}
		} else {
			if (outerRadius > origOuterRadius) {
				// will interpolate linearly
				outerRadius += easeTo({ from: outerRadius + 0.5, to: origOuterRadius, incrementer: 50 });
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
		const targetLineProps = createCircleFromPoints(item.size * 1.01 + 0.1);
		const { geometry, material } = targetLineProps;

		const targetLine = new THREE.Points(geometry, material);
		targetLine.renderOrder = 999;
		targetLine.name = `${item.name} target line`;

		return targetLine;
	},

	renderLoop: (planetGroup) => {
		if (!planetGroup || !planetGroup.targetLine);
		const targetLine = planetGroup.targetLine;
		targetLine.lookAt(state.camera.position);
		fadeTargetLineOpacity(planetGroup, targetLine);
	}
};

const orbitLine = {
	build: (item) => {
		if (!item.includeOrbitLine) return;
		const orbit = new THREE.Line(
			new THREE.RingBufferGeometry(item.orbitRadius, item.orbitRadius, 180),
			new THREE.LineBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.1,
				visible: setOrbitVisibility()
			})
		);
		orbit.rotation.x = THREE.Math.degToRad(90); // to set them from vertical to horizontal
		orbit.name = `${item.name} orbit line`;

		return orbit;
	}
};

const clickTarget = {
	build: (item) => {
		const clickTargetSizeMobile = Math.min(item.size * 5, 8),
			clickTargetSizeDesktop = item.size + 0.5;

		const clickTargetMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(checkIfDesktop() ? clickTargetSizeDesktop : clickTargetSizeMobile, 10, 10),
			new THREE.MeshBasicMaterial({
				side: THREE.FrontSide,
				visible: false, // this should allow it to be picked up by Raycaster, whilst being invisible
				wireframe: true
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
		if (planetGroup.data.cameraDistance - planetGroup.data.zoomTo < 30) {
			// making sure the geometry is only redrawn once to save performance
			if (planetGroup.clickTarget.geometry.parameters.radius !== planetGroup.data.size) {
				planetGroup.clickTarget.geometry.dispose();
				planetGroup.clickTarget.geometry = new THREE.SphereBufferGeometry(planetGroup.data.size, 10, 10);
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

export { setOrbitVisibility, text, labelLine, targetLine, rings, orbitLine, clickTarget };
