// GalaxyMap.tsx

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { TooltipData } from './types';
import { GALAXY_DATA } from './constants';

// --- UI HELPER ---
const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
    if (!data.visible) return null;
    return (
        <div
            className="absolute bg-black/75 border border-gray-500 px-2.5 py-1.5 rounded-sm text-sm pointer-events-none z-[100]"
            style={{ left: data.x + 15, top: data.y }}
            dangerouslySetInnerHTML={{ __html: data.content }}
        />
    );
};

// --- COMPONENT PROPS & HELPERS ---
interface GalaxyMapProps {
    onSystemSelect: (systemId: number) => void;
}

const getSystemById = (id: number) => GALAXY_DATA.systems.find(s => s.id === id);

// --- MAIN COMPONENT ---
export function GalaxyMap({ onSystemSelect }: GalaxyMapProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });

    const mapStateRef = useRef<{
        renderer?: THREE.WebGLRenderer;
        scene?: THREE.Scene;
        camera?: THREE.OrthographicCamera;
        raycaster?: THREE.Raycaster;
        starObjects: THREE.Sprite[];
        intersectedObject?: THREE.Object3D | null;
        isPanning: boolean;
        animationFrameId?: number;
        mousePos: { x: number; y: number };
        prevMousePos: { x: number; y: number };
    }>({
        starObjects: [],
        isPanning: false,
        mousePos: { x: 0, y: 0 },
        prevMousePos: { x: 0, y: 0 },
    });

    useEffect(() => {
        if (!mountRef.current) return;

        const { current: mapState } = mapStateRef;
        const mount = mountRef.current;

        // --- SETUP ---
        mapState.scene = new THREE.Scene();
        mapState.raycaster = new THREE.Raycaster();
        const frustumSize = 1000;
        const aspect = window.innerWidth / window.innerHeight;
        mapState.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);
        mapState.camera.position.z = 100;
        mapState.renderer = new THREE.WebGLRenderer({ antialias: true });
        mapState.renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(mapState.renderer.domElement);

        // --- SCENE CREATION ---
        const createStarSprite = (security: number) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const context = canvas.getContext('2d')!;
            const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
            let color = security < 0.5 ? '#FF6600' : security < 0.8 ? '#FFFF00' : '#FFFFFF';
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(0.5, 'rgba(0,0,0,0.5)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 64, 64);
            const texture = new THREE.CanvasTexture(canvas);
            return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending }));
        };

        const createGalaxyMap = () => {
            if (!mapState.scene) return;
            mapState.starObjects = [];
            GALAXY_DATA.systems.forEach(system => {
                const sprite = createStarSprite(system.security);
                sprite.position.set(system.x, system.y, 0);
                sprite.scale.set(20, 20, 1);
                sprite.userData = { id: system.id, name: system.name, security: system.security };
                mapState.scene!.add(sprite);
                mapState.starObjects.push(sprite);
            });
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3 });
            GALAXY_DATA.jumps.forEach(jump => {
                const fromSystem = getSystemById(jump.from);
                const toSystem = getSystemById(jump.to);
                if (fromSystem && toSystem) {
                    const points = [new THREE.Vector3(fromSystem.x, fromSystem.y, -1), new THREE.Vector3(toSystem.x, toSystem.y, -1)];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    mapState.scene!.add(new THREE.Line(geometry, lineMaterial));
                }
            });
        };
        createGalaxyMap();

        // --- UPDATE LOOP ---
        const updateGalaxyMap = () => {
            if (!mapState.raycaster || !mapState.camera) return;
            const mouseVec = new THREE.Vector2(mapState.mousePos.x, mapState.mousePos.y);
            mapState.raycaster.setFromCamera(mouseVec, mapState.camera);
            const intersects = mapState.raycaster.intersectObjects(mapState.starObjects);
            if (intersects.length > 0) {
                if (mapState.intersectedObject !== intersects[0].object) {
                    mapState.intersectedObject = intersects[0].object;
                    document.body.style.cursor = 'pointer';
                    const { name, security } = intersects[0].object.userData;
                    setTooltipData(d => ({ ...d, visible: true, content: `<strong>${name}</strong><br>Security: ${security.toFixed(1)}` }));
                }
            } else {
                if (mapState.intersectedObject) {
                    document.body.style.cursor = 'default';
                    setTooltipData(d => ({ ...d, visible: false }));
                }
                mapState.intersectedObject = null;
            }
        };

        const animate = () => {
            mapState.animationFrameId = requestAnimationFrame(animate);
            updateGalaxyMap();
            if (mapState.renderer && mapState.scene && mapState.camera) {
                mapState.renderer.render(mapState.scene, mapState.camera);
            }
        };

        // --- EVENT HANDLERS ---
        const onWindowResize = () => {
            if (!mapState.camera || !mapState.renderer) return;
            const aspect = window.innerWidth / window.innerHeight;
            const zoomFactor = mapState.camera.zoom || 1;
            mapState.camera.left = -500 * aspect / zoomFactor;
            mapState.camera.right = 500 * aspect / zoomFactor;
            mapState.camera.top = 500 / zoomFactor;
            mapState.camera.bottom = -500 / zoomFactor;
            mapState.camera.updateProjectionMatrix();
            mapState.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        const onMouseMove = (event: MouseEvent) => {
            mapState.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
            mapState.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
            setTooltipData(d => ({ ...d, x: event.clientX, y: event.clientY }));
            if (mapState.isPanning && mapState.camera) {
                const deltaX = (event.clientX - mapState.prevMousePos.x) / mapState.camera.zoom;
                const deltaY = (event.clientY - mapState.prevMousePos.y) / mapState.camera.zoom;
                mapState.camera.position.x -= deltaX;
                mapState.camera.position.y += deltaY;
            }
            mapState.prevMousePos.x = event.clientX;
            mapState.prevMousePos.y = event.clientY;
        };
        const onMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) return;
            mapState.prevMousePos.x = event.clientX;
            mapState.prevMousePos.y = event.clientY;
            if (mapState.raycaster && mapState.camera) {
                const mouseVec = new THREE.Vector2(mapState.mousePos.x, mapState.mousePos.y);
                mapState.raycaster.setFromCamera(mouseVec, mapState.camera);
                const intersects = mapState.raycaster.intersectObjects(mapState.starObjects);
                if (intersects.length > 0) {
                    onSystemSelect(intersects[0].object.userData.id);
                } else {
                    mapState.isPanning = true;
                }
            }
        };
        const onMouseUp = (event: MouseEvent) => {
            if (event.button === 0) mapState.isPanning = false;
        };
        const onMouseWheel = (event: WheelEvent) => {
            if (mapState.camera) {
                mapState.camera.zoom *= (event.deltaY < 0) ? 1.2 : 1 / 1.2;
                onWindowResize();
            }
        };

        // --- INIT & CLEANUP ---
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('wheel', onMouseWheel);
        animate();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('wheel', onMouseWheel);
            if (mapState.animationFrameId) {
                cancelAnimationFrame(mapState.animationFrameId);
            }
            if (mapState.renderer) {
                mount.removeChild(mapState.renderer.domElement);
                mapState.renderer.dispose();
            }
            mapState.scene?.clear();
            document.body.style.cursor = 'default';
        };
    }, [onSystemSelect]);

    return (
        <>
            <div ref={mountRef} className="fixed inset-0" />
            <Tooltip data={tooltipData} />
        </>
    );
}
