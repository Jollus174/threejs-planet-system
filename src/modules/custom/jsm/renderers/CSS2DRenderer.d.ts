import { Object3D } from "three";

export class CSS2DObject extends Object3D {
  element: HTMLElement;
  classRef: any;
  inFrustum: boolean;
  constructor(element: HTMLElement, classRef: any);
}

export class CSS2DRenderer {
  domElement: HTMLElement;
  constructor();
  render(scene: any, camera: any): void;
  getSize(): { width: number; height: number };
}
