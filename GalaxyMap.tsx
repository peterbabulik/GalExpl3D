// GalaxyMap.tsx

import React, { useMemo } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GalaxySystemData } from './types';
import { GALAXY_DATA, SOLAR_SYSTEM_DATA } from './constants';

// --- COMPONENT PROPS & HELPERS ---
interface GalaxyMapProps {
    onSystemSelect: (systemId: number) => void;
}

interface SystemLabelData extends GalaxySystemData {
    screenX: number;
    screenY: number;
    distance: number;
    visible: boolean;
    hasStation: boolean;
}

// --- MAIN COMPONENT ---
export function GalaxyMap({ onSystemSelect }: GalaxyMapProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSystem, setSelectedSystem] = useState<GalaxySystemData | null>(null);
    const [systemLabels, setSystemLabels] = useState<SystemLabelData[]>([]);


    const mapStateRef = useRef<{
        renderer?: THREE.WebGLRenderer;
        scene?: THREE.Scene;
        camera?: THREE.PerspectiveCamera;
        controls?: OrbitControls;
        raycaster?: THREE.Raycaster;
        starObjects: THREE.Mesh[];
        jumpLines: THREE.Line[];
        hoveredObject?: THREE.Object3D | null;
        isAnimating: boolean;
        animationTarget: { position: THREE.Vector3, lookAt: THREE.Vector3 } | null;
        targetSystemId: number | null;
        animationFrameId?: number;
        mousePos: { x: number; y: number };
    }>({
        starObjects: [],
        jumpLines: [],
        isAnimating: false,
        animationTarget: null,
        targetSystemId: null,
        mousePos: { x: 0, y: 0 },
    });
    
    const filteredSystems = useMemo(() => {
        const sortedSystems = [...GALAXY_DATA.systems].sort((a, b) => a.name.localeCompare(b.name));
        if (!searchQuery) return sortedSystems;
        return sortedSystems.filter(system =>
            system.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);


    const startCameraAnimation = useCallback((starObject: THREE.Object3D, travelOnComplete: boolean) => {
        const { current: mapState } = mapStateRef;
        if (mapState.isAnimating) return; // Don't start a new animation if one is in progress

        mapState.isAnimating = true;
        // If we're just focusing, clear any pending travel target from a previous action
        mapState.targetSystemId = travelOnComplete ? starObject.userData.id : null;

        const starPos = starObject.position.clone();
        mapState.animationTarget = {
            position: new THREE.Vector3(starPos.x, starPos.y + 150, starPos.z + 250),
            lookAt: starPos
        };

        if (mapState.controls) {
            mapState.controls.target.copy(starPos);
        }
    }, []);

    const handleSystemSelectFromList = useCallback((system: GalaxySystemData) => {
        setSelectedSystem(system);
        const starObject = mapStateRef.current.starObjects.find(s => s.userData.id === system.id);
        if (starObject) {
            startCameraAnimation(starObject, false); // Focus only
        }
    }, [startCameraAnimation]);


    useEffect(() => {
        if (!mountRef.current) return;

        const { current: mapState } = mapStateRef;
        const mount = mountRef.current;

        // --- SETUP ---
        mapState.scene = new THREE.Scene();

        // Set background image
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/56a53be55dfa7a90029be937ad78b4afc1a47abf/Pictures/galaxy2.png',
            (texture) => {
                if (mapState.scene) {
                    mapState.scene.background = texture;
                }
            }
        );

        // Add lighting to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        mapState.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(0, 1, 1).normalize();
        mapState.scene.add(directionalLight);

        mapState.raycaster = new THREE.Raycaster();
        const aspect = window.innerWidth / window.innerHeight;
        mapState.camera = new THREE.PerspectiveCamera(60, aspect, 10, 10000);
        mapState.camera.position.set(0, 800, 1200);
        mapState.renderer = new THREE.WebGLRenderer({ antialias: true });
        mapState.renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(mapState.renderer.domElement);
        
        mapState.controls = new OrbitControls(mapState.camera, mapState.renderer.domElement);
        mapState.controls.enableDamping = true;
        mapState.controls.dampingFactor = 0.05;
        mapState.controls.screenSpacePanning = false;
        mapState.controls.minDistance = 200;
        mapState.controls.maxDistance = 4000;
        mapState.controls.maxPolarAngle = Math.PI / 1.5;
        mapState.controls.minPolarAngle = Math.PI / 4;


        // --- SCENE CREATION ---
        const getStarColor = (security: number) => {
            if (security < 0.1) return new THREE.Color('#FF4444'); // Bright Red (0.0)
            if (security < 0.5) return new THREE.Color('#FF8C00'); // Orange (0.1 - 0.4)
            if (security < 0.8) return new THREE.Color('#FFFF00'); // Yellow (0.5 - 0.7)
            return new THREE.Color('#FFFFFF');                     // White (0.8 - 1.0)
        }
        
        const createGalaxyMap = () => {
            if (!mapState.scene) return;
            mapState.starObjects = [];
            const systemIdToMesh = new Map<number, THREE.Mesh>();
            const galacticPlaneThickness = 150;

            GALAXY_DATA.systems.forEach(system => {
                const y = THREE.MathUtils.randFloatSpread(galacticPlaneThickness);
                const hasStation = !!SOLAR_SYSTEM_DATA[system.id]?.station;
                
                const starMaterial = new THREE.MeshStandardMaterial({ color: getStarColor(system.security), emissive: new THREE.Color(0x000000) });
                const starGeometry = new THREE.SphereGeometry(hasStation ? 12 : 8, 16, 16);
                const starMesh = new THREE.Mesh(starGeometry, starMaterial);
                
                starMesh.position.set(system.x, y, system.y); // Use data 'y' as 'z'
                starMesh.userData = { id: system.id, name: system.name, security: system.security, hasStation, x: system.x, y: system.y };
                mapState.scene!.add(starMesh);
                mapState.starObjects.push(starMesh);
                systemIdToMesh.set(system.id, starMesh);

                // Create depth stalk
                const stalkMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
                const points = [starMesh.position.clone(), new THREE.Vector3(system.x, 0, system.y)];
                const stalkGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const stalkLine = new THREE.Line(stalkGeometry, stalkMaterial);
                starMesh.userData.stalk = stalkLine;
                mapState.scene!.add(stalkLine);
            });

            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3 });
            GALAXY_DATA.jumps.forEach(jump => {
                const fromMesh = systemIdToMesh.get(jump.from);
                const toMesh = systemIdToMesh.get(jump.to);
                if (fromMesh && toMesh) {
                    const points = [fromMesh.position, toMesh.position];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const jumpLine = new THREE.Line(geometry, lineMaterial.clone());
                    mapState.scene!.add(jumpLine);
                    mapState.jumpLines.push(jumpLine);
                }
            });
        };
        createGalaxyMap();
        
        const toScreenPosition = (obj: THREE.Object3D, camera: THREE.Camera) => {
            const vector = new THREE.Vector3();
            obj.getWorldPosition(vector);

            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(
                new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
            );
        
            if (!frustum.containsPoint(vector)) {
                return { x: 0, y: 0, visible: false };
            }
        
            vector.project(camera);
            vector.x = (vector.x + 1) * window.innerWidth / 2;
            vector.y = -(vector.y - 1) * window.innerHeight / 2;
            return { x: vector.x, y: vector.y, visible: true };
        };
        
        let lastLabelUpdate = 0;
        const labelUpdateInterval = 100; // ms

        // --- UPDATE LOOP ---
        const animate = () => {
            mapState.animationFrameId = requestAnimationFrame(animate);
            if (!mapState.renderer || !mapState.scene || !mapState.camera || !mapState.controls || !mapState.raycaster) return;

            mapState.controls.update();

            // Handle camera animation
            if (mapState.isAnimating && mapState.animationTarget) {
                mapState.camera.position.lerp(mapState.animationTarget.position, 0.08);
                mapState.controls.target.lerp(mapState.animationTarget.lookAt, 0.08);

                if (mapState.camera.position.distanceTo(mapState.animationTarget.position) < 5) {
                    mapState.isAnimating = false;
                    mapState.animationTarget = null;
                    if (mapState.targetSystemId) {
                        onSystemSelect(mapState.targetSystemId);
                        mapState.targetSystemId = null; // Consume it
                    }
                }
            } else {
                // Raycasting for hover
                const mouseVec = new THREE.Vector2(mapState.mousePos.x, mapState.mousePos.y);
                mapState.raycaster.setFromCamera(mouseVec, mapState.camera);
                const intersects = mapState.raycaster.intersectObjects(mapState.starObjects);
                
                const newHovered = intersects.length > 0 ? intersects[0].object : null;

                if (newHovered !== mapState.hoveredObject) {
                    if (mapState.hoveredObject && mapState.hoveredObject.userData.stalk) {
                        mapState.hoveredObject.userData.stalk.material.color.set(0x444444);
                        ((mapState.hoveredObject as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive?.setHex(0x000000);
                    }
                    if (newHovered && newHovered.userData.stalk) {
                        newHovered.userData.stalk.material.color.set(0x00FFFF);
                        ((newHovered as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive?.setHex(0x555555);

                        document.body.style.cursor = 'pointer';
                    } else {
                        document.body.style.cursor = 'default';
                    }
                    mapState.hoveredObject = newHovered;
                }
            }
            
             // Update system labels
            const now = performance.now();
            if (now - lastLabelUpdate > labelUpdateInterval) {
                lastLabelUpdate = now;
                const labels: SystemLabelData[] = mapState.starObjects.map(star => {
                    const screenPos = toScreenPosition(star, mapState.camera!);
                    const distance = mapState.camera!.position.distanceTo(star.position);
                    
                    return {
                        id: star.userData.id,
                        name: star.userData.name,
                        security: star.userData.security,
                        x: star.userData.x,
                        y: star.userData.y,
                        screenX: screenPos.x,
                        screenY: screenPos.y,
                        distance: distance,
                        visible: screenPos.visible,
                        hasStation: star.userData.hasStation,
                    };
                });
                setSystemLabels(labels);
            }

            // Dynamic jump line opacity
            const dist = mapState.camera.position.distanceTo(mapState.controls.target);
            const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(dist, 800, 3000, 0.3, 0.05), 0.05, 0.3);
            mapState.jumpLines.forEach(line => {
                (line.material as THREE.LineBasicMaterial).opacity = opacity;
            });


            mapState.renderer.render(mapState.scene, mapState.camera);
        };

        // --- EVENT HANDLERS ---
        const onWindowResize = () => {
            if (!mapState.camera || !mapState.renderer) return;
            mapState.camera.aspect = window.innerWidth / window.innerHeight;
            mapState.camera.updateProjectionMatrix();
            mapState.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        const onMouseMove = (event: MouseEvent) => {
             // Do not process mouse move if it's over the UI panel
            if ((event.target as HTMLElement).closest('.galaxy-map-ui')) {
                return;
            }
            mapState.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
            mapState.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        const onMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) return;
            // Do not process clicks if they are on the UI panel
            if ((event.target as HTMLElement).closest('.galaxy-map-ui')) {
                return;
            }
            if (mapState.hoveredObject) {
                const systemData = GALAXY_DATA.systems.find(s => s.id === mapState.hoveredObject?.userData.id);
                if (systemData) setSelectedSystem(systemData);
                startCameraAnimation(mapState.hoveredObject, true);
            }
        };


        // --- INIT & CLEANUP ---
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        animate();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            if (mapState.animationFrameId) {
                cancelAnimationFrame(mapState.animationFrameId);
            }
            mapState.controls?.dispose();
            if (mapState.renderer) {
                mount.removeChild(mapState.renderer.domElement);
                mapState.renderer.dispose();
            }
            mapState.scene?.clear();
            document.body.style.cursor = 'default';
        };
    }, [onSystemSelect, startCameraAnimation]);

    return (
        <>
            <div ref={mountRef} className="fixed inset-0" style={{ filter: 'brightness(1)' }} />
            {systemLabels.map(label => {
                if (!label.visible) return null;

                const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(label.distance, 400, 2500, 1, 0), 0, 1);
                if (opacity < 0.01) return null;

                return (
                    <div
                        key={label.id}
                        className="absolute text-center pointer-events-none transition-opacity duration-100"
                        style={{
                            left: `${label.screenX}px`,
                            top: `${label.screenY}px`,
                            transform: 'translate(-50%, -170%)',
                            opacity: opacity,
                            textShadow: '0 0 4px black, 0 0 4px black',
                        }}
                    >
                        <div className="font-bold text-sm text-white whitespace-nowrap">
                            {label.name} {label.hasStation ? '🛰️' : ''}
                        </div>
                        <div className="text-xs text-gray-300 whitespace-nowrap">
                            Sec: {label.security.toFixed(1)}
                        </div>
                    </div>
                );
            })}
            <div className="absolute top-2.5 left-2.5 w-72 max-h-[80vh] bg-gray-900/80 border border-gray-600 p-2.5 box-border z-10 flex flex-col galaxy-map-ui">
                <h3 className="mt-0 text-center flex-shrink-0 text-lg">System Overview</h3>
                <input
                    type="text"
                    placeholder="Search systems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mb-2.5 text-sm"
                />
                <div className="overflow-y-auto flex-grow">
                    <ul className="list-none p-0 m-0">
                        {filteredSystems.map(system => (
                            <li
                                key={system.id}
                                onClick={() => handleSystemSelectFromList(system)}
                                className={`text-sm cursor-pointer p-1 rounded ${selectedSystem?.id === system.id ? 'bg-indigo-700' : 'hover:bg-gray-700/80'}`}
                            >
                                {system.name} <span className="text-gray-400">({system.security.toFixed(1)})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
