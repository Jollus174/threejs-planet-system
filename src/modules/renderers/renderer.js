import { PCFSoftShadowMap, BasicShadowMap, HalfFloatType } from 'three';
import { WebGLRenderer } from '../custom/src/renderers/WebGLRenderer';
import { EffectComposer } from 'postprocessing';

const renderer = new WebGLRenderer({
	// powerPreference: 'high-performance',
	// powerPreference: 'low-power',
	antialias: true,
	logarithmicDepthBuffer: true
});

renderer.setPixelRatio(window.devicePixelRatio);

const composer = new EffectComposer(renderer, {
	frameBufferType: HalfFloatType
});

// for storing effectPasses in necessary order in prep for the EffectComposer
const effectPasses = [];

// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = BasicShadowMap;

export { renderer, composer, effectPasses };
