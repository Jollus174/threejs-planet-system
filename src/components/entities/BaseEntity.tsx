import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
	Group,
	Mesh,
	SphereGeometry,
	MeshPhongMaterial,
	Color,
	MathUtils,
	FrontSide,
	DoubleSide,
	LinearFilter,
	CanvasTexture
} from 'three';
import { Html } from '@react-three/drei';
import { calculateOrbit } from '../../modules/utilities/astronomy';
import { ringUVMapGeometry } from '../../modules/utilities/threeJS';
import { imageBitmapLoader } from '../../modules/loadManager';
import { settings } from '../../modules/settings';
import { useOrrery } from '../../contexts/OrreryContext';
import { gsap } from 'gsap';
import OrbitLine from './OrbitLine';
import EquatorLine from './EquatorLine';
import PolesLine from './PolesLine';
import type { BodyData, MaterialData } from '../../types';

interface BaseEntityProps {
	data: BodyData;
	parentData?: BodyData | null;
	orbitLineVisible?: boolean;
	orbitLineOpacity?: number;
	onPointerDown?: () => void;
	// Override hooks for entity-specific behavior
	useCustomMesh?: (props: {
		meshGroupRef: React.RefObject<Group>;
		materialData: MaterialData | null;
		data: BodyData;
		segments: number;
	}) => void;
	hideEquatorPoles?: boolean;
}

const BaseEntity: React.FC<BaseEntityProps> = ({
	data,
	parentData = null,
	orbitLineVisible = true,
	orbitLineOpacity = 0.5,
	onPointerDown,
	useCustomMesh,
	hideEquatorPoles = false
}) => {
	const labelGroupRef = useRef<Group>(null);
	const meshGroupRef = useRef<Group>(null);
	const labelLinkRef = useRef<HTMLAnchorElement | null>(null);
	const meshRef = useRef<Mesh | null>(null);
	const cloudMeshRef = useRef<Mesh | null>(null);

	const { dateTimeDifference, time, updateMouseState } = useOrrery();

	const [isBuilt, setIsBuilt] = useState(false);
	const [labelOpacity, setLabelOpacity] = useState(0);
	const meshBuiltRef = useRef(false);

	const materialData: MaterialData | null = useMemo(() => data.materialData || null, [data.materialData]);
	const segments = useMemo(() => materialData?.segments || 32, [materialData?.segments]);

	// Animate label opacity when built
	useEffect(() => {
		if (isBuilt) {
			const obj = { opacity: 0 };
			gsap.to(obj, {
				opacity: 1,
				duration: 1,
				onUpdate: function () {
					setLabelOpacity(obj.opacity);
				}
			});
		}
	}, [isBuilt]);

	// Get entity type classes
	const entityTypeClasses = useMemo(() => {
		return [
			data.id === '_sun' ? 'is-sun' : '',
			data.aroundPlanet ? 'is-moon' : '',
			data.isPlanet ? 'is-planet' : '',
			data.isDwarfPlanet ? 'is-dwarf-planet' : '',
			data.isMajorMoon ? 'is-major-moon' : '',
			data.isInnerMoon ? 'is-inner-moon' : ''
		]
			.join(' ')
			.trim();
	}, [data]);

	const handleLabelPointerDown = useCallback(() => {
		if (onPointerDown) {
			onPointerDown();
		}
	}, [onPointerDown]);

	const handleLabelMouseOver = useCallback(() => {
		updateMouseState({ _hoveredClass: { data } as any });
	}, [data, updateMouseState]);

	const handleLabelMouseLeave = useCallback(() => {
		updateMouseState({ _hoveredClass: null });
	}, [updateMouseState]);

	// Set initial position
	useEffect(() => {
		if (!labelGroupRef.current) return;
		if (data.startingPosition) {
			labelGroupRef.current.position.copy(data.startingPosition);
		} else {
			labelGroupRef.current.position.set(0, 0, 0);
		}
		labelGroupRef.current.rotation.z = MathUtils.degToRad(data.axialTilt || 0);
	}, [data]);

	// Create entity mesh - can be overridden by useCustomMesh
	useEffect(() => {
		if (!meshGroupRef.current || meshBuiltRef.current) return;
		meshBuiltRef.current = true;

		// If custom mesh hook is provided, use it instead
		if (useCustomMesh) {
			// Note: useCustomMesh may be async, so we set isBuilt after a short delay
			// The actual mesh creation will happen in the custom function
			useCustomMesh({ meshGroupRef, materialData, data, segments });
			// Set isBuilt after a brief delay to allow async operations to start
			const timeoutId = setTimeout(() => setIsBuilt(true), 100);
			return () => clearTimeout(timeoutId);
		}

		if (!materialData) {
			meshBuiltRef.current = false;
			return;
		}

		// Default mesh creation
		const geometry = new SphereGeometry(data.diameter || data.meanRadius * 2, segments, segments);
		const loaderMaterial = new MeshPhongMaterial({
			color: new Color(0x000000),
			transparent: true,
			opacity: 0.2
		});

		const entityMesh = new Mesh(geometry, loaderMaterial);
		entityMesh.name = data.id;
		meshRef.current = entityMesh;

		meshGroupRef.current.name = `${data.name} mesh group`;
		meshGroupRef.current.add(entityMesh);

		// Load textures
		const loadTextures = async () => {
			const { map, normalMap, bumpMap, shininess = 20, side = FrontSide } = materialData;

			const materialProps: any = {
				name: `${data.name} material`,
				map: map ? await imageBitmapLoader.loadAsync(map).then((t) => new CanvasTexture(t)) : null,
				normalMap: normalMap ? await imageBitmapLoader.loadAsync(normalMap).then((t) => new CanvasTexture(t)) : null,
				bumpMap: bumpMap ? await imageBitmapLoader.loadAsync(bumpMap).then((t) => new CanvasTexture(t)) : null,
				bumpScale: bumpMap ? 0.015 : null,
				shininess,
				side,
				transparent: false,
				wireframe: false
			};

			if (meshRef.current && meshRef.current.material) {
				const oldMaterial = meshRef.current.material;
				if (!Array.isArray(oldMaterial)) {
					oldMaterial.dispose();
				}
				meshRef.current.material = new MeshPhongMaterial(materialProps);
			}
		};

		loadTextures();

		// Load clouds if needed
		if (materialData.clouds) {
			const loadClouds = async () => {
				const { clouds, cloudsAlpha } = materialData;
				const cloudMaterialProps: any = {
					name: `${data.name} clouds`,
					map: clouds ? await imageBitmapLoader.loadAsync(clouds).then((t) => new CanvasTexture(t)) : null,
					alphaMap: cloudsAlpha
						? await imageBitmapLoader.loadAsync(cloudsAlpha).then((t) => new CanvasTexture(t))
						: null,
					transparent: true,
					opacity: 0.9
				};
				if (cloudMaterialProps.map) {
					cloudMaterialProps.map.minFilter = LinearFilter;
				}

				const cloudGeometry = new SphereGeometry((data.diameter || data.meanRadius * 2) * 1.01, segments, segments);
				const cloudMesh = new Mesh(cloudGeometry, new MeshPhongMaterial(cloudMaterialProps));
				cloudMesh.name = `${data.id} clouds`;
				cloudMeshRef.current = cloudMesh;
				if (meshGroupRef.current) {
					meshGroupRef.current.add(cloudMesh);
				}
			};

			loadClouds();
		}

		// Load rings if needed
		if (materialData.rings && meshGroupRef.current) {
			const loadRings = async () => {
				const ringPromises = materialData.rings!.map(async (ring, i) => {
					const { map, mapAlpha, opacity = 0.98, emissive } = ring;
					const ringMaterial: any = {
						map: map ? await imageBitmapLoader.loadAsync(map).then((t) => new CanvasTexture(t)) : null,
						alphaMap: mapAlpha ? await imageBitmapLoader.loadAsync(mapAlpha).then((t) => new CanvasTexture(t)) : null,
						transparent: true,
						emissive: emissive && typeof emissive === 'object' ? new Color(emissive.r, emissive.g, emissive.b) : null,
						opacity,
						side: DoubleSide
					};

					const inner = data.rings![i].inner || 0;
					const outer = data.rings![i].outer || 0;
					const ringMesh = new Mesh(
						ringUVMapGeometry(data.meanRadius + inner, data.meanRadius + outer),
						new MeshPhongMaterial(ringMaterial)
					);

					ringMesh.name = `${data.id} ring ${i}`;
					ringMesh.receiveShadow = true;
					ringMesh.rotation.x = MathUtils.degToRad(90);
					return ringMesh;
				});

				const rings = await Promise.all(ringPromises);
				if (meshGroupRef.current) {
					rings.forEach((ring) => meshGroupRef.current!.add(ring));
				}
			};

			loadRings();
		}

		setIsBuilt(true);

		// Cleanup function
		return () => {
			meshBuiltRef.current = false;
			// Dispose of geometries and materials to prevent memory leaks
			if (meshRef.current) {
				if (meshRef.current.geometry) meshRef.current.geometry.dispose();
				if (meshRef.current.material) {
					if (Array.isArray(meshRef.current.material)) {
						meshRef.current.material.forEach((mat) => mat.dispose());
					} else {
						meshRef.current.material.dispose();
					}
				}
			}
			if (cloudMeshRef.current) {
				if (cloudMeshRef.current.geometry) cloudMeshRef.current.geometry.dispose();
				if (cloudMeshRef.current.material) {
					if (Array.isArray(cloudMeshRef.current.material)) {
						cloudMeshRef.current.material.forEach((mat) => mat.dispose());
					} else {
						cloudMeshRef.current.material.dispose();
					}
				}
			}
		};
	}, [data.id, materialData, segments]); // Removed useCustomMesh from deps - it's a function that changes on every render

	// Update position in render loop
	useFrame(() => {
		if (!labelGroupRef.current || !meshGroupRef.current?.visible || !isBuilt) return;

		const i = (dateTimeDifference * 360) / (data.sideralOrbit || 360);
		const position = calculateOrbit(data.meanAnomaly - i, data, parentData);
		labelGroupRef.current.position.copy(position);

		// Rotate mesh
		if (meshGroupRef.current && data.sideralRotation) {
			meshGroupRef.current.rotation.y = time.getElapsedTime() * (-1 / (data.sideralRotation * 10));
		}

		// Rotate clouds
		if (cloudMeshRef.current && materialData && (materialData.cloudsRotateX || materialData.cloudsRotateY)) {
			cloudMeshRef.current.rotation.y = time.getElapsedTime() * (materialData.cloudsRotateX || 0) * -1;
			cloudMeshRef.current.rotation.x = time.getElapsedTime() * (materialData.cloudsRotateY || 0) * -1;
		}
	});

	const handleOrbitHover = useCallback(() => {
		updateMouseState({ _hoveredClass: { data } as any });
	}, [data, updateMouseState]);

	const handleOrbitUnhover = useCallback(() => {
		updateMouseState({ _hoveredClass: null });
	}, [updateMouseState]);

	return (
		<group ref={labelGroupRef} name={`${data.id} group label`}>
			<group ref={meshGroupRef} name={`${data.name} mesh group`} />
			{isBuilt && (
				<>
					<Html as="div" center wrapperClass="label-wrapper" style={{ pointerEvents: 'auto' }}>
						<a
							ref={labelLinkRef}
							className={`label behind-label ${entityTypeClasses}`}
							data-selector="label"
							style={{
								color: data.labelColour || '#ffffff',
								opacity: labelOpacity,
								textDecoration: 'none'
							}}
							onPointerDown={handleLabelPointerDown}
							onMouseOver={handleLabelMouseOver}
							onMouseLeave={handleLabelMouseLeave}
						>
							<div className="label-content">
								<div className="label-circle"></div>
								<div
									className="label-text"
									style={{
										color: data.labelColour !== settings.planetColours.default ? data.labelColour : ''
									}}
								>
									{data.displayName}
								</div>
							</div>
						</a>
					</Html>
					<OrbitLine
						data={data}
						parentData={parentData}
						visible={orbitLineVisible}
						opacity={orbitLineOpacity}
						onHover={handleOrbitHover}
						onUnhover={handleOrbitUnhover}
					/>
					{!hideEquatorPoles && (
						<>
							<EquatorLine data={data} visible={orbitLineVisible} diameter={data.diameter || data.meanRadius * 2} />
							<PolesLine data={data} visible={orbitLineVisible} diameter={data.diameter || data.meanRadius * 2} />
						</>
					)}
				</>
			)}
		</group>
	);
};

export default BaseEntity;
