import React, { useEffect, useState, useRef } from "react";
import { useOrrery } from "../../contexts/OrreryContext";
import BaseEntity from "./BaseEntity";
import type { BodyData } from "../../types";

interface PlanetProps {
  data: BodyData;
  onPointerDown?: () => void;
}

const PLANET_RANGE_THRESHOLD = 100000000;

const Planet: React.FC<PlanetProps> = ({ data, onPointerDown }) => {
  const { camera, cameraState, mouseState, updateCameraState } = useOrrery();
  const [isZoomedToPlanet, setIsZoomedToPlanet] = useState(true);
  const moonClassesRef = useRef<Record<string, any>>({});

  // Distance-based moon loading/unloading and texture loading
  useEffect(() => {
    const interval = setInterval(() => {
      if (!camera) return;

      // This would need access to the labelGroup position
      // For now, this is a placeholder for the distance checking logic
      // The actual implementation would need refs to the entity's position

      // TODO: Implement distance-based logic:
      // - Check camera distance to planet
      // - Load/unload moons based on distance
      // - Load textures/clouds when close enough
      // - Update cameraState._currentPlanetInRange
    }, 1000);

    return () => clearInterval(interval);
  }, [camera, cameraState, mouseState, updateCameraState]);

  return (
    <BaseEntity
      data={data}
      orbitLineVisible={true}
      orbitLineOpacity={0.5}
      onPointerDown={onPointerDown}
    />
  );
};

export default Planet;
