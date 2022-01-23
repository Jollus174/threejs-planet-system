'use strict';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { orrery } from './orrery';
import { scene } from './scene';
import { settings } from './settings';
import { calculateOrbit } from './utilities/astronomy';
import { ringUVMapGeometry } from './utilities/threeJS';
import { textureLoader } from './loadManager'; // still not 100% sure if this creates a new instantiation of it, we don't want that
import { CSS2DObject } from './custom/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/gltfloader';
import { asteroidBelt } from './factories/solarSystemFactory';
import fragmentShader from './shaders/glow/fragmentShader.glsl';
import vertexShader from './shaders/glow/vertexShader.glsl';
import sunFragmentShader from './shaders/sun/fragmentShader.glsl';
import sunVertexShader from './shaders/sun/vertexShader.glsl';
import simpleFragmentShader from './shaders/debug/simpleFragmentShader.glsl';
import simpleVertexShader from './shaders/debug/simpleVertexShader.glsl';
import { materialData as rawMaterialData } from './data/solarSystem';
import { customEventNames } from './events/customEvents';

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
	constructor(data, classRef) {
		this.data = data;
		this.classRef = classRef;
		this.orbitLineName = `${this.data.id} orbit line`;
		this.orbitLine = null;
		this.fadingIn = false;
		this.fadingOut = false;
		this.orbitLineVisibleAtBuild = this.classRef.orbitLineVisibleAtBuild;
		this.opacityDefault = this.data.isDwarfPlanet || this.data.isOuterMoon ? 0.2 : 1;
		this.parentPlanetData = this.data.aroundPlanet
			? orrery.bodies._allPlanets.find((p) => p.id === this.data.aroundPlanet.planet)
			: null;
		this.parentPlanetId = this.parentPlanetData ? this.parentPlanetData.id : null;
		this.parentPlanetType = this.parentPlanetData
			? this.parentPlanetData.isDwarfPlanet
				? '_dwarfPlanets'
				: '_planets'
			: null;
	}

	build() {
		const isMoon = this.data.aroundPlanet;
		const points = [];

		for (let i = this.data.meanAnomaly; i <= this.data.meanAnomaly + 360; i += 1) {
			const v = new THREE.Vector3();
			points.push(v.copy(calculateOrbit(i, this.data, this.parentPlanetData)));
		}

		const orbitPoints = points;

		// create geometry using all points on the circle
		const geometryLine = new THREE.BufferGeometry().setFromPoints(orbitPoints);

		const startColor = new THREE.Color(this.data.labelColour);
		const endColor = new THREE.Color('black');

		const vertCnt = geometryLine.getAttribute('position').count;
		const lerpAcc = 1; // how much fade we want, closer to 0 means fades earlier
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
				visible: this.classRef.orbitLineVisibleAtBuild,
				blending: THREE.AdditiveBlending,
				vertexColors: true
			})
		);

		this.orbitLine.name = this.orbitLineName;

		// to prevent planet orbit lines from 'cutting through' the moon orbit lines due to the transparency fade conflicting with the render order
		if (this.parentPlanetData) {
			this.orbitLine.renderOrder = 2;
		} else {
			this.orbitLine.renderOrder = this.orbitLine.isDwarfPlanet ? 3 : 4;
		}

		this.classRef.labelGroup.parent.add(this.orbitLine);

		// initial page load
		if (this.orbitLine.material.opacity === 0 && this.classRef.orbitLineVisibleAtBuild) {
			this.orbitLineFadeIn();
		}
	}

	orbitLineFadeOut() {
		if (!this.fadingOut && this.orbitLine && this.orbitLine.material.opacity !== 0) {
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

	orbitLineFadeIn() {
		if (!this.fadingIn && this.orbitLine && this.orbitLine.material.opacity !== this.opacityDefault) {
			this.fadingIn = true;
			this.orbitLine.material.visible = true;
			gsap.to(this.orbitLine.material, {
				opacity: this.opacityDefault,
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
					orrery.classes._all[this.parentPlanetId].labelGroup.children
						.find((o) => o.name === this.orbitLineName)
						.removeFromParent();
				}
			});
		}
	}
}

class Entity {
	constructor(data) {
		this.data = data;
		this.labelLink = document.createElement('a');
		this.labelGroup = new THREE.Group({ name: `${this.data.name} group label` });
		this.meshGroup = new THREE.Group({ name: `${this.data.name} mesh group` });
		this.fadingIn = false;
		this.fadingOut = false;
		this.isVisible = false;
		this.CSSObj = new CSS2DObject(this.labelLink, this);
		this.raycaster = new THREE.Raycaster();
		this.raycasterArrow = new THREE.ArrowHelper(0, 0, 200000000, this.data.labelColour);
		this.materialData = this.data.materialData;

		this.intervalCheckTime = 300;
		this.intervalCheckVar = setInterval(this.intervalCheck.bind(this), this.intervalCheckTime);

		this.orbitLineVisibleAtBuild = true;
		this.OrbitLine = new OrbitLine(data, this);

		this.raycasterEnabled = false; // can cause some pretty laggy performance issues

		// for debugging
		this.raycasterArrowEnabled = false;
		// ---
	}

	build() {
		this.setListeners();

		const entityTypeClasses = [
			this.data.id === 'sun' ? 'is-sun' : '',
			this.data.aroundPlanet ? 'is-moon' : '',
			this.data.isPlanet ? 'is-planet' : '',
			this.data.isDwarfPlanet ? 'is-dwarf-planet' : '',
			this.data.isMajorMoon ? 'is-major-moon' : '',
			this.data.isInnerMoon ? 'is-inner-moon' : ''
		]
			.join(' ')
			.trim();

		this.labelLink.href = `/#/${this.data.id}`;
		this.labelLink.className = `label behind-label ${entityTypeClasses}`;
		this.labelLink.dataset.selector = 'label';
		this.labelLink.style.color = this.data.labelColour;
		this.labelLink.style.opacity = 0;
		this.labelLink.innerHTML = `
			<div class="label-content">
				<div class="label-circle"></div>
				<div class="label-text" style="color: ${
					this.data.labelColour !== settings.planetColours.default ? this.data.labelColour : ''
				};">${this.data.displayName}</div>
			</div>
			`;
		this.CSSObj.name = this.data.id;
		this.CSSObj.position.set(0, 0, 0);

		this.labelGroup.name = `${this.data.id} group label`;
		this.labelGroup.data = this.data;

		orrery.bodies._planetLabels[this.data.id] = this.labelGroup;

		if (this.data.startingPosition) {
			this.labelGroup.position.copy(this.data.startingPosition);
		} else {
			this.labelGroup.position.set(0, 0, 0);
		}

		this.labelGroup.add(this.CSSObj);
		scene.add(this.labelGroup);

		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();

		if (this.materialData) {
			this.createEntityMesh();
		}

		if (!this.fadingIn && !this.isVisible) {
			this.fadingIn = true;
			this.visible = true;
			gsap.to(this.labelLink, {
				opacity: 1,
				duration: 1,
				onComplete: () => {
					this.fadingIn = false;
					this.isVisible = true;
					this.labelLink.style.pointerEvents = '';
				}
			});
		}
	}

	setListeners() {
		this.labelLink.addEventListener('pointerdown', () => {
			// TODO: turning this off for now since it breaks on deployed build
			// window.location = this.labelLink.href; // OrbitControls eats the native click events :(
			document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: this }));
		});

		this.labelLink.addEventListener('mouseover', () => {
			orrery.mouseState._hoveredClass = this;
		});

		this.labelLink.addEventListener('mouseleave', () => {
			orrery.mouseState._hoveredClass = '';
		});
	}

	async constructEntityMesh() {
		// TODO: Am unsure about this
		if (this.meshGroup && this.meshGroup.children.length) return;

		const segments = this.materialData.segments || 32;
		const materialProps = {
			map: this.materialData.map ? await textureLoader.loadAsync(this.materialData.map) : null,
			normalMap: this.materialData.normalMap ? await textureLoader.loadAsync(this.materialData.normalMap) : null,
			transparent: false,
			emissiveMap: this.materialData.emissiveMap ? await textureLoader.loadAsync(this.materialData.emissiveMap) : null,
			emissive: this.materialData.emissive || null,
			emissiveIntensity: this.materialData.emissiveIntensity || null
		};

		this.meshGroup.class = this;

		const geometry = new THREE.SphereBufferGeometry(this.data.diameter, segments, segments);
		const material = new THREE.MeshStandardMaterial(materialProps);

		const entityMesh = new THREE.Mesh(geometry, material);
		entityMesh.name = this.data.id;
		entityMesh.class = this;
		entityMesh.castShadow = true;
		entityMesh.receiveShadow = false;

		return entityMesh;
	}

	async constructRingMeshes(ring, i) {
		if (!ring) return;
		const ringMaterial = {
			map: ring.map ? await textureLoader.loadAsync(ring.map) : null,
			normalMap: ring.normalMap ? await textureLoader.loadAsync(ring.normalMap) : null,
			transparent: false,
			emissiveMap: ring.emissiveMap ? await textureLoader.loadAsync(ring.emissiveMap) : null,
			emissive: ring.emissive || null,
			emissiveIntensity: ring.emissiveIntensity || null,
			side: THREE.DoubleSide,
			blending: THREE.CustomBlending
		};

		ringMaterial.blendEquation = THREE.MaxEquation;
		ringMaterial.blendSrc = THREE.OneFactor;
		ringMaterial.blendDst = THREE.DstAlphaFactor;

		const ringMesh = new THREE.Mesh(
			ringUVMapGeometry(
				this.data.meanRadius + this.data.rings[i].inner,
				this.data.meanRadius + this.data.rings[i].outer
			),
			new THREE.MeshStandardMaterial(ringMaterial)
		);

		ringMesh.name = `${this.data.id} ring ${i}`;
		ringMesh.receiveShadow = true;

		return ringMesh;
	}

	// TODO: set distance checker to fade label when zoomed in

	createEntityMesh() {
		this.constructEntityMesh().then((mesh) => {
			this.meshGroup.add(mesh);
			this.labelGroup.add(this.meshGroup);

			if (this.materialData.rings) {
				const ringMeshPromises = this.materialData.rings.map((ring, i) => {
					return this.constructRingMeshes(ring, i);
				});

				Promise.all(ringMeshPromises).then((ringMeshes) => {
					ringMeshes.forEach((ringMesh) => {
						// TODO: this will need to be adjusted later
						ringMesh.rotation.x = THREE.MathUtils.degToRad(90);
						this.meshGroup.add(ringMesh);
					});
				});
			}
		});
	}

	// for updates that need to happen in the main render loop
	// draw() {};

	// is overwritten by child classes
	intervalCheck() {}

	updateRaycaster() {
		// TODO: This should only run when in range of a planet?
		// or just run it against the Sun if not in range...
		if (this.CSSObj.inFrustum) {
			const cameraPos = orrery.camera.position;
			const thisPos = new THREE.Vector3();
			this.labelGroup.getWorldPosition(thisPos);
			const vDirection = new THREE.Vector3();
			const direction = vDirection.subVectors(thisPos, cameraPos).normalize();
			this.raycaster.set(cameraPos, direction);
			this.raycasterArrow.position.copy(cameraPos);
			this.raycasterArrow.setDirection(direction);

			// TODO: could be more efficient?
			const intersects = this.raycaster.intersectObjects(scene.children, true);
			// temporarily skipping sun since plane is huge
			const meshIntersects = intersects.filter(
				// (i) => i.object && i.object.type === 'Mesh' && i.object.name !== 'skybox' && i.object.name !== 'sun'
				(i) => i.object && i.object.type === 'Mesh' && i.object.name !== 'skybox'
			);

			if (meshIntersects.length && meshIntersects[0].object.name !== this.data.id) {
				this.labelLink.classList.add('behind-planet');
			} else {
				this.labelLink.classList.remove('behind-planet');
			}
		}
	}

	// setTimeout(() => {
	// 	this.intervalCheckDistance = setInterval(() => {
	// 		this.handleDistance();
	// 		// if (this.CSSObj.inFrustum) {
	// 		// 	this.updateRaycaster();
	// 		// }
	// 	}, 200);
	// 	if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
	// }, 500);

	remove() {
		// if (orrery.cameraState._currentPlanetInRange !== this.planetGroup.data.id && !this.fadingOut && this.isAdded) {
		if (!this.fadingOut && this.isAdded) {
			// fading out OrbitLine BEFORE entity (once the entity is gone, so is the line)
			this.fadingOut = true;

			gsap.to(this.labelLink, {
				opacity: 0,
				duration: 1,
				onComplete: () => {
					if (this.OrbitLine) this.OrbitLine.remove();
					// setTimeout seems to allow smoother fading? Weird...
					setTimeout(() => {
						clearInterval(this.intervalCheckVar);

						// snap the camera back to the planet if the clicked group moon is deloaded
						if (orrery.mouseState._clickedGroup && orrery.mouseState._clickedGroup.data.aroundPlanet) {
							orrery.mouseState._clickedGroup = orrery.mouseState._clickedGroup.parent;
						}
						this.labelGroup.children.forEach((child) => child.removeFromParent());
						this.labelGroup.removeFromParent();
						this.isAdded = false;
						this.fadingOut = false;
						if (this.raycasterArrowEnabled) this.raycasterArrow.removeFromParent();
					}, 100);
				}
			});
		}
	}
}

// TODO: Could probably use a new class for an interval distance checker...

class Planet extends Entity {
	constructor(data) {
		super(data);
		this.moonClasses = {};
	}

	intervalCheck() {
		if (this.raycasterEnabled) {
			this.updateRaycaster();
			if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
		}

		const distance = orrery.camera.position.distanceTo(this.labelGroup.position);
		const cameraZoomedToPlanet = distance < this.data.zoomTo + 50000000;

		if (cameraZoomedToPlanet) {
			orrery.cameraState._currentPlanetInRange = this.data.id;
			// this.labelLink.classList.add('faded');

			// staggering the building of moon classes to help with performance
			if (this.moonClasses && Object.values(this.moonClasses).length) {
				Object.values(this.moonClasses).forEach((moonClass, i) => {
					if (!moonClass.isAdded) {
						setTimeout(() => {
							moonClass.build();
						}, i * 20);
					}
				});
			}
		} else {
			// TODO: Need a fix for if a second planet immediately replaces the previous one
			if (orrery.cameraState._currentPlanetInRange === this.data.id) {
				orrery.cameraState._currentPlanetInRange = '';
				// this.labelLink.classList.remove('faded');
			}

			if (this.moonClasses && Object.values(this.moonClasses).length) {
				Object.values(this.moonClasses).forEach((moonClass, i) => {
					if (moonClass.isAdded) {
						setTimeout(() => {
							moonClass.remove();
						}, i * 20);
					}
				});
			}
		}

		if (this.OrbitLine) {
			// if (
			// !orrery.cameraState._currentPlanetInRange ||
			// (orrery.cameraState._currentPlanetInRange && orrery.cameraState._currentPlanetInRange === this.data.id) ||
			// !orrery.cameraState._isInPlaneOfReference ||
			// (orrery.mouseState._clickedClass && orrery.mouseState._clickedClass.data.id === this.data.id) ||
			// (orrery.mouseState._hoveredClass && orrery.mouseState._hoveredClass.data.id === this.data.id)
			// ) {
			this.OrbitLine.orbitLineFadeIn();
			// } else {
			// this.OrbitLine.fadeOut();
			// }
		}
	}
}

class DwarfPlanet extends Planet {
	constructor(data) {
		super(data);
		this.planetTypeKey = '_dwarfPlanets';
	}
}

class Asteroid extends Planet {
	constructor(data) {
		super(data);
		this.planetTypeKey = '_asteroid';
	}
}

class Sun extends Entity {
	constructor(data) {
		super(data);
		this.uniforms = {
			aspectRatio: { type: 'f', value: window.innerWidth / window.innerHeight },
			sunPos: { type: 'v3', value: new THREE.Vector3() },
			sunScreenPos: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
			sunSize: { type: 'f', value: 0.1 },
			randAngle: { type: 'f', value: 0.1 },
			camAngle: { type: 'f', value: 0.26 }
		};
		// this.raycasterEnabled = false;
	}

	// intervalCheck() {
	// 	if (this.raycasterEnabled) {
	// 		this.updateRaycaster();
	// 		if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
	// 	}
	// }

	// async constructEntityMesh() {
	// 	if (this.meshGroup) return this.meshGroup;

	// 	const meshGroup = new THREE.Group();
	// 	meshGroup.class = this;
	// 	meshGroup.name = this.data.id;

	// 	// const geometry = new THREE.SphereBufferGeometry(this.data.diameter, segments, segments);
	// 	const largestOrbit = Math.max(...orrery.bodies._all.map((o) => o.aphelion));
	// 	const geometry = new THREE.PlaneBufferGeometry(largestOrbit, largestOrbit, 10);
	// 	const material = new THREE.ShaderMaterial({
	// 		uniforms: this.uniforms,
	// 		vertexShader: sunVertexShader,
	// 		fragmentShader: sunFragmentShader,
	// 		transparent: true
	// 	});

	// 	meshGroup.renderOrder = 1;

	// 	const entityMesh = new THREE.Mesh(geometry, material);
	// 	entityMesh.name = this.data.id;
	// 	entityMesh.class = this;
	// 	entityMesh.castShadow = true;
	// 	entityMesh.receiveShadow = false;

	// 	meshGroup.add(entityMesh);

	// 	return meshGroup;
	// }

	draw() {
		// if (!this.meshGroup) return;
		// const camToSun = orrery.camera.position.clone().sub(this.labelGroup.position);
		// const groupPosition = new THREE.Vector3();
		// this.labelGroup.getWorldPosition(groupPosition);
		// // const sunScreenPos = this.labelGroup.position.project(orrery.camera);
		// this.uniforms.sunPos.value.copy(camToSun.multiplyScalar(-1));
		// const visibleW = Math.tan(THREE.MathUtils.degToRad(orrery.camera.fov) / 2) * camToSun.length() * 2;
		// const sunScreenRatio = this.data.diameter / visibleW;
		// this.uniforms.sunSize.value = sunScreenRatio;
		// this.uniforms.randAngle.value = this.uniforms.randAngle.value + 0.001;
		// this.uniforms.camAngle.value = camToSun.angleTo(new THREE.Vector3(1, 1, 0));
		// this.uniforms.sunScreenPos.value = new THREE.Vector3(0, 0, 0);
		// this.labelGroup.lookAt(orrery.camera.position);
	}
}

class Moon extends Entity {
	constructor(data, planetClass) {
		super(data);
		this.isAdded = false;
		this.planetClass = planetClass;
		this.planetGroup = this.planetClass.labelGroup;
		this.materialData = this.data.materialData || rawMaterialData._moon;
		this.orbitLineVisibleAtBuild = this.planetClass.data.moons.length < 20 || this.data.perihelion < 10000000; // orbit line limits set here

		// All entities by default have an interval check. Want this cleared for moons since they start hidden
		clearInterval(this.intervalCheckVar);
	}

	build() {
		if (this.isAdded) return;
		this.isAdded = true;

		this.labelGroup.add(this.CSSObj);
		this.planetGroup.add(this.labelGroup);

		this.setListeners();

		this.OrbitLine.build();
		this.createEntityMesh();

		gsap.to(this.labelLink, {
			opacity: 1,
			duration: 1,
			onComplete: () => {
				// Moon meshes build when camera is in planet orbit, and are destroyed when camera leaves orbit
				// Need to check to see if mesh already built
				this.intervalCheckVar = setInterval(() => {
					this.intervalCheck();
				}, this.intervalCheckTime);
			}
		});
	}

	/* 	intervalCheck() {
		if (this.raycasterEnabled) {
			this.updateRaycaster();
			if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
		}

		const v3 = new THREE.Vector3();
		const moonWorldPosition = this.labelGroup.getWorldPosition(v3);
		this.distanceFromCamera = orrery.camera.position.distanceTo(moonWorldPosition);
		const cameraZoomedToMoon = this.distanceFromCamera < this.data.zoomTo + 10000;

		if (cameraZoomedToMoon) {
			this.labelLink.classList.add('faded');
		} else {
			this.labelLink.classList.remove('faded');
		}

		// if (this.OrbitLine) {
		// 	if (cameraZoomedToMoon) {
		// 		this.OrbitLine.fadeOut();
		// 	} else {
		// 		if (
		// 			(this.orbitLineVisibleAtBuild && this.distanceFromPlanet < planetRangeThreshold) ||
		// 			(orrery.mouseState._clickedClass && orrery.mouseState._clickedClass.data.id === this.data.id) ||
		// 			(orrery.mouseState._hoveredClass && orrery.mouseState._hoveredClass.data.id === this.data.id)
		// 		) {
		// 			this.OrbitLine.fadeIn();
		// 		} else {
		// 			this.OrbitLine.fadeOut();
		// 		}
		// 	}
		// }
	} */
}

export { setOrbitVisibility, OrbitLine, Planet, DwarfPlanet, Asteroid, Sun, Moon };
