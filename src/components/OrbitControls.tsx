import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as ThreeOrbitControls } from "three/addons/controls/OrbitControls.js";
import { useOrrery } from "../contexts/OrreryContext";
import { settings } from "../modules/settings";

interface OrbitControlsProps {
  labelRendererElement?: HTMLElement;
}

const OrbitControls: React.FC<OrbitControlsProps> = ({
  labelRendererElement,
}) => {
  const { camera, setControls } = useOrrery();
  const { gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls | null>(null);

  useEffect(() => {
    const domElement = labelRendererElement || gl.domElement;
    const controls = new ThreeOrbitControls(camera, domElement);

    controls.minDistance = settings.controls._minDistance;
    controls.maxDistance = settings.controls._maxDistance;
    controls.enableDamping = settings.controls._enableDamping;
    controls.dampingFactor = settings.controls._dampingFactor;
    // controls.enableKeys = settings.controls._enableKeys;
    controls.minPolarAngle = settings.controls._minPolarAngle;
    controls.maxPolarAngle = settings.controls._maxPolarAngle;

    controls.keys = {
      LEFT: "KeyA",
      UP: "KeyW",
      RIGHT: "KeyD",
      BOTTOM: "KeyS",
    };

    controlsRef.current = controls;
    setControls(controls);

    return () => {
      controls.dispose();
    };
  }, [camera, gl.domElement, labelRendererElement, setControls]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
};

export default OrbitControls;
