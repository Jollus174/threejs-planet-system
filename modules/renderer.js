import { WebGLRenderer } from 'three';
import { settings } from './settings';

const domTarget = document.querySelector('#bg');
const renderer = new WebGLRenderer({
	canvas: settings.domTarget,
	antialias: true
});

export { domTarget, renderer };
