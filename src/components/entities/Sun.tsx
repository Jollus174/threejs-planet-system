import React, { useEffect } from "react";
import { Group, Mesh, SphereGeometry, MeshStandardMaterial } from "three";
import { textureLoader } from "../../modules/loadManager";
import BaseEntity from "./BaseEntity";
import { useSun } from "../../contexts/SunContext";
import type { BodyData, MaterialData } from "../../types";

interface SunProps {
  data: BodyData;
  onPointerDown?: () => void;
}

const Sun: React.FC<SunProps> = ({ data, onPointerDown }) => {
  const { setSunMesh } = useSun();

  // Custom mesh creation for Sun - uses MeshStandardMaterial and creates two meshes
  const useCustomSunMesh = ({
    meshGroupRef,
    materialData,
    data,
    segments,
  }: {
    meshGroupRef: React.RefObject<Group>;
    materialData: MaterialData | null;
    data: BodyData;
    segments: number;
  }) => {
    useEffect(() => {
      if (!meshGroupRef.current || !materialData) return;

      const createSunMesh = async (isGodRays: boolean) => {
        const geometry = new SphereGeometry(
          isGodRays
            ? data.diameter
            : (data.diameter || data.meanRadius * 2) * 0.98,
          32,
          32
        );
        const material = new MeshStandardMaterial({
          map: materialData.map
            ? await textureLoader.loadAsync(materialData.map)
            : null,
          normalMap: materialData.normalMap
            ? await textureLoader.loadAsync(materialData.normalMap)
            : null,
          transparent: false,
          emissiveMap: materialData.emissiveMap
            ? await textureLoader.loadAsync(materialData.emissiveMap)
            : null,
          emissive: materialData.emissive || undefined,
          emissiveIntensity: materialData.emissiveIntensity || undefined,
        });

        const entityMesh = new Mesh(geometry, material);
        entityMesh.name = data.id;
        entityMesh.castShadow = true;
        entityMesh.receiveShadow = false;
        entityMesh.matrixAutoUpdate = false;
        return entityMesh;
      };

      // Create two meshes: one for occlusion, one for god rays
      const meshPromises = [createSunMesh(false), createSunMesh(true)];
      Promise.all(meshPromises).then((meshes) => {
        if (!meshGroupRef.current) return;

        meshGroupRef.current.name = data.id;
        meshGroupRef.current.add(meshes[0]);
        meshGroupRef.current.add(meshes[1]);

        // Store reference to the god rays mesh in context for postprocessing
        setSunMesh(meshes[1]);
      });
    }, [meshGroupRef, materialData, data, segments]);
  };

  return (
    <BaseEntity
      data={data}
      orbitLineVisible={true}
      orbitLineOpacity={0.5}
      onPointerDown={onPointerDown}
      useCustomMesh={useCustomSunMesh}
      hideEquatorPoles={true}
    />
  );
};

export default Sun;
