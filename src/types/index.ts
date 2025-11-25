import * as THREE from 'three';
import { Vector3 } from 'three';

// ============================================================================
// Body Data Types
// ============================================================================

export type BodyType = 'Star' | 'Planet' | 'Dwarf Planet' | 'Moon' | 'Asteroid' | 'Comet';

export interface Mass {
	massValue: number;
	massExponent: number;
}

export interface Volume {
	volValue: number;
	volExponent: number;
}

export interface AroundPlanet {
	planet: string;
	rel: string;
}

export interface MoonReference {
	moon: string;
	rel: string;
}

export interface MediaItem {
	title: string;
	thumb: string;
}

export interface LightboxItem {
	type: 'image' | 'video' | 'youtube';
	thumb: string;
	src: string;
	caption: string;
	copyright?: string;
}

export interface MediaState {
	hasLoaded: boolean;
	noResults: boolean;
	hasError: boolean;
	errors: Array<{ message: string }>;
	items: MediaItem[];
	total: number | null;
	more: boolean;
	loadingMore: boolean;
	per_page: number | null;
	loadMoreLink?: string;
	lightboxData: LightboxItem[];
	apiRequester?: any;
}

export interface DescriptionState {
	hasLoaded: boolean;
	noResults: boolean;
	hasError: boolean;
	errors: Array<{ message: string }>;
	title: string;
	content: string;
	image: string;
	apiRequester?: any;
}

export interface RingData {
	map?: string;
	mapAlpha?: string;
	opacity?: number;
	emissive?: { r: number; g: number; b: number } | string;
	side?: number;
	inner?: number;
	outer?: number;
}

export interface MaterialData {
	segments?: number;
	map?: string;
	normalMap?: string;
	bumpMap?: string;
	clouds?: string;
	cloudsAlpha?: string;
	cloudsRotateX?: number;
	cloudsRotateY?: number;
	shininess?: number;
	side?: number;
	emissive?: string;
	emissiveMap?: string;
	emissiveIntensity?: number;
	rings?: RingData[];
}

/**
 * Properties added during data processing (not in original JSON)
 */
export interface ProcessedBodyData {
	displayName?: string;
	systemId?: string;
	systemName?: string;
	sideralOrbitDirection?: 'Prograde' | 'Retrograde';
	moonGroupId?: string;
	moonGroupName?: string;
	moonGroupColor?: string;
	moonGroupShowName?: boolean;
	moonGroupIndex?: number;
	moonGroupDefaultEnabled?: boolean;
	isInnerPlanet?: boolean;
	wikipediaKey?: string;
	sidebarImage?: string;
	media: MediaState;
	description: DescriptionState;
	materialData?: MaterialData | null;
	zoomTo?: number;
	labelColour?: string;
	startingPosition?: Vector3;
	moonClasses?: Record<string, any>;
	planetClass?: any;
	rings?: RingData[];
	orbitCalculations?: {
		meanAnomaly: number;
		argPeriapsis: number;
		longAscNode: number;
	};
	longOfPeriapsis?: number;
	diameter?: number;
	// Additional calculated properties (added via setOrbitCalculations)
	meanLongitude?: number;
	perihelionDistance?: number;
	aphelionDistance?: number;
	orbitalPeriod?: number;
	epochOfM?: number;
	obliquityOfEcliptic?: number;
}

/**
 * Base interface with properties from the original JSON data
 */
interface BaseBodyData {
	id: string;
	name: string;
	englishName: string;
	isPlanet?: boolean;
	isDwarfPlanet?: boolean;
	isMajorMoon?: boolean;
	isInnerMoon?: boolean;
	bodyType: BodyType;
	semimajorAxis: number;
	perihelion?: number | null;
	aphelion?: number | null;
	eccentricity: number;
	inclination: number;
	mass: Mass | null;
	vol?: Volume | null;
	density?: number;
	gravity?: number;
	escape?: number;
	meanRadius: number;
	equaRadius?: number | null;
	polarRadius?: number | null;
	flattening?: number;
	dimension?: string;
	sideralOrbit: number;
	sideralRotation?: number | null;
	discoveredBy?: string;
	discoveryDate?: string;
	alternativeName?: string;
	axialTilt?: number;
	avgTemp?: number;
	mainAnomaly: number;
	meanAnomaly: number;
	argPeriapsis: number;
	longAscNode: number;
	rel?: string; // API endpoint URL (from JSON)
}

/**
 * Star - Central body, no moons, no parent planet
 */
export interface StarData extends BaseBodyData {
	bodyType: 'Star';
	moons: null;
	aroundPlanet: null;
}

/**
 * Planet - Can have moons, orbits the star
 */
export interface PlanetData extends BaseBodyData {
	bodyType: 'Planet';
	moons: MoonReference[] | BodyData[] | null;
	aroundPlanet: null;
}

/**
 * Dwarf Planet - Can have moons, orbits the star
 */
export interface DwarfPlanetData extends BaseBodyData {
	bodyType: 'Dwarf Planet';
	moons: MoonReference[] | BodyData[] | null;
	aroundPlanet: null;
}

/**
 * Moon - Orbits a planet, no moons of its own
 */
export interface MoonData extends BaseBodyData {
	bodyType: 'Moon';
	moons: null;
	aroundPlanet: AroundPlanet;
}

/**
 * Asteroid - Orbits the star, typically no moons
 */
export interface AsteroidData extends BaseBodyData {
	bodyType: 'Asteroid';
	moons: null;
	aroundPlanet: null;
}

/**
 * Comet - Orbits the star, typically no moons
 */
export interface CometData extends BaseBodyData {
	bodyType: 'Comet';
	moons: null;
	aroundPlanet: null;
}

/**
 * Union type for raw celestial body data (from JSON)
 */
export type RawBodyData = StarData | PlanetData | DwarfPlanetData | MoonData | AsteroidData | CometData;

/**
 * Processed/enriched body data (raw data + processed properties)
 */
export type BodyData = RawBodyData & ProcessedBodyData;

// ============================================================================
// Settings Types
// ============================================================================

export interface CameraSettings {
	_fov: number;
	_aspect: number;
	_near: number;
	_far: number;
}

export interface ControlsSettings {
	_minDistance: number;
	_maxDistance: number;
	_enableDamping: boolean;
	_dampingFactor: number;
	_enableKeys: boolean;
	_minPolarAngle: number;
	_maxPolarAngle: number;
	_dollySpeedMax: number;
	_dollySpeedMin: number;
}

export interface MouseSettings {
	_mouseHoverTimeoutDefault: number;
	_mouseClickTimeoutDefault: number;
}

export interface OrbitLinesSettings {
	_orbitVisibilityCheckbox: HTMLInputElement | null;
}

export interface Settings {
	camera: CameraSettings;
	controls: ControlsSettings;
	mouse: MouseSettings;
	orbitLines: OrbitLinesSettings;
	planetColours: Record<string, string>;
	systemZoomDistanceThresholds: number[];
	navigationSystems: string[];
	navigationEntities: string[];
}

// ============================================================================
// Orrery State Types
// ============================================================================

export interface CameraState {
	_zoomToTarget: boolean;
	_dollySpeed: number | null;
	_rotateToTarget: boolean;
	_currentPlanetInRange: string;
	_isInPlaneOfReference: boolean;
	target?: Vector3;
}

export interface MouseState {
	_mouseClicked: boolean;
	_mousePosition: [number | null, number | null];
	_hoveredClass: EntityClass | null;
	_clickedClass: EntityClass | null;
	_zoomedClass: EntityClass | null;
}

export interface BodiesTypes {
	_all: BodyData[];
	_planet: BodyData[];
	_dwarfPlanet: BodyData[];
	_asteroid: BodyData[];
	_moon: BodyData[];
	_star: BodyData[];
}

export interface Bodies {
	types: BodiesTypes;
	_sun: BodyData | null;
	_starField: any | null;
	_asteroidBelt: any | null;
	_allPlanets: BodyData[];
	_orbitLines: any[];
	_all: BodyData[];
}

export interface EntityClasses {
	_all: Record<string, EntityClass>;
	_allIterable: EntityClass[];
	_allIterableLength: number | null;
	_moonsIterable: EntityClass[];
	_planets: Record<string, EntityClass>;
	_dwarfPlanets: Record<string, EntityClass>;
	_asteroids: Record<string, EntityClass>;
	_moons: Record<string, EntityClass>;
	_navigable: Record<string, EntityClass>;
	_sun?: EntityClass;
}

export interface Lights {
	_pointLights: any[][];
	_spotLights: any[][];
	_ambientLights: any[][];
}

export interface OrbitLines {
	_orbitLinesVisible: boolean;
}

export interface EntityClass {
	data: BodyData;
	labelLink: HTMLAnchorElement;
	labelGroup: THREE.Group;
	meshGroup: THREE.Group;
	surfaceMesh: THREE.Mesh | null;
	cloudMesh: THREE.Mesh | null;
	isBuilt: boolean;
	CSSObj: any; // CSS2DObject
	raycaster: THREE.Raycaster;
	raycasterArrow: THREE.ArrowHelper;
	materialData: MaterialData | null;
	segments: number;
	OrbitLine: any;
	EquatorLine: any;
	PolesLine: any;
	raycasterEnabled: boolean;
	raycasterArrowEnabled: boolean;
	time: THREE.Clock;
	isEnabled: boolean;
	isSelected: boolean;
	orbitLineOpacityDefault: number;
	planetClass?: EntityClass;
	moonClasses?: Record<string, EntityClass>;
	createCSSLabel: () => void;
	removeCSSLabel: () => void;
	setLabelGroupDefaultPosition: () => void;
	resetLabelGroupPosition: () => void;
	iteratePosition: () => void;
	setEnabled: (shouldEnable: boolean) => void;
	setSelected: (shouldSelect: boolean) => void;
	build: () => Promise<EntityClass>;
	draw: () => void;
}

export interface OrreryState {
	scene: THREE.Scene;
	controls: any; // OrbitControls
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	composer: any; // EffectComposer
	labelRenderer: any; // CSS2DRenderer
	cameraState: CameraState;
	mouseState: MouseState;
	skybox: THREE.Group;
	classes: EntityClasses;
	bodies: Bodies;
	orbitLines: OrbitLines;
	lights: Lights;
	isDesktop: boolean;
	dateTimeDifference: number;
	time: THREE.Clock;
}

// ============================================================================
// Event Types
// ============================================================================

export interface CustomEventNames {
	updateClickTarget: string;
	updateEntityVue: string;
	updateZoomTarget: string;
	updateZoomTargetVue: string;
	updateSystemMoonGroups: string;
}

// ============================================================================
// Moon Group Types
// ============================================================================

export interface MoonGroup {
	id: string;
	name: string;
	color: string;
	showName: boolean;
	moonGroupIndex: number;
	moons: BodyData[];
	isEnabled: boolean;
	isSelected: boolean;
	systemId: string;
}

export interface MoonGroupData {
	systemId: string;
	moonGroupId: string;
	isEnabled: boolean;
	isSelected: boolean;
	moonIds: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface TimeShiftTypes {
	hours: number;
	days: number;
	months: number;
}

export interface SidebarState {
	imageLoading: boolean;
	imageError: boolean;
	imagesQueue: string[];
	images: string[];
	loadingTimeout: NodeJS.Timeout | null;
}

export interface UIState {
	searchQuery: string;
	navigationSystems: string[];
	navigationEntities: string[];
	showSearchMobile: boolean;
	clickedClassData: BodyData | null;
	zoomedClassData: BodyData | null;
	sidebarMobileHeight: number;
	sidebarDesktopWidth: number;
	systemClassData: BodyData | null;
	modelSystemSelection: Record<string, string>;
	modelSidebarImages: Record<string, string>;
	modelMoonGroups: Record<string, MoonGroup[]>;
	tabGroup: string;
	vueRandomString: string;
	timeShiftTypes: TimeShiftTypes;
	timeShiftTypeCurrentIndex: number;
	dateTimeCurrent: Date;
	timeShiftSystemOnly: boolean;
	sidebar: SidebarState;
}

// ============================================================================
// Three.js Extensions
// ============================================================================

declare module 'three' {
	interface Object3D {
		isCSS2DObject?: boolean;
	}
}
