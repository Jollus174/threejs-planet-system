import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { HalfFloatType } from "three";
import { useOrrery } from "../contexts/OrreryContext";
import { useSun } from "../contexts/SunContext";
import {
  BlendFunction,
  KernelSize,
  GodRaysEffect,
  EffectPass,
  RenderPass,
  SMAAImageGenerator,
  SMAAEffect,
  SelectiveBloomEffect,
} from "postprocessing";

const PostProcessing: React.FC = () => {
  const { gl, camera, scene } = useThree();
  const { setComposer, renderer, composer } = useOrrery();
  const { sunMesh } = useSun();
  const effectPassRef = useRef<EffectPass | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!gl || !renderer) return;

    // Create EffectComposer and set multisampling
    const { EffectComposer: EffectComposerClass } = require("postprocessing");
    const composerInstance = new EffectComposerClass(gl, {
      frameBufferType: HalfFloatType,
    });
    composerInstance.multisampling = 8; // fixes jagged lines

    setComposer(composerInstance);

    return () => {
      composerInstance.dispose();
    };
  }, [gl, renderer, setComposer]);

  // Create postprocessing effects when sun mesh and composer are available
  useEffect(() => {
    if (!sunMesh || !camera || !composer || initializedRef.current) return;
    initializedRef.current = true;

    // Add RenderPass first (required to render the scene)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Create GodRays effect
    const godRaysEffect = new GodRaysEffect(camera, sunMesh, {
      density: 0.56,
      decay: 0.92,
      weight: 0.3,
      exposure: 0.54,
      samples: 60,
      clampMax: 1.0,
    });

    // Create SMAA effect
    const smaaGenerator = new SMAAImageGenerator();
    smaaGenerator.generate().then((images) => {
      if (!composer || !camera) return;

      // SMAAEffect constructor signature may vary by version
      // Try with just the images first
      const smaaEffect = new (SMAAEffect as any)(images[0], images[1]);

      // Create SelectiveBloom effect
      const selectiveBloomEffect = new SelectiveBloomEffect(scene, camera, {
        kernelSize: KernelSize.SMALL,
        luminanceThreshold: 0,
        luminanceSmoothing: 0.6,
        intensity: 5,
        blendFunction: BlendFunction.ADD,
      });

      // Create effect pass with all effects in the correct order
      // Order: GodRays, SMAA, SelectiveBloom (matching original)
      const effectPass = new EffectPass(
        camera,
        godRaysEffect,
        smaaEffect,
        selectiveBloomEffect
      );
      effectPassRef.current = effectPass;
      composer.addPass(effectPass);
    });

    return () => {
      if (effectPassRef.current && composer) {
        composer.removePass(effectPassRef.current);
        effectPassRef.current.dispose();
        effectPassRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [sunMesh, camera, composer, scene]);

  // Render the composer instead of the default renderer
  useFrame((state, delta) => {
    if (composer) {
      // Use composer.render() instead of the default render
      composer.render(delta);
      // Prevent default render by setting invalidate to false
      state.invalidate();
    }
  }, -1); // Render before default (negative priority)

  return null;
};

export default PostProcessing;
