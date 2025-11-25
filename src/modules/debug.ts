import * as THREE from "three";
import type { Scene, PerspectiveCamera } from "three";
import vertexShader from "./shaders/debug/vertexShader.glsl";
import fragmentShader from "./shaders/debug/fragmentShader.glsl";

interface DebugMaterials {
  shaderMaterial: THREE.ShaderMaterial;
  basicMaterial: THREE.MeshBasicMaterial;
}

const createMaterials = (camera: PerspectiveCamera): DebugMaterials => {
  return {
    shaderMaterial: new THREE.ShaderMaterial({
      uniforms: {
        logDepthBuffFC: {
          value: 2.0 / (Math.log(camera.far + 1.0) / Math.LN2),
        },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
    }),
    basicMaterial: new THREE.MeshBasicMaterial({
      color: new THREE.Color("purple"),
    }),
  };
};

const createBasicCube = (
  size: number,
  scene: Scene,
  camera: PerspectiveCamera
): void => {
  const materials = createMaterials(camera);
  const geometry = new THREE.BoxGeometry(size, size, size, 10, 10);

  const boxMesh = new THREE.Mesh(geometry, materials.shaderMaterial);
  boxMesh.name = "debug cube";
  scene.add(boxMesh);
};

const createBasicSphere = (
  size: number,
  scene: Scene,
  camera: PerspectiveCamera
): void => {
  const materials = createMaterials(camera);
  const geometry = new THREE.SphereGeometry(size, 64, 64);

  const boxMesh = new THREE.Mesh(geometry, materials.shaderMaterial);
  boxMesh.name = "debug sphere";
  scene.add(boxMesh);
};

export { createBasicCube, createBasicSphere };
