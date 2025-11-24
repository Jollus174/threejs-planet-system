import React, { useMemo } from "react";
import { BackSide, BoxGeometry, MeshBasicMaterial } from "three";
import { textureLoader } from "../modules/loadManager";

import spaceFt from "/img/textures/space_ft.jpg";
import spaceBk from "/img/textures/space_bk.jpg";
import spaceUp from "/img/textures/space_up.jpg";
import spaceDn from "/img/textures/space_dn.jpg";
import spaceRt from "/img/textures/space_rt.jpg";
import spaceLt from "/img/textures/space_lt.jpg";

const Skybox: React.FC = () => {
  const skyboxTexturePaths = [
    spaceFt,
    spaceBk,
    spaceUp,
    spaceDn,
    spaceRt,
    spaceLt,
  ];

  const skyboxMaterialArray = useMemo(() => {
    return skyboxTexturePaths.map((image) => {
      return new MeshBasicMaterial({
        map: textureLoader.load(image),
        side: BackSide,
        depthTest: false, // needed or else will appear in front of shaders
      });
    });
  }, []);

  const skyboxGeometry = useMemo(() => {
    return new BoxGeometry(1000000000000, 1000000000000, 1000000000000);
  }, []);

  return (
    <mesh
      geometry={skyboxGeometry}
      material={skyboxMaterialArray}
      name="skybox"
    />
  );
};

export default Skybox;
