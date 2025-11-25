import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Clock, PerspectiveCamera, WebGLRenderer, Scene, Color, Group } from 'three';
import { EffectComposer } from 'postprocessing';
import { pointLights, ambientLights } from '../modules/lights';
import type { OrreryState, CameraState, MouseState, Bodies, BodiesTypes, Lights, OrbitLines, BodyData } from '../types';
import { sortData } from '@/modules/data/sorting';
import { api } from '@/modules/data/api';

interface OrreryContextValue
	extends Omit<OrreryState, 'scene' | 'camera' | 'renderer' | 'composer' | 'labelRenderer' | 'controls'> {
	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGLRenderer | null;
	composer: EffectComposer | null;
	controls: any;
	setRenderer: (renderer: WebGLRenderer) => void;
	setComposer: (composer: EffectComposer) => void;
	setControls: (controls: any) => void;
	updateCameraState: (updates: Partial<CameraState>) => void;
	updateMouseState: (updates: Partial<MouseState>) => void;
	setBodies: (bodies: Bodies) => void;
	setLights: (lights: Lights) => void;
	setOrbitLines: (orbitLines: OrbitLines) => void;
	setDateTimeDifference: (diff: number) => void;
	setIsDesktop: (isDesktop: boolean) => void;
}

const OrreryContext = createContext<OrreryContextValue | null>(null);

export const useOrrery = () => {
	const context = useContext(OrreryContext);
	if (!context) {
		throw new Error('useOrrery must be used within an OrreryProvider');
	}
	return context;
};

interface OrreryProviderProps {
	children: ReactNode;
}

export const OrreryProvider: React.FC<OrreryProviderProps> = ({ children }) => {
	const [scene] = useState<Scene>(() => {
		const s = new Scene();
		s.background = new Color('grey');
		return s;
	});

	const [camera] = useState<PerspectiveCamera>(() => {
		const cam = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000000000000);
		cam.position.y = 120000000;
		cam.position.z = 700000000;
		return cam;
	});

	const rendererRef = useRef<WebGLRenderer | null>(null);
	const composerRef = useRef<EffectComposer | null>(null);
	const controlsRef = useRef<any>(null);

	const [cameraState, setCameraState] = useState<CameraState>({
		_zoomToTarget: false,
		_dollySpeed: null,
		_rotateToTarget: false,
		_currentPlanetInRange: '',
		_isInPlaneOfReference: false
	});

	const [mouseState, setMouseState] = useState<MouseState>({
		_mouseClicked: false,
		_mousePosition: [null, null],
		_hoveredEntity: null,
		_clickedEntity: null,
		_selectedEntity: null
	});

	const [skybox] = useState<Group>(() => new Group());
	const [bodies, setBodies] = useState<Bodies>({
		types: {
			_all: [],
			_planet: [],
			_dwarfPlanet: [],
			_asteroid: [],
			_moon: [],
			_star: []
		},
		_sun: null,
		_starField: null,
		_asteroidBelt: null,
		_allPlanets: [],
		_orbitLines: [],
		_all: []
	});

	const [orbitLines, setOrbitLines] = useState<OrbitLines>({
		_orbitLinesVisible: true
	});

	const [lights, setLights] = useState<Lights>({
		_pointLights: [],
		_spotLights: [],
		_ambientLights: []
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
			_ambientLights: [ambientLightsArray] // Wrap in array to match expected structure
		});
	}, []);

	// Fetch and load solar system data
	useEffect(() => {
		const loadSolarSystemData = async () => {
			// Define the expected response type
			interface SolarSystemDataResponse {
				bodies: BodyData[];
			}

			try {
				const response = await api.GET<SolarSystemDataResponse>('./solarSystemData.json');

				// Check if data exists
				if (!response.data || !response.data.bodies) {
					console.error('Invalid solar system data structure');
					return;
				}

				const data = response.data;

				// Create temporary bodies and bodiesTypes objects for sortData
				const tempBodies: Bodies = {
					types: {
						_all: [],
						_planet: [],
						_dwarfPlanet: [],
						_asteroid: [],
						_moon: [],
						_star: []
					},
					_sun: null,
					_starField: null,
					_asteroidBelt: null,
					_allPlanets: [],
					_orbitLines: [],
					_all: []
				};

				const tempBodiesTypes: BodiesTypes = {
					_all: [],
					_planet: [],
					_dwarfPlanet: [],
					_asteroid: [],
					_moon: [],
					_star: []
				};

				// Sort and process the data
				const sortedData = sortData(data.bodies, tempBodies, tempBodiesTypes);

				// Update bodies state with sorted data
				const bodiesData = {
					...tempBodies,
					types: {
						...tempBodies.types,
						_planet: sortedData.planets,
						_dwarfPlanet: sortedData.dwarfPlanets
					},
					_sun: sortedData.sun,
					_allPlanets: [...sortedData.planets.concat(sortedData.dwarfPlanets)]
				};
				setBodies(bodiesData);

				// Set sun as default selection if it exists
				if (sortedData.sun) {
					setMouseState((prev) => ({
						...prev,
						_clickedEntity: sortedData.sun,
						_selectedEntity: sortedData.sun
					}));
				}
			} catch (error) {
				console.error('Failed to load solar system data:', error);
			}
		};

		loadSolarSystemData();
	}, [setBodies]);

	const setRenderer = useCallback((renderer: WebGLRenderer) => {
		rendererRef.current = renderer;
	}, []);

	const setComposer = useCallback((composer: EffectComposer) => {
		composerRef.current = composer;
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
		controls: controlsRef.current,
		cameraState,
		mouseState,
		skybox,
		bodies,
		orbitLines,
		lights,
		isDesktop,
		dateTimeDifference,
		time,
		setRenderer,
		setComposer,
		setControls,
		updateCameraState,
		updateMouseState,
		setBodies,
		setLights,
		setOrbitLines,
		setDateTimeDifference,
		setIsDesktop
	};

	return <OrreryContext.Provider value={value}>{children}</OrreryContext.Provider>;
};
