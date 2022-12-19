'use strict';
import * as THREE from 'three';
import { GodRaysEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { orrery } from './orrery';
import { scene } from './scene';
import { settings } from './settings';
import { calculateOrbit } from './utilities/astronomy';
import { ringUVMapGeometry } from './utilities/threeJS';
import { textureLoader, imageBitmapLoader } from './loadManager';
import { CSS2DObject } from './custom/jsm/renderers/CSS2DRenderer';
import { asteroidBelt } from './factories/solarSystemFactory';
import { materialData as rawMaterialData } from './data/solarSystem';
import { customEventNames } from './events/customEvents';

const planetRangeThreshold = 100000000;
// const planetRangeThreshold = 500000000; // Jupiter moons appear from Ceres at higher range...

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
		this.geometryLine = null;
		this.vertexCount = null;
		this.colors = null;
		this.startColor = new THREE.Color(this.data.moonGroupColor || this.data.labelColour);
		this.endColor = new THREE.Color('black'); // TODO: this really should be some sort of alpha fade... hmmm....;
		this.parentPlanetData = this.data.aroundPlanet
			? orrery.bodies._allPlanets.find((p) => p.id === this.data.aroundPlanet.planet)
			: null;
		this.amountOfOrbitToDraw = this.data.bodyType === 'Moon' ? 180 : 330; // 360 means full circle
	}

	drawLine(iterator) {
		const orbitPoints = [];
		const i = iterator || 0;
		for (
			let theta = this.data.meanAnomaly - i;
			theta <= this.data.meanAnomaly + this.amountOfOrbitToDraw - i;
			theta += 1
		) {
			orbitPoints.push(calculateOrbit(theta, this.data, this.parentPlanetData));
		}

		// deleting last geometry line if iterated upon, otherwise they'll start to chew up lots of memory
		if (this.geometryLine) this.geometryLine.dispose();
		// create geometry using all points on the circle
		this.geometryLine = new THREE.BufferGeometry().setFromPoints(orbitPoints);
		this.vertexCount = this.vertexCount || this.geometryLine.getAttribute('position').count;

		this.colors = this.colors || this.generateColors();
		this.geometryLine.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
		return this.geometryLine;
	}

	generateColors() {
		// how much fade we want, closer to 0 means fades earlier
		const lerpAcc = this.data.bodyType === 'Moon' ? 0.75 : 1;
		const lerpIncrementer = 1 / this.amountOfOrbitToDraw / lerpAcc;

		const colors = new Float32Array(this.vertexCount * 3);
		if (this.data.sideralOrbitDirection === 'Prograde') {
		for (let c = this.amountOfOrbitToDraw; c >= 0; c -= 1) {
			const lerpColor = new THREE.Color(this.startColor);
			lerpColor.lerpColors(this.startColor, this.endColor, c * lerpIncrementer);

			colors[c * 3 + 0] = lerpColor.r;
			colors[c * 3 + 1] = lerpColor.g;
			colors[c * 3 + 2] = lerpColor.b;
		}
		} else {
			// all because some of the moons have to go all yeehaa and orbit in the other direction
			for (let c = 0; c <= this.amountOfOrbitToDraw; c += 1) {
				const lerpColor = new THREE.Color(this.startColor);
				lerpColor.lerpColors(this.startColor, this.endColor, c * lerpIncrementer);
				colors[c * 3 + 0] = lerpColor.r;
				colors[c * 3 + 1] = lerpColor.g;
				colors[c * 3 + 2] = lerpColor.b;
			}
		}

		return colors;
	}

	build() {
		this.orbitLine = new THREE.Line(
			this.drawLine(),
			new THREE.LineBasicMaterial({
				transparent: true,
				opacity: this.classRef.orbitLineOpacityDefault,
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
		// if (this.orbitLine.material.opacity === 0 && this.classRef.orbitLineVisibleAtBuild) {
		// 	this.orbitLineFadeIn();
		// }
	}

	// TODO: Probably remove these since they rely on a loop and will overwrite any other opacity updates
	/* orbitLineFadeOut() {
		if (!this.orbitLine || !this.orbitLine.material) return;
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
	} */

	/* orbitLineFadeIn() {
		if (!this.orbitLine || !this.orbitLine.material) return;
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
	} */

	eventHovered() {
		orrery.mouseState._hoveredClass = this.classRef;
		if (!this.orbitLine) return;
		gsap.to(this.orbitLine.material, {
			opacity: 1,
			duration: 0.25
		});
	}
	eventUnhovered() {
		orrery.mouseState._hoveredClass = '';
		if (!this.orbitLine) return;
		gsap.to(this.orbitLine.material, {
			opacity: this.classRef.orbitLineOpacityDefault,
			duration: 0.25
		});
	}

	destroy() {
		if (!this.orbitLine || !this.orbitLine.material) return;
		if (!this.fadingOut) {
			this.fadingOut = true;
			gsap.to(this.orbitLine.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					this.orbitLine.removeFromParent();
					this.fadingOut = false;
				}
			});
		}
	}
}

class EquatorLine {
	constructor(data, classRef) {
		this.data = data;
		this.classRef = classRef;
		this.lineName = `${this.data.id} equator line`;
		this.line = null;
		this.fadingIn = false;
		this.fadingOut = false;
	}

	build() {
		const equatorPoints = [];
		for (let theta = 0; theta < 360; theta++) {
			const r = this.data.diameter * 1.1;
			const x = Math.sin(THREE.MathUtils.degToRad(theta * -1)) * r;
			const z = Math.cos(THREE.MathUtils.degToRad(theta)) * r;
			equatorPoints.push(new THREE.Vector3(x, 0, z));
		}
		const geometryLine = new THREE.BufferGeometry().setFromPoints(equatorPoints);
		const color = this.data.sideralRotation >= 0 ? new THREE.Color(0.933, 0.4, 0.4) : new THREE.Color(0.2, 0.8, 0.933);

		this.line = new THREE.Line(
			geometryLine,
			new THREE.LineDashedMaterial({
				color,
				visible: this.classRef.orbitLineVisibleAtBuild,
				scale: 10 / this.data.diameter,
				dashSize: 3,
				gapSize: 2,
				transparent: true,
				opacity: 0.3
			})
		);
		this.line.computeLineDistances();

		this.line.name = this.lineName;

		this.classRef.labelGroup.add(this.line);
	}

	destroy() {
		if (!this.equatorLine || !this.equatorLine.material) return;
		if (!this.fadingOut) {
			this.fadingOut = true;
			gsap.to(this.equatorLine.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					this.equatorLine.removeFromParent();
					this.fadingOut = false;
				}
			});
		}
	}
}

class PolesLine {
	constructor(data, classRef) {
		this.data = data;
		this.classRef = classRef;
		this.lineName = `${this.data.id} poles line`;
		this.line = null;
		this.fadingIn = false;
		this.fadingOut = false;
	}

	build() {
		const polesPoints = [
			new THREE.Vector3(0, this.data.diameter * 1.15, 0),
			new THREE.Vector3(0, this.data.diameter * -1.15, 0)
		];

		const geometryLine = new THREE.BufferGeometry().setFromPoints(polesPoints);
		const color = new THREE.Color(0xffffff);

		this.line = new THREE.Line(
			geometryLine,
			new THREE.LineDashedMaterial({
				color,
				visible: this.classRef.orbitLineVisibleAtBuild,
				scale: 60 / this.data.diameter,
				dashSize: 1,
				gapSize: 1,
				transparent: true,
				opacity: 0.3
			})
		);
		this.line.computeLineDistances();

		this.line.name = this.lineName;

		this.classRef.labelGroup.add(this.line);
	}

	destroy() {
		if (!this.polesLine || !this.polesLine.material) return;
		if (!this.fadingOut) {
			this.fadingOut = true;
			gsap.to(this.polesLine.material, {
				opacity: 0,
				duration: 0.25,
				onComplete: () => {
					this.polesLine.removeFromParent();
					this.fadingOut = false;
				}
			});
		}
	}
}

class Entity {
	constructor(data) {
		this.data = data;
		this.labelLink = document.createElement('a');
		this.labelGroup = new THREE.Group();
		this.meshGroup = new THREE.Group();
		this.surfaceMesh = null;
		this.cloudMesh = null;
		this.isBuilt = false;
		this.CSSObj = new CSS2DObject(this.labelLink, this);
		this.raycaster = new THREE.Raycaster();
		this.raycasterArrow = new THREE.ArrowHelper(0, 0, 200000000, this.data.labelColour);
		this.materialData = this.data.materialData;
		this.segments = this.data.materialData ? this.data.materialData.segments : 32;

		this.intervalCheckTime = 1000;
		this.intervalCheckVar = setInterval(this.intervalCheck.bind(this), this.intervalCheckTime);

		this.orbitLineVisibleAtBuild = true;
		this.orbitLineOpacityDefault = 0.5;
		this.OrbitLine = new OrbitLine(data, this);
		this.EquatorLine = new EquatorLine(data, this);
		this.PolesLine = new PolesLine(data, this);

		this.raycasterEnabled = false; // can cause some pretty laggy performance issues

		// for debugging
		this.raycasterArrowEnabled = false;

		this.time = orrery.time;
		// ---

		this.eventPointerDown = () => {
			document.dispatchEvent(new CustomEvent(customEventNames.updateClickTarget, { detail: this }));
		};
		this.eventMouseOver = () => {
			this.OrbitLine.eventHovered();
		};
		this.eventMouseLeave = () => {
			this.OrbitLine.eventUnhovered();
		};
	}

	async build() {
		scene.add(this.labelGroup);
		this.setLabelGroupDefaultPosition();
		this.createCSSLabel();

		// building orbitLine after the group is added to the scene, so the group has a parent
		this.OrbitLine.build();
		this.EquatorLine.build();
		this.PolesLine.build();
		this.labelLink.style.pointerEvents = '';
		this.isBuilt = true;

		await this.renderEntityMesh().then(() => {
			return this;
		});
	}

	createCSSLabel() {
		// checking to see if a label has already been built to avoid duplicate builds + listeners
		if (this.labelGroup.children.some((i) => i.isCSS2DObject)) return;

		const entityTypeClasses = [
			this.data.id === '_sun' ? 'is-sun' : '',
			this.data.aroundPlanet ? 'is-moon' : '',
			this.data.isPlanet ? 'is-planet' : '',
			this.data.isDwarfPlanet ? 'is-dwarf-planet' : '',
			this.data.isMajorMoon ? 'is-major-moon' : '',
			this.data.isInnerMoon ? 'is-inner-moon' : ''
		]
			.join(' ')
			.trim();

		// TODO: turn this back on when links are performing correctly
		// this.labelLink.href = `/#/${this.data.id}`;
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
		this.labelGroup.add(this.CSSObj);

		gsap.to(this.labelLink, {
			opacity: 1,
			duration: 1,
			onComplete: () => {}
		});

		this.labelLink.addEventListener('pointerdown', this.eventPointerDown);
		this.labelLink.addEventListener('mouseover', this.eventMouseOver);
		this.labelLink.addEventListener('mouseleave', this.eventMouseLeave);
	}

	removeCSSLabel() {
		if (!this.labelGroup.children.some((i) => i.isCSS2DObject)) return;
		this.labelLink.removeEventListener('pointerDown', this.eventPointerDown);
		this.labelLink.removeEventListener('mouseover', this.eventMouseOver);
		this.labelLink.removeEventListener('mouseleave', this.eventMouseLeave);
		this.CSSObj.removeFromParent();
	}

	setLabelGroupDefaultPosition() {
		if (this.data.startingPosition) {
			this.labelGroup.position.copy(this.data.startingPosition);
		} else {
			this.labelGroup.position.set(0, 0, 0);
		}
	}

	resetLabelGroupPosition() {
		this.setLabelGroupDefaultPosition();
		if (this.OrbitLine && this.OrbitLine.orbitLine) this.OrbitLine.orbitLine.geometry = this.OrbitLine.drawLine(0);
	}

	// TODO: am unsure if should be using 'copy' on all of these...
	iteratePosition() {
		if (!this.meshGroup.visible) return;
		// if (!this.isVisible) return;
		const i = (orrery.dateTimeDifference * 360) / (this.data.sideralOrbit || 360);
		this.labelGroup.position.copy(
			calculateOrbit(this.data.meanAnomaly - i, this.data, this.planetClass ? this.planetClass.data : null)
		);

		// careful, this causes the memory to massively leak!
		if (this.OrbitLine && this.OrbitLine.orbitLine) {
			this.OrbitLine.orbitLine.geometry = this.OrbitLine.drawLine(i);
			// this.OrbitLine.colorLine(i);
		}
	}

	setEnabled(shouldEnable) {
		if (shouldEnable === true) {
			this.isEnabled = true;
			this.orbitLineOpacityDefault = 0.5;
			if (this.OrbitLine.orbitLine && this.OrbitLine.orbitLine.material && this.OrbitLine.orbitLine.material.opacity) {
				this.OrbitLine.orbitLine.material.opacity = 0.5;
			}
		} else {
			this.isEnabled = false;
		}
	}

	setSelected(shouldSelect) {
		if (shouldSelect === true) {
			this.isSelected = true;
			this.orbitLineOpacityDefault = 0.7;
			if (this.OrbitLine.orbitLine && this.OrbitLine.orbitLine.material && this.OrbitLine.orbitLine.material.opacity) {
				this.OrbitLine.orbitLine.material.opacity = 0.7;
			}
		} else {
			this.isSelected = false;
		}
	}

	async constructTextures() {
		// setting default fallbacks
		const { map = null, normalMap = null, bumpMap = null, shininess = 20, side = THREE.FrontSide } = this.materialData;

		const materialProps = {
			name: `${this.data.name} material`,
			map: map ? await imageBitmapLoader.loadAsync(map).then((t) => new THREE.CanvasTexture(t)) : null,
			normalMap: normalMap
				? await imageBitmapLoader.loadAsync(normalMap).then((t) => new THREE.CanvasTexture(t))
				: null,
			bumpMap: bumpMap ? await imageBitmapLoader.loadAsync(bumpMap).then((t) => new THREE.CanvasTexture(t)) : null,
			bumpScale: bumpMap ? 0.015 : null,
			shininess,
			side,
			transparent: false,
			wireframe: false
		};

		return materialProps;
	}

	async constructCloudTextures() {
		if (!this.materialData || !this.materialData.clouds) return null;
		const { clouds = null, cloudsAlpha = null } = this.materialData;

		const cloudMaterialProps = {
			name: `${this.data.name} clouds`,
			map: clouds ? await imageBitmapLoader.loadAsync(clouds).then((t) => new THREE.CanvasTexture(t)) : null,
			alphaMap: cloudsAlpha
				? await imageBitmapLoader.loadAsync(cloudsAlpha).then((t) => new THREE.CanvasTexture(t))
				: null,
			transparent: true,
			opacity: 0.9
		};
		cloudMaterialProps.map.minFilter = THREE.LinearFilter;

		return cloudMaterialProps;
	}

	async constructEntityMesh() {
		if (this.meshGroup && this.meshGroup.children.length) return null;

		const geometry = new THREE.SphereBufferGeometry(this.data.diameter, this.segments, this.segments);
		const loaderMaterial = new THREE.MeshPhongMaterial({
			color: new THREE.Color(0x000000),
			transparent: true,
			opacity: 0.2
		});

		const entityMesh = new THREE.Mesh(geometry, loaderMaterial);
		entityMesh.name = this.data.id;

		return entityMesh;
	}

	async constructRingMeshes(ring, i) {
		if (!ring) return;
		const { map = null, mapAlpha = null, opacity = 0.98, emissive = { r: 0, g: 0, b: 0 } } = ring;
		const ringMaterial = {
			map: map ? await imageBitmapLoader.loadAsync(map).then((t) => new THREE.CanvasTexture(t)) : null,
			alphaMap: mapAlpha ? await imageBitmapLoader.loadAsync(mapAlpha).then((t) => new THREE.CanvasTexture(t)) : null,
			transparent: true,
			emissive: emissive.r || emissive.g || emissive.b ? new THREE.Color(emissive.r, emissive.g, emissive.b) : null,
			opacity,
			side: THREE.DoubleSide
		};

		const ringMesh = new THREE.Mesh(
			ringUVMapGeometry(
				this.data.meanRadius + this.data.rings[i].inner,
				this.data.meanRadius + this.data.rings[i].outer
			),
			new THREE.MeshPhongMaterial(ringMaterial)
		);

		ringMesh.name = `${this.data.id} ring ${i}`;
		ringMesh.receiveShadow = true;

		return ringMesh;
	}

	applyTextures() {
		this.constructTextures().then((textureObj) => {
			this.mesh.material.dispose(); // remove the pre-loader wireframe material
			this.mesh.material = new THREE.MeshPhongMaterial(textureObj);
		});
	}
	applyClouds() {
		this.constructCloudTextures().then((textureObj) => {
			const cloudMesh = new THREE.Mesh(
				new THREE.SphereGeometry(this.data.diameter * 1.01, this.segments, this.segments),
				new THREE.MeshPhongMaterial(textureObj)
			);

			this.cloudMesh = cloudMesh;
			this.cloudMesh.name = `${this.data.id} clouds`;
			this.meshGroup.add(this.cloudMesh);
		});
	}

	async renderEntityMesh() {
		if (!this.materialData) return this;
		const mesh = await this.constructEntityMesh();
		this.mesh = mesh;

		this.meshGroup.name = `${this.data.name} mesh group`;
		this.meshGroup.add(mesh);

		this.labelGroup.rotation.z = THREE.MathUtils.degToRad(this.data.axialTilt);
		this.labelGroup.add(this.meshGroup);

		if (this.materialData.rings) {
			const ringMeshPromises = this.materialData.rings.map((ring, i) => this.constructRingMeshes(ring, i));

			await Promise.all(ringMeshPromises).then((ringMeshes) => {
				for (const ringMesh of ringMeshes) {
					ringMesh.rotation.x = THREE.MathUtils.degToRad(90);
					this.meshGroup.add(ringMesh);
				}
			});
		}
	}

	// for updates that need to happen in the main render loop
	draw() {
		if (this.meshGroup.visible) {
			this.meshGroup.rotation.y = orrery.time.getElapsedTime() * (-1 / (this.data.sideralRotation * 10));

			if (this.EquatorLine && this.EquatorLine.line) {
				this.EquatorLine.line.rotation.y = orrery.time.getElapsedTime() * (-1 / 50);
			}

			if (this.cloudMesh && (this.materialData.cloudsRotateX || this.materialData.cloudsRotateY)) {
				this.cloudMesh.rotation.y = orrery.time.getElapsedTime() * this.materialData.cloudsRotateX * -1;
				this.cloudMesh.rotation.x = orrery.time.getElapsedTime() * this.materialData.cloudsRotateY * -1;
			}
		}
	}

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

	destroy() {
		// if (orrery.cameraState._currentPlanetInRange !== this.planetGroup.data.id && !this.fadingOut && this.isBuilt) {
		if (this.isBuilt) {
			if (this.OrbitLine) this.OrbitLine.destroy();
			if (this.EquatorLine) this.EquatorLine.destroy();
			if (this.PolesLine) this.PolesLine.destroy();
			setTimeout(() => {
				clearInterval(this.intervalCheckVar);

				// snap the camera back to the planet if the clicked group moon is deloaded
				if (orrery.mouseState._clickedGroup && orrery.mouseState._clickedGroup.data.aroundPlanet) {
					orrery.mouseState._clickedGroup = orrery.mouseState._clickedGroup.parent;
				}
				// all we really want is to clear the label
				// the mesh can remain, but it should be hidden (this may change in future)
				this.CSSObj.removeFromParent();
				this.fadingOut = false;
				this.meshGroup.visible = false;
				if (this.raycasterArrowEnabled) this.raycasterArrow.removeFromParent();
			}, 100);
			this.isBuilt = false;
		}
	}
}

// TODO: Could probably use a new class for an interval distance checker...

class Planet extends Entity {
	constructor(data) {
		super(data);
		this.moonClasses = {};
		this.isZoomedToPlanet = true;
	}

	intervalCheck() {
		if (this.raycasterEnabled) {
			this.updateRaycaster();
			if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
		}

		const distance = orrery.camera.position.distanceTo(this.labelGroup.position);
		const cameraZoomedToPlanet = distance < this.data.zoomTo + planetRangeThreshold;
		const planetIsTargeted = orrery.mouseState._zoomedClass && orrery.mouseState._zoomedClass.data.id === this.data.id;
		const planetMoonIsTargeted =
			orrery.mouseState._zoomedClass &&
			orrery.mouseState._zoomedClass.planetClass &&
			orrery.mouseState._zoomedClass.planetClass.data.id === this.data.id;

		if (cameraZoomedToPlanet) {
			if (!this.isZoomedToPlanet && (planetIsTargeted || planetMoonIsTargeted)) {
				this.createCSSLabel(); // in case it was removed via a moon selection
				this.isZoomedToPlanet = true; // to prevent multiple executions
				// this.labelGroup.visible = true;
				// destroying previous set of moons first
				// this.destroyMoons(Object.values(this.moonClasses));
				orrery.cameraState._currentPlanetInRange = this.data.id;
				const moonsToBuild = Object.values(this.moonClasses).filter((m) => m.isEnabled && !m.isBuilt);
				this.buildMoons(moonsToBuild);

				// if a material hasn't loaded, load it and put that in
				if (!this.mesh.material.name) {
					this.applyTextures();
				}

				// if we need clouds, create a new mesh for them
				if (this.materialData.clouds && !this.cloudMesh) {
					this.applyClouds();
				}
			}
		} else {
			if (!planetIsTargeted && this.isZoomedToPlanet) {
				this.isZoomedToPlanet = false;
				// this.labelGroup.visible = false;
				if (orrery.cameraState._currentPlanetInRange === this.data.id) {
					this.destroyMoons(Object.values(this.moonClasses));
					orrery.cameraState._currentPlanetInRange = '';
				}
				// const moonsToDestroy = Object.values(this.moonClasses).filter((m) => !m.isEnabled && m.isBuilt);
				// this.destroyMoons(moonsToDestroy);
			}
		}

		/* if (this.OrbitLine) {
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
		} */
	}

	buildMoons(moonsToBuild) {
		// staggering the building of moon classes to help with performance
		moonsToBuild.forEach((moonClass, i) => {
			setTimeout(() => {
				moonClass.createElements();
			}, i * 10);
		});
	}

	destroyMoons(moonsToDestroy) {
		moonsToDestroy.forEach((moonClass, i) => {
			setTimeout(() => {
				// switch target to the base system entity if the moon currently targeted is destroyed
				if (orrery.mouseState._clickedClass.data.id === moonClass.data.id) {
					orrery.mouseState._clickedClass = moonClass.planetClass;
				}
				moonClass.destroy();
			}, i * 10);
		});
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
		// this.raycasterEnabled = false;

		this.godRaysEffect = null;
	}

	// intervalCheck() {
	// 	if (this.raycasterEnabled) {
	// 		this.updateRaycaster();
	// 		if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
	// 	}
	// }

	async constructEntityMesh(isGodRays) {
		if (this.meshGroup && this.meshGroup.children.length) return;

		const meshGroup = new THREE.Group();
		meshGroup.name = this.data.id;

		// smaller geometry behind godRays so orbit lines don't bleed from behind it
		const geometry = new THREE.SphereBufferGeometry(isGodRays ? this.data.diameter : this.data.diameter * 0.98, 32, 32);
		const material = new THREE.MeshStandardMaterial({
			map: this.materialData.map ? await textureLoader.loadAsync(this.materialData.map) : null,
			normalMap: this.materialData.normalMap ? await textureLoader.loadAsync(this.materialData.normalMap) : null,
			transparent: false,
			emissiveMap: this.materialData.emissiveMap ? await textureLoader.loadAsync(this.materialData.emissiveMap) : null,
			emissive: this.materialData.emissive || null,
			emissiveIntensity: this.materialData.emissiveIntensity || null
		});

		const entityMesh = new THREE.Mesh(geometry, material);
		entityMesh.name = this.data.id;
		entityMesh.castShadow = true;
		entityMesh.receiveShadow = false;
		entityMesh.matrixAutoUpdate = false;
		return entityMesh;
	}

	async renderEntityMesh() {
		this.labelGroup.visible = true;

		// adding mesh twice; one to occlude anything behind it, and the other for the god rays
		const meshPromises = [this.constructEntityMesh(), this.constructEntityMesh(true)];
		await Promise.all(meshPromises).then((meshes) => {
			this.labelGroup.add(this.meshGroup);
			this.meshGroup.add(meshes[0]);
			this.meshGroup.add(meshes[1]);
			this.godRaysEffect = new GodRaysEffect(orrery.camera, meshes[1], {
				blurriness: 2,
				density: 0.56,
				decay: 0.92,
				weight: 0.3,
				exposure: 0.54,
				samples: 60,
				clampMax: 1.0
			});
			this.EquatorLine.line.visible = false;
			this.PolesLine.line.visible = false;
		});
	}

	draw() {}

	intervalCheck() {
		// Only fires if parent planet is in range
		if (this.raycasterEnabled) {
			this.updateRaycaster();
			if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
		}

		this.distanceFromCamera = orrery.camera.position.distanceTo(this.labelGroup.position);
		const cameraZoomed = this.distanceFromCamera < 75000000;

		if (cameraZoomed) {
			this.labelLink.classList.add('faded');
		} else {
			this.labelLink.classList.remove('faded');
		}

		// TODO: sun should glow all cool-like when zoomed out
	}
}

class Moon extends Entity {
	constructor(data, planetClass) {
		super(data);
		this.planetClass = planetClass;
		this.planetGroup = this.planetClass.labelGroup;
		this.materialData = this.data.materialData || rawMaterialData._moon;
		this.orbitLineVisibleAtBuild = this.planetClass.data.moons.length < 20 || this.data.perihelion < 10000000; // orbit line limits set here
		// updated by event emitted by Vue when a moon group updates
		this.isEnabled = false;
		this.isSelected = false;
		// ---

		// All entities by default have an interval check. Want this cleared for moons since they start hidden
		clearInterval(this.intervalCheckVar);
	}

	build() {
		this.planetGroup.add(this.labelGroup);
		this.setLabelGroupDefaultPosition();
	}

	createElements() {
		if (this.isBuilt) return;
		this.labelGroup.visible = true;
		this.createCSSLabel(); // this should only build if planet is in range (or doesn't already exist)
		gsap.to(this.labelLink, {
			opacity: 1,
			duration: 1
		});

		this.OrbitLine.build();
		this.EquatorLine.build();
		this.PolesLine.build();

		if (!this.meshGroup.children.length) {
			this.renderEntityMesh();
		} else {
			this.meshGroup.visible = true;
		}

		// to make sure labels + orbits are in correct position if have been iterating over time
		this.iteratePosition();

		// Moon meshes build when camera is in planet orbit, and are destroyed when camera leaves orbit
		// Need to check to see if mesh already built
		this.intervalCheckVar = setInterval(() => {
			this.intervalCheck();
		}, this.intervalCheckTime);
		this.isBuilt = true;
	}

	intervalCheck() {
		// Only fires if parent planet is in range
		if (orrery.cameraState._currentPlanetInRange === this.planetClass.data.id) {
			if (this.raycasterEnabled) {
				this.updateRaycaster();
				if (this.raycasterArrowEnabled) scene.add(this.raycasterArrow);
			}

			const v3 = new THREE.Vector3();
			const moonWorldPosition = this.labelGroup.getWorldPosition(v3);
			this.distanceFromCamera = orrery.camera.position.distanceTo(moonWorldPosition);
			const cameraZoomedCloseToMoon = this.distanceFromCamera < this.data.zoomTo + 10000;
			const cameraZoomedToMoon = this.distanceFromCamera < this.data.zoomTo + 1000000;

			if (cameraZoomedCloseToMoon) {
				this.labelLink.classList.add('faded');
			} else {
				this.labelLink.classList.remove('faded');
			}

			if (cameraZoomedToMoon) {
				// if a material hasn't loaded, load it and put that in
				if (!this.mesh.material.name) {
					this.applyTextures();
				}
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
		}
	}
}

export { setOrbitVisibility, OrbitLine, Planet, DwarfPlanet, Asteroid, Sun, Moon };
