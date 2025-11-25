import { Canvas, useThree } from "@react-three/fiber";
import { WebGLRenderer } from "three";
import { useOrrery } from "../contexts/OrreryContext";
import Lights from "./Lights";
import Skybox from "./Skybox";
import PostProcessing from "./PostProcessing";
import AsteroidBelt from "./entities/AsteroidBelt";
import StarField from "./entities/StarField";
import { useEffect } from "react";

interface SceneProps {
  children?: React.ReactNode;
}

const RendererSetup: React.FC = () => {
  const { gl } = useThree();
  const { setRenderer } = useOrrery();

  useEffect(() => {
    if (gl instanceof WebGLRenderer) {
      setRenderer(gl);
    }
  }, [gl, setRenderer]);

  return null;
};

const Scene: React.FC<SceneProps> = ({ children }) => {
  const { camera } = useOrrery();

  return (
    <Canvas camera={camera} gl={{ logarithmicDepthBuffer: true }}>
      <color attach="background" args={["grey"]} />
      <RendererSetup />
      <Lights />
      <Skybox />
      <AsteroidBelt />
      <StarField />
      {children}
      <PostProcessing />
    </Canvas>
  );
};

export default Scene;
