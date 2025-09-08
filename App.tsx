import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GameState } from './types';
import type { PlayerState, TooltipData, Target, TargetData, DockingData, NavObject, NavPanelItem, StorageLocation, Module, Ore, AgentData, MissionData } from './types';
import { 
    GALAXY_DATA,
    SOLAR_SYSTEM_DATA,
    SHIP_DATA,
    BLUEPRINT_DATA,
    INITIAL_PLAYER_STATE,
    getItemData
} from './constants';
import {
    Tooltip,
    TargetingReticle,
    DockingIndicator,
    HangarModal,
    ItemHangarModal,
    CraftingInterface,
    FittingInterface,
    ReprocessingInterface,
    MarketInterface,
    StationInterface,
    NavPanel,
    ShipCargoUI,
    ShipStatsUI,
    SelectedTargetUI,
    UIButton,
    MiningProgressIndicator,
    SystemInfoUI,
    AgentInterface,
    MissionTrackerUI
} from './UI';
import { ASTEROID_BELT_TYPES } from './ores';
import { createAsteroidBelt } from './asteroids';
import { startWarp, updateWarp, isWarping } from './warp';
import { startMiningAnimation, updateMiningAnimation, stopMiningAnimation } from './mining-animation';
import { GalaxyMap } from './GalaxyMap';

// --- CONSTANTS ---
const STAR_SCALE_FACTOR = 1 / 250;
const PLANET_SCALE_FACTOR = 1 / 25;
const ORBIT_SPEED_CONSTANT = 0.1;
const DOCKING_RANGE = 1500;
const MINING_RANGE = 1500;

interface MiningState {
    targetId: string;
    targetObject: THREE.Object3D;
    progress: number;
    startTime: number;
    cycleTime: number;
}


// --- UTILITY FUNCTIONS ---
const getSystemById = (id: number) => GALAXY_DATA.systems.find(s => s.id === id);
const getStationId = (systemId: number, stationName: string) => `station_${systemId}_${stationName.replace(/ /g, '_')}`;

// --- MAIN APP COMPONENT ---

export default function App() {
    // --- STATE MANAGEMENT ---
    const [gameState, setGameState] = useState<GameState>(GameState.GALAX_MAP);
    const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
    const [activeSystemId, setActiveSystemId] = useState<number | null>(null);
    const [activeSystemName, setActiveSystemName] = useState('Galaxy Map');
    const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
    
    // UI State
    const [isShipHangarOpen, setShipHangarOpen] = useState(false);
    const [isItemHangarOpen, setItemHangarOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isFittingOpen, setFittingOpen] = useState(false);
    const [isReprocessingOpen, setReprocessingOpen] = useState(false);
    const [isMarketOpen, setMarketOpen] = useState(false);
    const [isAgentInterfaceOpen, setAgentInterfaceOpen] = useState(false);
    const [isWarpingState, setIsWarpingState] = useState(false);
    const [miningState, setMiningState] = useState<MiningState | null>(null);
    const [miningTargetScreenPos, setMiningTargetScreenPos] = useState<{x: number, y: number, visible: boolean} | null>(null);
    const [isFading, setFading] = useState(false);
    const [tooltipData, setTooltipData] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });
    const [targetData, setTargetData] = useState<TargetData>({ object: null, screenX: 0, screenY: 0, selectedTarget: null });
    const [dockingData, setDockingData] = useState<DockingData>({ visible: false, distance: 0 });
    const [navPanelData, setNavPanelData] = useState<NavPanelItem[]>([]);
    const [showStationHelp, setShowStationHelp] = useState(false);
    
    // Gemini-related state (cached data)
    const [agents, setAgents] = useState<Record<string, AgentData>>({});
    const [stationMissions, setStationMissions] = useState<Record<string, MissionData[]>>({});

    // --- REFS FOR THREE.JS & non-reactive data ---
    const mountRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<any>({}); // Using any to avoid complex THREE type management
    const undockPositionRef = useRef<THREE.Vector3 | null>(null);
    const gameDataRef = useRef<{
        planets: { mesh: THREE.Mesh, pivot: THREE.Object3D, distance: number }[],
        asteroids: THREE.Mesh[],
        stations: THREE.Object3D[],
        navObjects: NavObject[],
        targetedObject: THREE.Object3D | null, // hover target
        lookAtTarget: THREE.Object3D | null,
        dockedStation: THREE.Object3D | null,
        isMouseLooking: boolean,
    }>({
        planets: [], asteroids: [], stations: [], navObjects: [],
        targetedObject: null, lookAtTarget: null, dockedStation: null,
        isMouseLooking: false
    });
    const keysRef = useRef<Record<string, boolean>>({});
    const mousePosRef = useRef({ x: 0, y: 0 });
    const prevMousePosRef = useRef({ x: 0, y: 0 });
    const miningTimeoutRef = useRef<number | null>(null);
    const miningStateRef = useRef(miningState);


    // --- STATE-MUTATING HANDLERS ---
     const fadeTransition = useCallback((callback: () => void) => {
        setFading(true);
        setTimeout(() => {
            callback();
            setTimeout(() => setFading(false), 100);
        }, 500);
    }, []);

    const dockAtStation = useCallback((station: THREE.Object3D) => {
        if (threeRef.current.player) {
            undockPositionRef.current = threeRef.current.player.position.clone();
        }
        fadeTransition(() => {
            gameDataRef.current.dockedStation = station;
            setTargetData(t => ({...t, selectedTarget: null})); // Clear target on dock
            setGameState(GameState.DOCKED);
        });
    }, [fadeTransition]);
    
    const handleActivateShip = (newShipId: string) => {
        const stationId = getStationId(activeSystemId!, gameDataRef.current.dockedStation!.userData.name);
        if (!stationId) return;

        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId];
            if (!stationHangar) return p;

            const oldShipId = p.currentShipId;
            const oldShipFitting = p.currentShipFitting;
            
            Object.values(oldShipFitting).flat().forEach(moduleId => {
                if (moduleId) stationHangar.items.push(moduleId);
            });
            stationHangar.items.push(oldShipId);

            const newShipIndex = stationHangar.items.indexOf(newShipId);
            if (newShipIndex > -1) {
                stationHangar.items.splice(newShipIndex, 1);
            } else {
                console.error("Activated ship not found in hangar!");
                return p;
            }

            newState.currentShipId = newShipId;

            const newShipData = SHIP_DATA[newShipId];
            newState.currentShipFitting = {
                high: Array(newShipData.slots.high).fill(null),
                medium: Array(newShipData.slots.medium).fill(null),
                low: Array(newShipData.slots.low).fill(null),
                rig: Array(newShipData.slots.rig).fill(null),
            };
            return newState;
        });
        setShipHangarOpen(false);
    };

    const handleManufacture = (bpId: string) => {
        const stationId = getStationId(activeSystemId!, gameDataRef.current.dockedStation!.userData.name);
        if (!stationId) return;

        const bpData = BLUEPRINT_DATA[bpId];
        
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const newStationHangar = newState.stationHangars[stationId] || { items: [], materials: {} };

            // A local hasMaterials check to prevent invalid state updates
            let canCraft = true;
            for (const mat in bpData.materials) {
                if ((newStationHangar.materials[mat] || 0) < bpData.materials[mat]) {
                    canCraft = false;
                    break;
                }
            }

            if (canCraft) {
                for (const mat in bpData.materials) {
                    newStationHangar.materials[mat] -= bpData.materials[mat];
                }
                for(let i=0; i<bpData.outputQuantity; i++) newStationHangar.items.push(bpData.outputItem);
                
                newState.stationHangars[stationId] = newStationHangar;
            }
            return newState;
        });
    };

    const handleAcceptMission = (mission: MissionData) => {
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            // Avoid adding duplicate missions
            if (!newState.activeMissions.some(m => m.id === mission.id)) {
                const missionWithStatus = { ...mission, status: 'accepted' };
                newState.activeMissions.push(missionWithStatus);
            }
            return newState;
        });
    };
    
    const handleCompleteMission = (missionId: string) => {
        setPlayerState(p => {
            const mission = p.activeMissions.find(m => m.id === missionId);
            if (!mission) return p;
            
            const stationHangar = p.stationHangars[mission.stationId];
            if (!stationHangar) return p;

            // Check if objectives are met
            for (const oreId in mission.objectives) {
                const required = mission.objectives[oreId];
                if ((stationHangar.materials[oreId] || 0) < required) {
                    // This should be prevented by UI, but as a safeguard
                    console.error("Not enough materials to complete mission.");
                    return p;
                }
            }
            
            const newState = JSON.parse(JSON.stringify(p));
            const newHangar = newState.stationHangars[mission.stationId];

            // 1. Remove objective items
            for (const oreId in mission.objectives) {
                newHangar.materials[oreId] -= mission.objectives[oreId];
                if (newHangar.materials[oreId] <= 0) {
                    delete newHangar.materials[oreId];
                }
            }

            // 2. Add rewards
            if (mission.rewards.isk) {
                newState.isk += mission.rewards.isk;
            }
            if (mission.rewards.items) {
                mission.rewards.items.forEach(itemReward => {
                    const itemData = getItemData(itemReward.id);
                    if (itemData?.category === 'Ore' || itemData?.category === 'Mineral') {
                        newHangar.materials[itemReward.id] = (newHangar.materials[itemReward.id] || 0) + itemReward.quantity;
                    } else {
                        for(let i=0; i < itemReward.quantity; i++) {
                            newHangar.items.push(itemReward.id);
                        }
                    }
                });
            }

            // 3. Remove mission from active list
            newState.activeMissions = newState.activeMissions.filter(m => m.id !== missionId);

            return newState;
        });
    };


    const handleSelectTarget = useCallback((uuid: string) => {
        const navObj = gameDataRef.current.navObjects.find(n => n.object3D.uuid === uuid);
        if (navObj && threeRef.current.player) {
            const distance = threeRef.current.player.position.distanceTo(navObj.object3D.getWorldPosition(new THREE.Vector3()));
            setTargetData(t => ({...t, selectedTarget: {
                uuid: navObj.object3D.uuid,
                object3D: navObj.object3D,
                name: navObj.name,
                type: navObj.type,
                distance: distance,
                oreQuantity: navObj.object3D.userData.oreQuantity,
            }}));
        }
    }, []);

    const handleStopMining = useCallback(() => {
        if (miningTimeoutRef.current) {
            clearTimeout(miningTimeoutRef.current);
            miningTimeoutRef.current = null;
        }
        setMiningState(null);
    }, []);

    const handleDeselectTarget = useCallback(() => {
        if (miningState && miningState.targetId === targetData.selectedTarget?.uuid) {
            handleStopMining();
        }
        setTargetData(t => ({...t, selectedTarget: null}));
    }, [targetData.selectedTarget, miningState, handleStopMining]);

    const handleLookAtTarget = useCallback(() => {
        if (!targetData.selectedTarget) return;
        gameDataRef.current.lookAtTarget = targetData.selectedTarget.object3D;
    }, [targetData.selectedTarget]);

    const handleWarpToTarget = useCallback(() => {
        if (!targetData.selectedTarget || !threeRef.current.player) return;

        const currentShip = SHIP_DATA[playerState.currentShipId];
        if (!currentShip) return;

        gameDataRef.current.lookAtTarget = null; // Clear any manual look-at
        setIsWarpingState(true);
        startWarp(threeRef.current.player, targetData.selectedTarget.object3D, currentShip.attributes.speed, () => {
            setIsWarpingState(false);
        });
    }, [targetData.selectedTarget, playerState.currentShipId]);
    
    const handleMineTarget = useCallback(() => {
        if (!targetData.selectedTarget || targetData.selectedTarget.type !== 'asteroid' || miningState) return;

        const minerModuleIds = playerState.currentShipFitting.high.filter((id): id is string => !!id && id.includes('miner'));
        if (minerModuleIds.length === 0) {
            alert("No mining laser fitted!");
            return;
        }
        
        const firstMinerModule = getItemData(minerModuleIds[0]) as Module;
        const cycleTime = (firstMinerModule.attributes.cycleTime || 60) * 1000;
        
        setMiningState({ 
            targetId: targetData.selectedTarget.uuid, 
            targetObject: targetData.selectedTarget.object3D,
            progress: 0, 
            startTime: Date.now(), 
            cycleTime: cycleTime 
        });

        miningTimeoutRef.current = window.setTimeout(() => {
            setPlayerState(p => {
                const targetObject = gameDataRef.current.asteroids.find(a => a.uuid === targetData.selectedTarget!.uuid);
                if (!targetObject) return p;

                const oreData = targetObject.userData.ore as Ore;
                
                const totalMinedAmount = minerModuleIds.reduce((total, modId) => {
                    const moduleData = getItemData(modId) as Module;
                    return total + (moduleData?.attributes?.miningYield || 0);
                }, 0);

                const newState = JSON.parse(JSON.stringify(p));
                newState.shipCargo.materials[oreData.id] = (newState.shipCargo.materials[oreData.id] || 0) + totalMinedAmount;
                targetObject.userData.oreQuantity -= totalMinedAmount;

                setTargetData(t => (t.selectedTarget && t.selectedTarget.uuid === targetObject.uuid) ? { ...t, selectedTarget: { ...t.selectedTarget, oreQuantity: targetObject.userData.oreQuantity } } : t);

                if (targetObject.userData.oreQuantity <= 0) {
                    targetObject.visible = false;
                     threeRef.current.scene.remove(targetObject);
                     gameDataRef.current.asteroids = gameDataRef.current.asteroids.filter(a => a.uuid !== targetObject.uuid);
                     gameDataRef.current.navObjects = gameDataRef.current.navObjects.filter(n => n.object3D.uuid !== targetObject.uuid);
                     setTargetData(t => ({...t, selectedTarget: null}));
                }
                return newState;
            });
            setMiningState(null);
        }, cycleTime);

    }, [playerState.currentShipFitting.high, targetData.selectedTarget, miningState]);

    const switchToGalaxyMap = () => {
         if (gameState === GameState.TRANSITIONING) return;
         fadeTransition(() => {
            setTargetData({ object: null, screenX: 0, screenY: 0, selectedTarget: null });
            setNavPanelData([]);
            setDockingData({ visible: false, distance: 0 });
            setActiveSystemId(null);
            setActiveSystemName('Galaxy Map');
            setGameState(GameState.GALAX_MAP);
        });
    }

    const handleSystemSelect = (systemId: number) => {
        const system = getSystemById(systemId);
        if (!system) return;

        fadeTransition(() => {
            undockPositionRef.current = null; // Reset position when changing systems
            setActiveSystemId(systemId);
            setActiveSystemName(system.name);
            setGameState(GameState.SOLAR_SYSTEM);
        });
    };

    // --- MAIN GAME LOGIC (SOLAR SYSTEM) IN USEEFFECT ---
    useEffect(() => {
        if (gameState === GameState.GALAX_MAP || !mountRef.current) return;

        // --- SETUP ---
        const { current: three } = threeRef;
        const { current: gameData } = gameDataRef;
        const mount = mountRef.current;

        three.scene = new THREE.Scene();
        three.raycaster = new THREE.Raycaster();
        three.clock = new THREE.Clock();
        
        const aspect = window.innerWidth / window.innerHeight;
        three.solarSystemCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 50000);
        three.currentCamera = three.solarSystemCamera;
        
        three.renderer = new THREE.WebGLRenderer({ antialias: true });
        three.renderer.setSize(window.innerWidth, window.innerHeight);
        mount.innerHTML = ''; // Clear out potential old canvas
        mount.appendChild(three.renderer.domElement);

        // --- SCENE CREATION ---
        const clearScene = () => {
            three.scene?.clear();
            gameData.planets = [];
            gameData.asteroids = [];
            gameData.stations = [];
            gameData.navObjects = [];
        };

        const createSpaceStation = () => {
            const station = new THREE.Group();
            const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xadadad, metalness: 0.9, roughness: 0.4 });
            const hub = new THREE.Mesh(new THREE.SphereGeometry(150, 12, 12), metalMaterial);
            station.add(hub);
            const spine = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 1000, 8), metalMaterial);
            spine.rotation.z = Math.PI / 2;
            station.add(spine);
            station.scale.set(0.5, 0.5, 0.5);
            return station;
        };
        
        const createSolarSystem = (systemId: number) => {
            clearScene();
            const systemData = SOLAR_SYSTEM_DATA[systemId] || { name: (getSystemById(systemId) || {}).name || 'Uncharted System', star: { color: 0xffffff, diameter: 1000000 }, planets: [] };
            const systemGalaxyData = getSystemById(systemId);
            const systemSecurity = systemGalaxyData?.security ?? 1.0;
            
            const starVertices = [];
            for (let i = 0; i < 10000; i++) {
                starVertices.push(
                    THREE.MathUtils.randFloatSpread(40000),
                    THREE.MathUtils.randFloatSpread(40000),
                    THREE.MathUtils.randFloatSpread(40000)
                );
            }
            const starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            three.scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2 })));
            
            three.scene.add(new THREE.AmbientLight(0xffffff, 0.1));
            const starLight = new THREE.PointLight(systemData.star.color, 4, 0, 0);
            three.scene.add(starLight);

            const starRadius = (systemData.star.diameter / 2) * STAR_SCALE_FACTOR;
            const starMesh = new THREE.Mesh(new THREE.SphereGeometry(starRadius, 64, 64), new THREE.MeshBasicMaterial({ color: systemData.star.color }));
            three.scene.add(starMesh);
            gameData.navObjects.push({ name: systemData.name + " (Star)", type: 'star', object3D: starMesh });

            if (systemData.planets) {
                systemData.planets.forEach((pData, index) => {
                    const pivot = new THREE.Object3D();
                    three.scene.add(pivot);
                    const planetRadius = (pData.diameter / 2) * PLANET_SCALE_FACTOR;
                    const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 32, 32), new THREE.MeshStandardMaterial({ color: pData.color, roughness: 0.8 }));
                    planetMesh.position.x = pData.distance;
                    pivot.add(planetMesh);
                    gameData.navObjects.push({ name: pData.name, type: 'planet', object3D: planetMesh });
                    if (pData.rings) {
                        const ringGeom = new THREE.RingGeometry(planetRadius + pData.rings.inner, planetRadius + pData.rings.outer, 64);
                        const ringMat = new THREE.MeshBasicMaterial({ color: 0x999966, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
                        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
                        ringMesh.rotation.x = -Math.PI / 2;
                        planetMesh.add(ringMesh);
                    }
                    gameData.planets.push({ mesh: planetMesh, pivot: pivot, distance: pData.distance });
                    
                    if (systemData.station && systemData.station.orbitsPlanetIndex === index) {
                        const stationModel = createSpaceStation();
                        stationModel.userData = { type: 'station', name: systemData.station.name };
                        stationModel.position.x = pData.distance + systemData.station.orbitDistance;
                        stationModel.position.y = systemData.station.orbitHeight || 0;
                        pivot.add(stationModel);
                        gameData.stations.push(stationModel);
                        gameData.navObjects.push({ name: systemData.station.name, type: 'station', parent: planetMesh, object3D: stationModel });
                    }
                });
            }

            const newAsteroids = createAsteroidBelt(systemData, ASTEROID_BELT_TYPES, systemSecurity);
            newAsteroids.forEach(asteroid => {
                three.scene.add(asteroid);
                gameData.asteroids.push(asteroid);
                if (asteroid.userData.ore) {
                    gameData.navObjects.push({ name: asteroid.userData.ore.name, type: 'asteroid', object3D: asteroid });
                }
            });

            three.player = new THREE.Object3D();
            if (undockPositionRef.current) {
                three.player.position.copy(undockPositionRef.current);
            } else {
                three.player.position.set(0, 0, systemData.planets && systemData.planets.length > 0 ? systemData.planets[systemData.planets.length - 1]!.distance + 4000 : 5000);
            }
            three.player.add(three.solarSystemCamera);
            three.solarSystemCamera.position.set(0, 0, 0);
            three.scene.add(three.player);
        };
        if(activeSystemId) createSolarSystem(activeSystemId);

        // --- UPDATE LOOPS ---
        const toScreenPosition = (obj: THREE.Object3D, camera: THREE.Camera) => {
            const vector = new THREE.Vector3();
            obj.getWorldPosition(vector);
            vector.project(camera);
            vector.x = (vector.x + 1) * window.innerWidth / 2;
            vector.y = -(vector.y - 1) * window.innerHeight / 2;
            return vector;
        };
        const updateNavPanelData = () => {
            if (!three.player || gameData.navObjects.length === 0) return;
            const playerPos = three.player.position;
            const tempVector = new THREE.Vector3();
            const newData = gameData.navObjects.map(navObj => {
                navObj.object3D.getWorldPosition(tempVector);
                const distance = playerPos.distanceTo(tempVector);
                const distanceStr = distance > 1000 ? `${(distance / 1000).toFixed(0)} km` : `${distance.toFixed(0)} m`;
                return { uuid: navObj.object3D.uuid, name: navObj.name, type: navObj.type, distance: distance, distanceStr: distanceStr, parentUUID: navObj.parent?.uuid };
            });
            setNavPanelData(newData);
        };
        const updateSolarSystem = (delta: number, currentShip: any) => {
             gameData.planets.forEach(p => {
                p.pivot.rotation.y += (1 / Math.sqrt(p.distance)) * ORBIT_SPEED_CONSTANT * delta;
                p.mesh.rotation.y += 0.1 * delta;
            });
            
             setTargetData(t => t.selectedTarget && three.player ? {...t, selectedTarget: {...t.selectedTarget, distance: three.player.position.distanceTo(t.selectedTarget.object3D.getWorldPosition(new THREE.Vector3())) }} : t);
            
            if (gameData.lookAtTarget && three.player) {
                const targetPosition = gameData.lookAtTarget.getWorldPosition(new THREE.Vector3());
                const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(three.player.position, targetPosition, three.player.up));
                if (three.player.quaternion.angleTo(targetQuaternion) > 0.01) {
                    three.player.quaternion.slerp(targetQuaternion, 2.5 * delta);
                } else {
                    three.player.quaternion.copy(targetQuaternion);
                    gameData.lookAtTarget = null;
                }
            }

            const targetableObjects = [...gameData.asteroids, ...gameData.stations];
            let closestObject = null;
            let minDistance = 2000;
            const tempVec = new THREE.Vector3();
            targetableObjects.forEach(obj => {
                obj.getWorldPosition(tempVec);
                const distance = three.player.position.distanceTo(tempVec);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestObject = obj;
                }
            });
            
            if (closestObject) {
                gameData.targetedObject = closestObject;
                const screenPos = toScreenPosition(closestObject, three.currentCamera);
                setTargetData(t => ({ ...t, object: closestObject, screenX: screenPos.x, screenY: screenPos.y }));
                if (closestObject.userData.type === 'station' && minDistance < DOCKING_RANGE) {
                    setDockingData({ visible: true, distance: minDistance });
                } else {
                    setDockingData(d => d.visible ? { ...d, visible: false } : d);
                }
            } else {
                gameData.targetedObject = null;
                 setTargetData(t => ({ ...t, object: null, screenX: 0, screenY: 0 }));
                setDockingData(d => d.visible ? { ...d, visible: false } : d);
            }

            const mouseVec = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
            three.raycaster.setFromCamera(mouseVec, three.currentCamera);
            const intersects = three.raycaster.intersectObjects(targetableObjects);
            if (intersects.length > 0 && intersects[0].object === gameData.targetedObject) {
                const data = intersects[0].object.userData;
                const content = data.type === 'asteroid' ? `<strong>${data.ore.name}</strong><br>Quantity: ${data.oreQuantity}` : `<strong>${data.name}</strong>`;
                setTooltipData(d => ({...d, visible: true, content}));
            } else {
                setTooltipData(d => d.visible ? ({...d, visible: false}) : d);
            }

            const isPlayerControllable = !isWarping() && !gameData.lookAtTarget;
            if (!three.player || !isPlayerControllable) return;

            const baseSpeed = currentShip.attributes.speed;
            const agility = currentShip.attributes.agility;
            const finalSpeed = baseSpeed * speedMultiplier;
            if (keysRef.current['KeyW']) three.player.translateZ(-finalSpeed * delta);
            if (keysRef.current['KeyS']) three.player.translateZ(finalSpeed * delta);
            if (keysRef.current['KeyA']) three.player.translateX(-finalSpeed * delta * 0.5);
            if (keysRef.current['KeyD']) three.player.translateX(finalSpeed * delta * 0.5);
            if (keysRef.current['Space']) three.player.translateY(finalSpeed * delta * 0.5);
            if (keysRef.current['ShiftLeft']) three.player.translateY(-finalSpeed * delta * 0.5);
            if (keysRef.current['KeyQ']) three.player.rotateZ((1 / agility) * 3 * delta);
            if (keysRef.current['KeyE']) three.player.rotateZ(-(1 / agility) * 3 * delta);
            if (keysRef.current['KeyR']) three.player.rotateX((1 / agility) * 2 * delta);
            if (keysRef.current['KeyF']) three.player.rotateX(-(1 / agility) * 2 * delta);
        };
        
        // --- ANIMATION LOOP ---
        let animationFrameId: number;
        let lastNavUpdate = 0;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = three.clock.getDelta();
            
            const currentGameState = (mount.parentElement as HTMLElement)?.dataset.gamestate;

            if (currentGameState === GameState.SOLAR_SYSTEM) {
                 if (isWarping() && three.player) updateWarp(three.player, delta);
                 
                const currentShipId = (mount.parentElement as HTMLElement)?.dataset.shipid;
                if (currentShipId) {
                    const currentShip = SHIP_DATA[currentShipId];
                    if (currentShip) updateSolarSystem(delta, currentShip);
                }

                if (miningStateRef.current) {
                    const target = miningStateRef.current.targetObject;
                    if (target) {
                        const screenPos = toScreenPosition(target, three.currentCamera);
                        const vector = new THREE.Vector3();
                        target.getWorldPosition(vector);
                        vector.project(three.currentCamera);
                        
                        setMiningTargetScreenPos({
                            x: screenPos.x, 
                            y: screenPos.y, 
                            visible: vector.z < 1
                        });
                    }
                } else {
                    setMiningTargetScreenPos(null);
                }
                
                if (performance.now() - lastNavUpdate > 250) {
                    updateNavPanelData();
                    lastNavUpdate = performance.now();
                }
            }
            if(three.scene && three.currentCamera) three.renderer.render(three.scene, three.currentCamera);
        };

        // --- EVENT HANDLERS ---
        const onWindowResize = () => {
            if (!three.currentCamera || !three.renderer) return;
            const aspect = window.innerWidth / window.innerHeight;
            three.currentCamera.aspect = aspect;
            three.currentCamera.updateProjectionMatrix();
            three.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        const onMouseMove = (event: MouseEvent) => {
            mousePosRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePosRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
            setTooltipData(d => ({ ...d, x: event.clientX, y: event.clientY }));
            if(gameData.isMouseLooking && three.player && !isWarping() && !gameData.lookAtTarget) {
                const currentShipId = (mount.parentElement as HTMLElement)?.dataset.shipid;
                const ship = SHIP_DATA[currentShipId];
                if(!ship) return;
                const deltaX = event.clientX - prevMousePosRef.current.x;
                const deltaY = event.clientY - prevMousePosRef.current.y;
                const agilityFactor = 1 / (ship.attributes.agility * 2);
                three.player.rotateY(-deltaX * agilityFactor * 0.05);
                three.player.rotateX(-deltaY * agilityFactor * 0.05);
            }
            prevMousePosRef.current.x = event.clientX;
            prevMousePosRef.current.y = event.clientY;
        };
        const onMouseDown = (event: MouseEvent) => {
             if (event.button !== 0) return;
             prevMousePosRef.current.x = event.clientX;
             prevMousePosRef.current.y = event.clientY;
             const currentGameState = (mount.parentElement as HTMLElement)?.dataset.gamestate;
             if (currentGameState === GameState.SOLAR_SYSTEM) {
                 const isModalOpen = (mount.parentElement as HTMLElement)?.dataset.modalopen === 'true';
                 if (!isModalOpen) gameData.isMouseLooking = true;
             }
        };
        const onMouseUp = (event: MouseEvent) => {
            if(event.button === 0) gameData.isMouseLooking = false;
        };
        const onKeyDown = (event: KeyboardEvent) => {
             keysRef.current[event.code] = true; 
        };
        const onKeyUp = (event: KeyboardEvent) => { keysRef.current[event.code] = false; };
        
        // --- INIT & CLEANUP ---
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        animate();
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            if (three.renderer) mount.removeChild(three.renderer.domElement);
            three.renderer?.dispose();
        };
    }, [gameState, activeSystemId]); 

    // Effect for handling docking via 'Enter' key
    useEffect(() => {
        const handleDockingKeyPress = (event: KeyboardEvent) => {
            if (event.code === 'Enter') {
                if (dockingData.visible && gameDataRef.current.targetedObject) {
                    dockAtStation(gameDataRef.current.targetedObject);
                }
            }
        };

        if (gameState === GameState.SOLAR_SYSTEM) {
            document.addEventListener('keydown', handleDockingKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleDockingKeyPress);
        };
    }, [gameState, dockingData, dockAtStation]);

    // Effect for keyboard shortcuts that change state but are not tied to the 3D scene
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (gameState === GameState.SOLAR_SYSTEM) {
                if (event.code === 'Equal' || event.code === 'NumpadAdd') setSpeedMultiplier(s => Math.min(2.0, s + 0.25));
                if (event.code === 'Minus' || event.code === 'NumpadSubtract') setSpeedMultiplier(s => Math.max(0.25, s - 0.25));
                // if (event.code === 'KeyM') switchToGalaxyMap();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState]);
    
    // Effect to update mining progress
    useEffect(() => {
        miningStateRef.current = miningState;
        if (!miningState) return;
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - miningState.startTime;
            const progress = Math.min(100, (elapsedTime / miningState.cycleTime) * 100);
            setMiningState(m => m ? { ...m, progress } : null);
        }, 50);
        return () => clearInterval(interval);
    }, [miningState]);

    const currentShip = SHIP_DATA[playerState.currentShipId];
    const isModalOpen = isShipHangarOpen || isItemHangarOpen || isCraftingOpen || isFittingOpen || isReprocessingOpen || isMarketOpen || isAgentInterfaceOpen;

    const stationId = (gameState === GameState.DOCKED && activeSystemId && gameDataRef.current.dockedStation)
        ? getStationId(activeSystemId, gameDataRef.current.dockedStation.userData.name)
        : null;
    
    const stationName = (gameState === GameState.DOCKED && gameDataRef.current.dockedStation)
        ? gameDataRef.current.dockedStation.userData.name
        : '';
        
    const setTooltipContent = (content: string, event: React.MouseEvent) => {
        setTooltipData({ visible: true, content, x: event.clientX, y: event.clientY });
    };
    const clearTooltipContent = () => {
        setTooltipData(d => ({ ...d, visible: false }));
    };

    const isSolarSystemView = gameState === GameState.SOLAR_SYSTEM || gameState === GameState.DOCKED;

    return (
        <div 
            id="app-container"
            className={`transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            data-gamestate={gameState}
            data-shipid={playerState.currentShipId}
            data-modalopen={isModalOpen}
            data-mining={!!miningState}
            data-miningtarget={miningState?.targetId || ''}
        >
            {gameState === GameState.GALAX_MAP ? (
                <GalaxyMap onSystemSelect={handleSystemSelect} />
            ) : (
                <div ref={mountRef} className="fixed inset-0" />
            )}

            {isSolarSystemView && (
                <>
                    <SystemInfoUI
                        systemName={activeSystemName}
                        playerState={playerState}
                        onNavClick={switchToGalaxyMap}
                        isDocked={gameState === GameState.DOCKED}
                    />

                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && (
                         <div className="absolute top-28 left-2.5 z-5 flex flex-col gap-4">
                            <ShipCargoUI cargo={playerState.shipCargo} />
                            <ShipStatsUI playerState={playerState} />
                            <MissionTrackerUI playerState={playerState} />
                        </div>
                    )}
                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && <NavPanel data={navPanelData} selectedTargetId={targetData.selectedTarget?.uuid || null} onSelectTarget={handleSelectTarget} />}
                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && 
                        <SelectedTargetUI 
                            target={targetData.selectedTarget} 
                            miningState={miningState ? { targetId: miningState.targetId, progress: miningState.progress } : null} 
                            onWarp={handleWarpToTarget} 
                            onMine={handleMineTarget}
                            onStopMine={handleStopMining}
                            onLookAt={handleLookAtTarget}
                            onDeselect={handleDeselectTarget}
                            setTooltip={setTooltipContent}
                            clearTooltip={clearTooltipContent}
                        />
                    }

                    {gameState === GameState.SOLAR_SYSTEM && (
                        <div className="absolute bottom-5 w-full text-center pointer-events-none z-10">
                            {isWarpingState && <p className="text-2xl text-cyan-400 animate-pulse">WARP DRIVE ACTIVE</p>}
                            <div className="text-lg mb-1.5">Ship: {currentShip?.name}</div>
                            <div className="text-sm">Mouse: Aim | W/S: Fwd/Back | A/D: Strafe | Space/Shift: Up/Down | Q/E: Roll | R/F: Pitch</div>
                            <div className="text-sm">+/-: Change Speed Multiplier | Speed: {Math.round(speedMultiplier * 100)}% | </div>
                        </div>
                    )}

                    <Tooltip data={tooltipData} />
                    {gameState === GameState.SOLAR_SYSTEM && <TargetingReticle data={targetData} />}
                    {gameState === GameState.SOLAR_SYSTEM && <DockingIndicator data={dockingData} />}
                    {gameState === GameState.SOLAR_SYSTEM && miningState && miningTargetScreenPos?.visible && (
                        <MiningProgressIndicator
                            progress={miningState.progress}
                            screenX={miningTargetScreenPos.x}
                            screenY={miningTargetScreenPos.y}
                            remainingTime={(miningState.cycleTime - (Date.now() - miningState.startTime)) / 1000}
                        />
                    )}
                    
                    <HangarModal isOpen={isShipHangarOpen} onClose={() => setShipHangarOpen(false)} playerState={playerState} onActivateShip={handleActivateShip} stationId={stationId} />
                    {stationId && <ItemHangarModal isOpen={isItemHangarOpen} onClose={() => setItemHangarOpen(false)} playerState={playerState} setPlayerState={setPlayerState} stationId={stationId} /> }

                    {gameState === GameState.DOCKED && gameDataRef.current.dockedStation && (
                        <StationInterface 
                            stationName={gameDataRef.current.dockedStation.userData.name}
                            onUndock={() => {
                                setShowStationHelp(false);
                                fadeTransition(() => setGameState(GameState.SOLAR_SYSTEM));
                            }}
                            onOpenCrafting={() => { setCraftingOpen(true); setShowStationHelp(false); }}
                            onOpenShipHangar={() => { setShipHangarOpen(true); setShowStationHelp(false); }}
                            onOpenItemHangar={() => { setItemHangarOpen(true); setShowStationHelp(false); }}
                            onOpenFitting={() => { setFittingOpen(true); setShowStationHelp(false); }}
                            onOpenReprocessing={() => { setReprocessingOpen(true); setShowStationHelp(false); }}
                            onOpenMarket={() => { setMarketOpen(true); setShowStationHelp(false); }}
                            onOpenAgent={() => { setAgentInterfaceOpen(true); setShowStationHelp(false); }}
                            showHelp={showStationHelp}
                            onToggleHelp={() => setShowStationHelp(prev => !prev)}
                        />
                    )}

                    {isCraftingOpen && gameState === GameState.DOCKED && (
                        <CraftingInterface onClose={() => setCraftingOpen(false)} playerState={playerState} onManufacture={handleManufacture} stationId={stationId}/>
                    )}
                    
                    {isFittingOpen && stationId && (
                        <FittingInterface isOpen={isFittingOpen} onClose={() => setFittingOpen(false)} playerState={playerState} setPlayerState={setPlayerState} stationId={stationId} />
                    )}

                    {isReprocessingOpen && stationId && (
                        <ReprocessingInterface 
                            isOpen={isReprocessingOpen} 
                            onClose={() => setReprocessingOpen(false)} 
                            playerState={playerState} 
                            setPlayerState={setPlayerState} 
                            stationId={stationId} 
                        />
                    )}

                    {isMarketOpen && stationId && activeSystemId && (
                        <MarketInterface
                            isOpen={isMarketOpen}
                            onClose={() => setMarketOpen(false)}
                            playerState={playerState}
                            setPlayerState={setPlayerState}
                            stationId={stationId}
                            systemId={activeSystemId}
                        />
                    )}
                    
                    {isAgentInterfaceOpen && stationId && activeSystemId && (
                        <AgentInterface
                            isOpen={isAgentInterfaceOpen}
                            onClose={() => setAgentInterfaceOpen(false)}
                            playerState={playerState}
                            onAcceptMission={handleAcceptMission}
                            onCompleteMission={handleCompleteMission}
                            stationId={stationId}
                            systemId={activeSystemId}
                            stationName={stationName}
                            cachedAgent={agents[stationId]}
                            setCachedAgent={(agent) => setAgents(a => ({...a, [stationId]: agent}))}
                            cachedMissions={stationMissions[stationId]}
                            setCachedMissions={(missions) => setStationMissions(m => ({...m, [stationId]: missions}))}
                        />
                    )}
                </>
            )}
        </div>
    );
}