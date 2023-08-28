import { WebGLRenderer, HalfFloatType } from 'three';
import { EffectComposer } from 'postprocessing';

const renderer = new WebGLRenderer({
	// antialias: true, // am using the composer to add anti-aliasing instead
	// the shader orbit lineslines seem to not like this... will always appear behind planets
	// manually including logarithmic depth buffering in the shaders fixes this problem
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
