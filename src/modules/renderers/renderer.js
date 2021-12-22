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

export { renderer };
