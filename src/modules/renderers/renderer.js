import { PCFSoftShadowMap, BasicShadowMap } from 'three';
import { WebGLRenderer } from '../custom/src/renderers/WebGLRenderer';
import { checkIfDesktop } from '../utils';

const domTarget = document.querySelector('#bg');
const renderer = new WebGLRenderer({
	// powerPreference: 'high-performance',
	// powerPreference: 'low-power',
	stencil: false,
	canvas: domTarget,
	antialias: true,
	logarithmicDepthBuffer: checkIfDesktop()
});

// TODO: This isn't quite working yet
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = BasicShadowMap;

export { renderer };
