/* globals requestAnimationFrame */
'use strict';
import './style.css';
import * as THREE from 'three';

const scene = new THREE.Scene();

const aspectRatio = window.innerWidth / window.innerHeight;
const renderTarget = document.querySelector('#bg');

const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: renderTarget
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 30;

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshBasicMaterial({ color: 0xff6347, wireframe: true });
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

const animate = () => {
	requestAnimationFrame(animate);

	torus.rotation.x += 0.01;
	torus.rotation.y += 0.01;
	torus.rotation.z += 0.01;

	// render == DRAW
	renderer.render(scene, camera);
};

animate();

/* window.addEventListener('resize', () => {
	console.log('resizing!');
	// renderer.setSize(window.innerWidth, window.innerHeight);

	// TODO: possibly add a debounce
}); */
