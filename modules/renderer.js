'use strict';
import { WebGLRenderer } from 'three';

const renderer = new WebGLRenderer({
	canvas: document.querySelector('#bg'),
	antialias: true
});

export { renderer };
