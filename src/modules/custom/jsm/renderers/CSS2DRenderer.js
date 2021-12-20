/* globals Element */
import { Matrix4, Object3D, Vector3 } from 'three';
import { checkDOMElementOverlap } from './../../../utils';

class CSS2DObject extends Object3D {
	constructor(element, classRef) {
		super();

		this.classRef = classRef;

		this.element = element || document.createElement('div');

		this.element.style.position = 'absolute';
		this.element.style.userSelect = 'none';

		this.element.setAttribute('draggable', false);

		this.addEventListener('removed', function () {
			this.traverse(function (object) {
				if (object.element instanceof Element && object.element.parentNode !== null) {
					object.element.parentNode.removeChild(object.element);
				}
			});
		});
	}

	copy(source, recursive) {
		super.copy(source, recursive);

		this.element = source.element.cloneNode(true);

		return this;
	}
}

CSS2DObject.prototype.isCSS2DObject = true;

//

const _vector = new Vector3();
const _viewMatrix = new Matrix4();
const _viewProjectionMatrix = new Matrix4();
const _a = new Vector3();
const _b = new Vector3();

class CSS2DRenderer {
	constructor() {
		const _this = this;

		let _width, _height;
		let _widthHalf, _heightHalf;

		const cache = {
			objects: new WeakMap()
		};

		const domElement = document.createElement('div');
		domElement.style.overflow = 'hidden';

		this.domElement = domElement;

		function getDistanceToSquared(object1, object2) {
			_a.setFromMatrixPosition(object1.matrixWorld);
			_b.setFromMatrixPosition(object2.matrixWorld);

			return _a.distanceToSquared(_b);
		}

		function isOnScreen(obj) {
			return obj.visible && _vector.z >= -1 && _vector.z <= 1;
		}

		function filterAndFlatten(scene) {
			const result = [];

			scene.traverse(function (object) {
				if (object.isCSS2DObject && object.isOnScreen) {
					result.push(object);
				}
			});

			return result;
		}

		function renderObject(object, scene, camera) {
			if (object.isCSS2DObject) {
				object.onBeforeRender(_this, scene, camera);

				_vector.setFromMatrixPosition(object.matrixWorld);
				_vector.applyMatrix4(_viewProjectionMatrix);

				const element = object.element;

				if (/apple/i.test(navigator.vendor)) {
					// https://github.com/mrdoob/three.js/issues/21415
					element.style.transform =
						'translate(-50%,-50%) translate(' +
						Math.round(_vector.x * _widthHalf + _widthHalf) +
						'px,' +
						Math.round(-_vector.y * _heightHalf + _heightHalf) +
						'px)';
				} else {
					element.style.transform =
						'translate(-50%,-50%) translate(' +
						(_vector.x * _widthHalf + _widthHalf) +
						'px,' +
						(-_vector.y * _heightHalf + _heightHalf) +
						'px)';
				}

				if (isOnScreen(object)) {
					element.style.display = 'block';
					object.isOnScreen = true;
				} else {
					element.style.display = 'none';
					object.isOnScreen = false;
				}

				const objectData = {
					distanceToCameraSquared: getDistanceToSquared(camera, object),
					data: object.classRef.data
				};

				cache.objects.set(object, objectData);

				if (element.parentNode !== domElement) {
					domElement.appendChild(element);
				}

				object.onAfterRender(_this, scene, camera);
			}

			for (let i = 0, l = object.children.length; i < l; i++) {
				renderObject(object.children[i], scene, camera);
			}
		}

		this.getSize = function () {
			return {
				width: _width,
				height: _height
			};
		};

		this.render = function (scene, camera) {
			if (scene.autoUpdate === true) scene.updateMatrixWorld();
			if (camera.parent === null) camera.updateMatrixWorld();

			_viewMatrix.copy(camera.matrixWorldInverse);
			_viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);

			renderObject(scene, scene, camera);
		};

		this.setSize = function (width, height) {
			_width = width;
			_height = height;

			_widthHalf = _width / 2;
			_heightHalf = _height / 2;

			domElement.style.width = width + 'px';
			domElement.style.height = height + 'px';
		};

		// zOrder with the overlapping computation on every frame could be expensive
		// am putting this in an interval loop instead of the RAF
		this.zOrder = function (scene) {
			const sorted = filterAndFlatten(scene).sort(function (a, b) {
				const objectA = cache.objects.get(a);
				const objectB = cache.objects.get(b);

				let distanceAFromCamera = objectA.distanceToCameraSquared;
				let distanceBFromCamera = objectB.distanceToCameraSquared;

				// TODO: the fading order should be influenced here, but not the zIndex
				// hacky way to make the Sun realllly close away so it has the highest z-index (since the below loop starts with highest z-index)
				// if (objectA.data.englishName === 'Sun') distanceAFromCamera = 0.001;
				// if (objectB.data.englishName === 'Sun') distanceBFromCamera = 0.001;

				if (objectA.data.englishName === 'Sun' || objectA.data.isPlanet || objectA.data.isDwarfPlanet)
					distanceAFromCamera = objectA.distanceToCameraSquared * 0.0001;
				if (objectB.data.englishName === 'Sun' || objectB.data.isPlanet || objectB.data.isDwarfPlanet)
					distanceBFromCamera = objectB.distanceToCameraSquared * 0.0001;

				return distanceBFromCamera - distanceAFromCamera;
			});

			// console.log(sorted.map((s) => s.parent.data.englishName));

			const newLabelDimensionsObj = {};
			for (let i = 0; i < sorted.length; i++) {
				sorted[i].element.style.zIndex = i;

				// this is great, since it already skips the ones that aren't on screen
				const labelA = sorted[i].element;
				let clientRectA = newLabelDimensionsObj[i];
				if (!clientRectA) {
					clientRectA = labelA.getBoundingClientRect();
					newLabelDimensionsObj[i] = clientRectA;
				}

				// iterating forwards through the labels, to see if any are overlapping
				for (let j = i + 1; j < sorted.length; j++) {
					const labelB = sorted[j].element;
					let clientRectB = newLabelDimensionsObj[j];
					if (!clientRectB) {
						clientRectB = labelB.getBoundingClientRect();
						newLabelDimensionsObj[j] = clientRectB;
					}
					const isOverlapping = checkDOMElementOverlap(clientRectA, clientRectB, 20);
					if (isOverlapping) {
						// abort loop for the div it's underneath another one; don't need to keep checking this div against others for other overlaps
						labelA.classList.add('behind-label');
						// console.log(`${labelA.textContent.trim()} overlapped by ${labelB.textContent.trim()}`);
						break;
					} else {
						labelA.classList.remove('behind-label');
					}
				}
			}
		};
	}
}

export { CSS2DObject, CSS2DRenderer };
