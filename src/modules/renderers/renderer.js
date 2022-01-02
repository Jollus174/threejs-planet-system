import { PCFSoftShadowMap, BasicShadowMap } from 'three';
import { WebGLRenderer } from '../custom/src/renderers/WebGLRenderer';
import { checkIfDesktop } from '../utils';

const domTarget = document.querySelector('#bg');
const renderer = new WebGLRenderer({
	// powerPreference: 'high-performance',
	// powerPreference: 'low-power',
	canvas: domTarget,
	antialias: true,
	// TODO: This messes up the sun shader, and will need to be accounted for
	logarithmicDepthBuffer: checkIfDesktop()
});

// TODO: This isn't quite working yet
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = BasicShadowMap;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

export { renderer };
