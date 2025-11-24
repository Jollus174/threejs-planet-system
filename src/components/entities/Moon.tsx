import React, { useMemo } from "react";
import { materialData as rawMaterialData } from "../../modules/data/solarSystem";
import BaseEntity from "./BaseEntity";
import type { BodyData } from "../../types";

interface MoonProps {
  data: BodyData;
  parentData: BodyData;
  onPointerDown?: () => void;
}

const Moon: React.FC<MoonProps> = ({ data, parentData, onPointerDown }) => {
  // Moon-specific material data fallback
  const moonMaterialData = useMemo(
    () => data.materialData || rawMaterialData._moon,
    [data.materialData]
  );

  // Orbit line visibility based on number of moons
  const orbitLineVisible = useMemo(() => {
    const moonCount = parentData.moons?.length || 0;
    return moonCount < 20 || (data.perihelion || 0) < 10000000;
  }, [parentData.moons, data.perihelion]);

  // Create data with moon material fallback
  const moonData = useMemo(
    () => ({
      ...data,
      materialData: moonMaterialData,
    }),
    [data, moonMaterialData]
  );

  return (
    <BaseEntity
      data={moonData}
      parentData={parentData}
      orbitLineVisible={orbitLineVisible}
      orbitLineOpacity={0.5}
      onPointerDown={onPointerDown}
    />
  );
};

export default Moon;
