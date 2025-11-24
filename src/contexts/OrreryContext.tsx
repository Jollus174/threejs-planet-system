import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  Clock,
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Color,
  Group,
} from "three";
import { EffectComposer } from "postprocessing";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { pointLights, ambientLights } from "../modules/lights";
import type {
  OrreryState,
  CameraState,
  MouseState,
  Bodies,
  EntityClasses,
  Lights,
  OrbitLines,
} from "../types";

interface OrreryContextValue
  extends Omit<
    OrreryState,
    "scene" | "camera" | "renderer" | "composer" | "labelRenderer" | "controls"
  > {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer | null;
  composer: EffectComposer | null;
  labelRenderer: CSS2DRenderer | null;
  controls: any;
  setRenderer: (renderer: WebGLRenderer) => void;
  setComposer: (composer: EffectComposer) => void;
  setLabelRenderer: (labelRenderer: CSS2DRenderer) => void;
  setControls: (controls: any) => void;
  updateCameraState: (updates: Partial<CameraState>) => void;
  updateMouseState: (updates: Partial<MouseState>) => void;
  setBodies: (bodies: Bodies) => void;
  setClasses: (classes: EntityClasses) => void;
  setLights: (lights: Lights) => void;
  setOrbitLines: (orbitLines: OrbitLines) => void;
  setDateTimeDifference: (diff: number) => void;
  setIsDesktop: (isDesktop: boolean) => void;
}

const OrreryContext = createContext<OrreryContextValue | null>(null);

export const useOrrery = () => {
  const context = useContext(OrreryContext);
  if (!context) {
    throw new Error("useOrrery must be used within an OrreryProvider");
  }
  return context;
};

interface OrreryProviderProps {
  children: ReactNode;
}

export const OrreryProvider: React.FC<OrreryProviderProps> = ({ children }) => {
  const [scene] = useState<Scene>(() => {
    const s = new Scene();
    s.background = new Color("grey");
    return s;
  });

  const [camera] = useState<PerspectiveCamera>(() => {
    const cam = new PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000000000000
    );
    cam.position.y = 120000000;
    cam.position.z = 700000000;
    return cam;
  });

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const controlsRef = useRef<any>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    _zoomToTarget: false,
    _dollySpeed: null,
    _rotateToTarget: false,
    _currentPlanetInRange: "",
    _isInPlaneOfReference: false,
  });

  const [mouseState, setMouseState] = useState<MouseState>({
    _mouseClicked: false,
    _mousePosition: [null, null],
    _hoveredClass: null,
    _clickedClass: null,
    _zoomedClass: null,
  });

  const [skybox] = useState<Group>(() => new Group());

  const [classes, setClasses] = useState<EntityClasses>({
    _all: {},
    _allIterable: [],
    _allIterableLength: null,
    _moonsIterable: [],
    _planets: {},
    _dwarfPlanets: {},
    _asteroids: {},
    _moons: {},
    _navigable: {},
  });

  const [bodies, setBodies] = useState<Bodies>({
    types: {
      _all: [],
      _planet: [],
      _dwarfPlanet: [],
      _asteroid: [],
      _moon: [],
      _star: [],
    },
    _sun: null,
    _starField: null,
    _asteroidBelt: null,
    _allPlanets: [],
    _orbitLines: [],
    _all: [],
  });

  const [orbitLines, setOrbitLines] = useState<OrbitLines>({
    _orbitLinesVisible: true,
  });

  const [lights, setLights] = useState<Lights>({
    _pointLights: [],
    _spotLights: [],
    _ambientLights: [],
  });

  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [dateTimeDifference, setDateTimeDifference] = useState<number>(0);
  const [time] = useState<Clock>(() => new Clock());

  // Initialize lights on mount
  useEffect(() => {
    const [pointLightsArray] = pointLights();
    const [ambientLightsArray] = ambientLights();

    setLights({
      _pointLights: [pointLightsArray], // Wrap in array to match expected structure
      _spotLights: [], // Spot lights not used in original, but structure expected
      _ambientLights: [ambientLightsArray], // Wrap in array to match expected structure
    });
  }, []);

  const setRenderer = useCallback((renderer: WebGLRenderer) => {
    rendererRef.current = renderer;
  }, []);

  const setComposer = useCallback((composer: EffectComposer) => {
    composerRef.current = composer;
  }, []);

  const setLabelRenderer = useCallback((labelRenderer: CSS2DRenderer) => {
    labelRendererRef.current = labelRenderer;
  }, []);

  const setControls = useCallback((controls: any) => {
    controlsRef.current = controls;
  }, []);

  const updateCameraState = useCallback((updates: Partial<CameraState>) => {
    setCameraState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateMouseState = useCallback((updates: Partial<MouseState>) => {
    setMouseState((prev) => ({ ...prev, ...updates }));
  }, []);

  const value: OrreryContextValue = {
    scene,
    camera,
    renderer: rendererRef.current,
    composer: composerRef.current,
    labelRenderer: labelRendererRef.current,
    controls: controlsRef.current,
    cameraState,
    mouseState,
    skybox,
    classes,
    bodies,
    orbitLines,
    lights,
    isDesktop,
    dateTimeDifference,
    time,
    setRenderer,
    setComposer,
    setLabelRenderer,
    setControls,
    updateCameraState,
    updateMouseState,
    setBodies,
    setClasses,
    setLights,
    setOrbitLines,
    setDateTimeDifference,
    setIsDesktop,
  };

  return (
    <OrreryContext.Provider value={value}>{children}</OrreryContext.Provider>
  );
};
