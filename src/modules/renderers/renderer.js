import { PCFSoftShadowMap, BasicShadowMap } from 'three';
import { WebGLRenderer } from '../custom/src/renderers/WebGLRenderer';
import { checkIfDesktop } from '../utilities/dom';

const renderer = new WebGLRenderer({
	// powerPreference: 'high-performance',
	// powerPreference: 'low-power',
	antialias: true,
	// TODO: This messes up the sun shader, and will need to be accounted for
	// logarithmicDepthBuffer: checkIfDesktop()
	logarithmicDepthBuffer: true
});

// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = BasicShadowMap;

export { renderer };
