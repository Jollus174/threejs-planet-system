'use strict';
import * as THREE from 'three';
import { createCircleFromPoints, ringUVMapGeometry } from './utils';
import { orrery } from './orrery';
import { scene } from './scene';
import { settings } from './settings';
import { checkIfDesktop, easeTo, fadeTargetLineOpacity, calculateOrbit, getRandomArbitrary } from './utils';
import { textureLoader, fontLoader } from './loadManager'; // still not 100% sure if this creates a new instantiation of it, we don't want that
import { CSS2DObject } from './custom/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/gltfloader';
import { asteroidBelt } from './factories/solarSystemFactory';
import { handleLabelClick } from './events/mousePointer';
import { gsap } from 'gsap';
import fragmentShader from './shaders/glow/fragmentShader.glsl';
import vertexShader from './shaders/glow/vertexShader.glsl';
import { materialData as rawMaterialData } from './data/solarSystem';

const planetRangeThreshold = 50000000; // Jupiter moons appear from Ceres at higher range...
// TODO: set it at this range only for the planet/moon that's targeted
// const planetRangeThreshold = 500000000; // Jupiter moons appear from Ceres at higher range...
const innerMoonRangeThreshold = 1700000;
const majorMoonRangeThreshold = 25000000;
const planetOrbitLineRangeThreshold = 2000000;

const setOrbitVisibility = () => {
	return (orrery.orbitLines._orbitLinesVisible = settings.orbitLines._orbitVisibilityCheckbox.checked);
};

class OrbitLine {
	constructor(data, objectGroup) {
		this.data = data;
		this.orbitLineName = `${this.data.englishName} orbit line`;
		this.objectGroup = objectGroup;
		this.orbitLine = null;
		this.fadingIn = false;
		this.fadingOut = false;
		this.parentPlanetData = data.aroundPlanet
			? orrery.bodies._allPlanets.find((p) => p.id === data.aroundPlanet.planet)
			: null;
	}

	build({ renderInvisible = false } = {}) {
		const isMoon = this.data.aroundPlanet;
		const points = [];

		for (let i = this.data.meanAnomaly; i <= this.data.meanAnomaly + 360; i += 1) {
			const { x, y, z } = calculateOrbit(i, this.data, this.parentPlanetData);
			points.push(new THREE.Vector3(x, y, z));
		}

		const opacityDefault = this.data.isDwarfPlanet || this.data.isOuterMoon ? 0.2 : 1;
		const orbitPoints = points;

		// create geometry using all points on the circle
		const geometryLine = new THREE.BufferGeometry().setFromPoints(orbitPoints);

		const startColor = new THREE.Color(this.data.labelColour);
		const endColor = new THREE.Color('black');

		const vertCnt = geometryLine.getAttribute('position').count;
		const lerpAcc = 1.25; // how much fade we want, closer to 0 means fades earlier
		const lerpIncrementer = 1 / 360 / lerpAcc;

		const colors = new Float32Array(vertCnt * 3);
		for (let i = 0; i <= 360; i += 1) {
			const lerpColor = new THREE.Color(startColor);
			lerpColor.lerpColors(startColor, endColor, i * lerpIncrementer);

			colors[i * 3 + 0] = lerpColor.r;
			colors[i * 3 + 1] = lerpColor.g;
			colors[i * 3 + 2] = lerpColor.b;
		}

		geometryLine.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		this.orbitLine = new THREE.Line(
			geometryLine,
			new THREE.LineBasicMaterial({
				color: isMoon ? settings.planetColours.default : '#FFF',
				transparent: true,
				opacity: 0,
				visible: !renderInvisible,
				blending: THREE.AdditiveBlending,
				vertexColors: true
			})
		);

		this.orbitLine.name = this.orbitLineName;
		this.orbitLine.data = this.data;

		this.orbitLine.data.renderInvisible = renderInvisible;
		this.orbitLine.data.opacityDefault = opacityDefault;
		orrery.bodies._orbitLines.push(this.orbitLine);
		this.objectGroup.parent.add(this.orbitLine);

		// initial page load
		if (this.orbitLine.material.opacity === 0 && !this.orbitLine.data.renderInvisible) {
			this.fadeIn();
		}
	}

	fadeOut() {
		if (!this.fadingOut && this.orbitLine.material.opacity !== 0) {
			this.fadingOut = true;
			gsap.to(this.orbitLine.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					// TODO: debug mode complete message?
					this.fadingOut = false;
					this.orbitLine.material.visible = false;
				}
			});
		}
	}

	fadeIn() {
		if (!this.fadingIn && this.orbitLine.material.opacity !== this.orbitLine.data.opacityDefault) {
			this.fadingIn = true;
			this.orbitLine.material.visible = true;
			gsap.to(this.orbitLine.material, {
				opacity: this.orbitLine.data.opacityDefault,
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
			gsap.to(this.orbitLine.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					this.fadingOut = false;
					this.objectGroup.removeFromParent();
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
		this.meshGroup = null;
		this.intervalCheckDistance = null;
		this.planetGroup = planetGroup;
		this.fadingIn = false;
		this.fadingOut = false;
		this.isAdded = false;
		this.isInRange = false;

		this.OrbitLine = new OrbitLine(data, this.labelGroup);
		this.orbitLineVisibleAtBuild = this.planetGroup.data.moons.length < 20 || this.data.perihelion < 10000000; // orbit line limits set here
	}

	build() {
		if (this.isAdded) return;
		this.isAdded = true;

		this.labelDiv.className = `label is-moon ${this.data.isMajorMoon ? 'is-major-moon' : ''} ${
			this.data.isInnerMoon ? 'is-inner-moon faded' : ''
		}`;
		this.labelDiv.dataset.selector = 'label';
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `
			<div class="label-content" style="opacity: 0;">
				<div class="label-circle"></div>
				<div class="label-text">${this.data.englishName}</div>
			</div>
			`;
		const CSSObj = new CSS2DObject(this.labelDiv, this);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);

		// calculate orbit
		const { x, y, z } = this.data.startingPosition;
		this.labelGroup.position.set(x, y, z);

		this.labelDiv.addEventListener('pointerdown', () => {
			handleLabelClick(this.data, this.labelGroup);
		});

		// this.labelDiv.addEventListener('pointerover', () => {
		// 	console.log('hovered');
		// });

		this.intervalCheckDistance = setInterval(() => {
			this.handleDistance();
		}, 200);

		this.planetGroup.add(this.labelGroup);

		// building orbitLine after the group is added to the scene, so the group has a parent
		// limiting the number of orbitLines RENDERED to save memory
		this.OrbitLine.build({ renderInvisible: !this.orbitLineVisibleAtBuild });

		gsap.to(this.labelDiv.querySelector('.label-content'), {
			opacity: 1,
			duration: 1,
			onComplete: () => {
				// TODO: meshes should start invisible, or build when the camera is close enough
				this.buildMoonMesh();
			}
		});
	}

	buildMoonMesh() {
		// will return a promise
		const constructMoonMesh = async () => {
			if (this.meshGroup) return this.meshGroup;

			const materialData = this.data.materialData || rawMaterialData.moon;
			const segments = materialData.segments || 32;

			const material = {
				map: materialData.map ? await textureLoader.loadAsync(materialData.map) : null,
				normalMap: materialData.normalMap ? await textureLoader.loadAsync(materialData.normalMap) : null,
				emissiveMap: materialData.emissiveMap ? await textureLoader.loadAsync(materialData.emissiveMap) : null,
				transparent: false,
				emissive: materialData.emissive || null,
				emissiveIntensity: materialData.emissiveIntensity || null
			};

			const moonGroup = new THREE.Group();
			moonGroup.class = this;
			moonGroup.name = `${this.data.englishName} group`;

			const geometry = new THREE.SphereBufferGeometry(this.data.diameter, segments, segments);
			const moonMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(material));
			moonMesh.name = `${this.data.englishName} mesh`;
			moonGroup.add(moonMesh);

			return moonGroup;
		};

		constructMoonMesh().then((meshGroup) => {
			this.meshGroup = meshGroup;
			this.labelGroup.add(meshGroup);
		});
	}

	handleDistance() {
		const distanceFromPlanet = orrery.camera.position.distanceTo({
			x: this.planetGroup.position.x,
			y: this.planetGroup.position.y,
			z: this.planetGroup.position.z
		});

		const distance = orrery.camera.position.distanceTo({
			x: this.planetGroup.position.x + this.labelGroup.position.x,
			y: this.planetGroup.position.y + this.labelGroup.position.y,
			z: this.planetGroup.position.z + this.labelGroup.position.z
		});

		if (this.data.isInnerMoon) {
			if (distanceFromPlanet < innerMoonRangeThreshold) {
				this.labelDiv.classList.remove('faded');
			} else {
				this.labelDiv.classList.add('faded');
			}
		}

		if (this.data.isMajorMoon) {
			if (distanceFromPlanet < majorMoonRangeThreshold) {
				this.labelDiv.classList.remove('faded');
			} else {
				this.labelDiv.classList.add('faded');
			}
		}

		if (this.OrbitLine) {
			if (distance < 3000) {
				this.OrbitLine.fadeOut();
			} else {
				// fixing conflict here with what the PLANET wants to do...
				// this will prevent flickering
				// if we don't do this, the orbit lines won't fade back in...
				if (this.orbitLineVisibleAtBuild && distanceFromPlanet < planetRangeThreshold) {
					this.OrbitLine.fadeIn();
				}
			}
		}
	}

	remove() {
		if (orrery.cameraState._currentPlanetInRange !== this.planetGroup.data.key && !this.fadingOut && this.isAdded) {
			// fading out OrbitLine BEFORE planet (once the planet is gone, so is the line)
			this.fadingOut = true;

			gsap.to(this.labelDiv.querySelector('.label-content'), {
				opacity: 0,
				duration: 1,
				onComplete: () => {
					if (this.OrbitLine) this.OrbitLine.remove();
					// setTimeout seems to allow smoother fading? Weird...
					setTimeout(() => {
						clearInterval(this.intervalCheckDistance);

						// snap the camera back to the planet if the clicked group moon is deloaded
						if (
							orrery.mouseState._clickedGroup &&
							orrery.mouseState._clickedGroup.data &&
							orrery.mouseState._clickedGroup.data.aroundPlanet
						) {
							orrery.mouseState._clickedGroup = orrery.mouseState._clickedGroup.parent;
						}
						this.labelGroup.children.forEach((child) => child.removeFromParent());
						this.planetGroup.remove(this.labelGroup);
						this.isAdded = false;
						this.fadingOut = false;
					}, 100);
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
		this.meshGroup = null;
		this.intervalCheckDistance = null;
		this.fadingIn = false;
		this.fadingOut = false;
		this.isVisible = false;
		this.planetTypeKey = this.data.isDwarfPlanet ? '_dwarfPlanets' : '_planets';

		this.moonClasses = {};
		this.OrbitLine = new OrbitLine(data, this.labelGroup, this);
	}

	build() {
		this.labelDiv.className = `label ${
			this.data.isPlanet || this.data.englishName === 'Sun' ? 'is-planet' : 'is-dwarf-planet'
		} ${this.data.isSun ? 'is-sun' : ''}`;
		this.labelDiv.dataset.selector = 'label';
		this.labelDiv.style.color = this.data.labelColour;
		this.labelDiv.innerHTML = `
			<div class="label-content" style="opacity: 0;">
				<div class="label-circle"></div>
				<div class="label-text" style="color: ${
					this.data.labelColour !== settings.planetColours.default ? this.data.labelColour : ''
				};">${this.data.englishName}</div>
			</div>
			`;
		const CSSObj = new CSS2DObject(this.labelDiv, this);
		CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.englishName} group label`;
		this.labelGroup.data = this.data;
		this.labelGroup.add(CSSObj);
		orrery.bodies._planetLabels[this.data.key] = this.labelGroup;

		// calculate orbit
		if (this.data.startingPosition) {
			const { x, y, z } = this.data.startingPosition;
			this.labelGroup.position.set(x, y, z);
		} else {
			this.labelGroup.position.set(0, 0, 0);
		}

		this.labelDiv.addEventListener('pointerdown', () => {
			handleLabelClick(this.data, this.labelGroup);
		});

		scene.add(this.labelGroup);

		orrery.classes[this.planetTypeKey][this.data.key] = this;

		if (this.data.moons && this.data.moons.length) {
			this.data.moons.forEach((moon) => {
				// now rather than pushing to an array, using key/value pairs for easier referencing
				// is scoped to the planet so can more easily run them through like an array if need tbe
				this.moonClasses[moon.key] = {};
				this.moonClasses[moon.key].class = new MoonLabelClass(moon, this.labelGroup);
				this.moonClasses[moon.key].isBuilt = false;
			});
		}

		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();

		this.fadeIn();

		this.intervalCheckDistance = setInterval(() => {
			this.handleDistance();
		}, 200);

		if (this.data.materialData) {
			this.buildPlanetMesh();
		}
	}

	buildPlanetMesh() {
		// will return a promise
		const constructPlanetMesh = async () => {
			if (this.meshGroup) return this.meshGroup;

			const materialData = this.data.materialData;
			const segments = materialData.segments || 32;

			const material = {
				map: materialData.map ? await textureLoader.loadAsync(materialData.map) : null,
				normalMap: materialData.normalMap ? await textureLoader.loadAsync(materialData.normalMap) : null,
				emissiveMap: materialData.emissiveMap ? await textureLoader.loadAsync(materialData.emissiveMap) : null,
				transparent: false,
				emissive: materialData.emissive || null,
				emissiveIntensity: materialData.emissiveIntensity || null
			};

			const planetGroup = new THREE.Group();
			planetGroup.class = this;
			planetGroup.name = `${this.data.englishName} group`;

			const geometry = new THREE.SphereBufferGeometry(this.data.diameter, segments, segments);
			const planetMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(material));
			planetMesh.name = `${this.data.englishName} mesh`;
			planetGroup.add(planetMesh);

			// if (this.data.englishName === 'Sun') {
			// 	const shaderMaterial = new THREE.ShaderMaterial({
			// 		uniforms: {
			// 			viewVector: {
			// 				type: 'v3',
			// 				value: orrery.camera.position
			// 			}
			// 		},
			// 		vertexShader,
			// 		fragmentShader,
			// 		// side: THREE.FrontSide,
			// 		side: THREE.DoubleSide,
			// 		blending: THREE.AdditiveBlending,
			// 		transparent: true
			// 	});

			// 	const planetGlowMesh = new THREE.Mesh(geometry, shaderMaterial);
			// 	planetGroup.add(planetGlowMesh);
			// 	planetGroup.glow = planetGlowMesh;
			// 	planetGlowMesh.scale.set(1.2, 1.2, 1.2);
			// }

			return planetGroup;
		};

		constructPlanetMesh().then((meshGroup) => {
			this.meshGroup = meshGroup;
			this.labelGroup.add(meshGroup);
		});
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

		if (this.data.isInnerPlanet) {
			if (orrery.cameraState._currentZoomDistanceThreshold === 0) {
				this.labelDiv.classList.remove('faded');
			} else {
				this.labelDiv.classList.add('faded');
			}
		}

		if (distance < planetRangeThreshold) {
			orrery.cameraState._currentPlanetInRange = this.data.key;
			// staggering the building of moon classes to help with performance
			if (this.moonClasses && Object.values(this.moonClasses).length) {
				Object.values(this.moonClasses).forEach((moonClass, i) => {
					if (!moonClass.isBuilt) {
						moonClass.isBuilt = true;
						setTimeout(() => {
							moonClass.class.build();
						}, i * 50);
					}
				});
			}

			// Fade the orbitLine opacity depending on distance here
			if (distance < planetOrbitLineRangeThreshold) {
				this.OrbitLine.fadeOut();
			} else {
				this.OrbitLine.fadeIn();
			}
		} else {
			orrery.cameraState._currentPlanetInRange = ''; // without this on the moons will never disappear

			if (this.moonClasses && Object.values(this.moonClasses).length) {
				Object.values(this.moonClasses).forEach((m, i) => {
					if (m.isBuilt) {
						m.isBuilt = false;
						setTimeout(() => {
							m.class.remove();
						}, i * 20);
					}
				});
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
	}

	remove() {
		clearInterval(this.intervalCheckDistance);
		this.OrbitLine.remove();

		this.labelGroup.children.forEach((child) => child.removeFromParent());
		scene.remove(this.labelGroup);
	}
}

const labelLine = {
	build: (item) => {
		if (!item.includeLabelLine) return;

		const labelGeometry = {
			origInnerRadius: item.diameter * 1.01,
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
