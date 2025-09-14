

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GameState } from './types';
import type { PlayerState, TooltipData, Target, TargetData, DockingData, NavObject, NavPanelItem, StorageLocation, Module, Ore, AgentData, MissionData, SolarSystemData, Drone, AnyItem } from './types';
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
    ShipStatsUI,
    SelectedTargetUI,
    UIButton,
    MiningProgressIndicator,
    SystemInfoUI,
    AgentInterface,
    MissionTrackerUI,
    VirtualJoystick,
    ModuleBarUI
} from './UI';
import { ASTEROID_BELT_TYPES } from './ores';
import { createAsteroidBelt } from './asteroids';
import { startWarp, updateWarp, isWarping } from './warp';
import { startMiningAnimation, updateMiningAnimation, stopMiningAnimation } from './mining-animation';
import { GalaxyMap } from './GalaxyMap';
import { spawnEnemies, updateEnemies, createEnemyLoot, updateEnemyAttacks } from './enemies';
import type { Enemy } from './enemies';


// --- CONSTANTS ---
const STAR_SCALE_FACTOR = 1 / 250;
const PLANET_SCALE_FACTOR = 1 / 25;
const ORBIT_SPEED_CONSTANT = 0.1;
const DOCKING_RANGE = 1500;
const MINING_RANGE = 1500;
const LOOT_RANGE = 2500;
const ENEMY_ATTACK_COOLDOWN = 3000; // ms

interface MiningState {
    targetId: string;
    targetObject: THREE.Object3D;
    progress: number;
    startTime: number;
    cycleTime: number;
}

type DroneStatus = 'docked' | 'idle' | 'attacking' | 'returning' | 'mining';


// --- UTILITY FUNCTIONS ---
const getSystemById = (id: number) => GALAXY_DATA.systems.find(s => s.id === id);
const getStationId = (systemId: number, stationName: string) => `station_${systemId}_${stationName.replace(/ /g, '_')}`;

// --- NEW PLAYER MODAL ---
const NewPlayerModal: React.FC<{ onStart: (name: string) => void }> = ({ onStart }) => {
    const [name, setName] = useState('');

    const handleStart = () => {
        if (name.trim()) {
            onStart(name.trim());
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleStart();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center">
            <div className="bg-gray-900 border-2 border-gray-500 p-8 rounded-lg text-center">
                <h1 className="text-3xl mb-4">Welcome to GalExpl3D</h1>
                <p className="text-gray-400 mb-6">Please enter your pilot's name to begin.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-gray-800 border border-gray-600 text-white text-lg p-3 rounded mb-6 text-center"
                    placeholder="Pilot Name"
                    autoFocus
                />
                <button
                    onClick={handleStart}
                    disabled={!name.trim()}
                    className="w-full py-3 px-4 text-lg bg-indigo-700 border border-indigo-500 text-white font-mono cursor-pointer hover:bg-indigo-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                >
                    Begin Your Journey
                </button>
            </div>
        </div>
    );
};


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
    const [isAutoMining, setIsAutoMining] = useState(false);
    const [miningTargetScreenPos, setMiningTargetScreenPos] = useState<{x: number, y: number, visible: boolean} | null>(null);
    const [isFading, setFading] = useState(false);
    const [tooltipData, setTooltipData] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });
    const [targetData, setTargetData] = useState<TargetData>({ object: null, screenX: 0, screenY: 0, selectedTarget: null });
    const [dockingData, setDockingData] = useState<DockingData>({ visible: false, distance: 0 });
    const [navPanelData, setNavPanelData] = useState<NavPanelItem[]>([]);
    const [showStationHelp, setShowStationHelp] = useState(false);
    const [showCargoFullMessage, setShowCargoFullMessage] = useState(false);
    const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
    const [activeModuleSlots, setActiveModuleSlots] = useState<string[]>([]);
    const [deactivatedWeaponSlots, setDeactivatedWeaponSlots] = useState<string[]>([]);
    const [droneStatus, setDroneStatus] = useState<DroneStatus>('docked');
    const [isTakingDamage, setIsTakingDamage] = useState(false);

    // Persistence State
    const [isLoading, setIsLoading] = useState(true);
    const [showNamePrompt, setShowNamePrompt] = useState(false);

    // Gemini-related state (cached data)
    const [agents, setAgents] = useState<Record<string, AgentData>>({});
    const [stationMissions, setStationMissions] = useState<Record<string, MissionData[]>>({});

    // --- REFS FOR THREE.JS & non-reactive data ---
    const mountRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<any>({}); // Using any to avoid complex THREE type management
    const playerStateRef = useRef(playerState);
    const targetDataRef = useRef(targetData);
    const undockPositionRef = useRef<THREE.Vector3 | null>(null);
    const gameDataRef = useRef<{
        planets: { mesh: THREE.Mesh, pivot: THREE.Object3D, distance: number }[],
        asteroids: THREE.Mesh[],
        stations: THREE.Object3D[],
        enemies: Enemy[],
        wrecks: THREE.Object3D[],
        drones: { object3D: THREE.Mesh, orbitAngle: number, orbitRadius: number, id: string }[],
        navObjects: NavObject[],
        targetedObject: THREE.Object3D | null, // hover target
        lookAtTarget: THREE.Object3D | null,
        dockedStation: THREE.Object3D | null,
        isMouseLooking: boolean,
    }>({
        planets: [], asteroids: [], stations: [], enemies: [], wrecks: [], drones: [], navObjects: [],
        targetedObject: null, lookAtTarget: null, dockedStation: null,
        isMouseLooking: false
    });
    const keysRef = useRef<Record<string, boolean>>({});
    const mousePosRef = useRef({ x: 0, y: 0 });
    const prevMousePosRef = useRef({ x: 0, y: 0 });
    const miningTimeoutRef = useRef<number | null>(null);
    const miningStateRef = useRef(miningState);
    const joystickVecRef = useRef(joystickVector);
    const droneMiningTimerRef = useRef<number>(0);
    const lastEnemyAttackTimeRef = useRef<number>(0);
    
    // Refs for autosave interval
    const gameStateRef = useRef(gameState);
    const activeSystemIdRef = useRef(activeSystemId);
    
    // Refs for loading saved position
    const loadedPositionRef = useRef<THREE.Vector3 | null>(null);
    const loadedQuaternionRef = useRef<THREE.Quaternion | null>(null);
    const initialDockedStationNameRef = useRef<string | null>(null);

    // Update refs whenever state changes for the interval to access
    useEffect(() => {
        targetDataRef.current = targetData;
    }, [targetData]);
    useEffect(() => { playerStateRef.current = playerState; }, [playerState]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { activeSystemIdRef.current = activeSystemId; }, [activeSystemId]);

    // --- PERSISTENCE LOGIC ---
    const SAVE_KEY = 'GALEXPL3D_SAVEGAME';

    // Load game on initial mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.playerState && parsedData.playerState.playerName) {
                    
                    // If loading an old save without shipHP, initialize it
                    if (!parsedData.playerState.shipHP) {
                        const ship = SHIP_DATA[parsedData.playerState.currentShipId];
                        parsedData.playerState.shipHP = {
                            shield: ship.attributes.shield, maxShield: ship.attributes.shield,
                            armor: ship.attributes.armor, maxArmor: ship.attributes.armor,
                            hull: ship.attributes.hull, maxHull: ship.attributes.hull,
                        };
                    }
                    
                    setPlayerState(p => ({...p, ...parsedData.playerState}));

                    // Restore location and game state
                    if (parsedData.gameState) {
                        setGameState(parsedData.gameState);
                    }
                    if (parsedData.activeSystemId) {
                        setActiveSystemId(parsedData.activeSystemId);
                        const system = getSystemById(parsedData.activeSystemId);
                        if (system) {
                            setActiveSystemName(system.name);
                        }
                    }
                    if (parsedData.shipPosition) {
                        loadedPositionRef.current = new THREE.Vector3().fromArray(parsedData.shipPosition);
                    }
                    if (parsedData.shipQuaternion) {
                        loadedQuaternionRef.current = new THREE.Quaternion().fromArray(parsedData.shipQuaternion);
                    }
                    if (parsedData.dockedStationName) {
                        initialDockedStationNameRef.current = parsedData.dockedStationName;
                    }
                } else {
                    setShowNamePrompt(true);
                }
            } else {
                setShowNamePrompt(true);
            }
        } catch (error) {
            console.error("Failed to load game data:", error);
            setShowNamePrompt(true); // Load failed, start new game
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Autosave every 30 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (playerStateRef.current && playerStateRef.current.playerName) {
                try {
                    const saveData: any = {
                        playerState: playerStateRef.current,
                        gameState: gameStateRef.current,
                        activeSystemId: activeSystemIdRef.current,
                        shipPosition: null,
                        shipQuaternion: null,
                        dockedStationName: null,
                    };

                    if (gameStateRef.current === GameState.SOLAR_SYSTEM && threeRef.current.player) {
                        saveData.shipPosition = threeRef.current.player.position.toArray();
                        saveData.shipQuaternion = threeRef.current.player.quaternion.toArray();
                    } else if (gameStateRef.current === GameState.DOCKED && gameDataRef.current.dockedStation) {
                        saveData.dockedStationName = gameDataRef.current.dockedStation.userData.name;
                    }

                    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
                } catch (error) {
                    console.error('Failed to autosave game:', error);
                }
            }
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleStartNewGame = (name: string) => {
        setPlayerState({
            ...INITIAL_PLAYER_STATE,
            playerName: name,
        });
        setShowNamePrompt(false);
    };

    // --- STATE-MUTATING HANDLERS ---
     const fadeTransition = useCallback((callback: () => void) => {
        setFading(true);
        setTimeout(() => {
            callback();
            setTimeout(() => setFading(false), 100);
        }, 500);
    }, []);

    const despawnDrones = useCallback(() => {
        gameDataRef.current.drones.forEach(drone => {
            threeRef.current.scene?.remove(drone.object3D);
        });
        gameDataRef.current.drones = [];
    }, []);

    const dockAtStation = useCallback((station: THREE.Object3D) => {
        if (threeRef.current.player) {
            undockPositionRef.current = threeRef.current.player.position.clone();
        }
        keysRef.current = {}; // Reset keyboard state to prevent "stuck keys"
        fadeTransition(() => {
            gameDataRef.current.dockedStation = station;
            setTargetData(t => ({...t, selectedTarget: null})); // Clear target on dock
            despawnDrones();
            setDroneStatus('docked'); // Drones are recalled on dock
            
            // Full repair on dock
            setPlayerState(p => {
                const currentShip = SHIP_DATA[p.currentShipId];
                return {
                    ...p,
                    shipHP: {
                        shield: currentShip.attributes.shield, maxShield: currentShip.attributes.shield,
                        armor: currentShip.attributes.armor, maxArmor: currentShip.attributes.armor,
                        hull: currentShip.attributes.hull, maxHull: currentShip.attributes.hull,
                    }
                };
            });

            setGameState(GameState.DOCKED);
        });
    }, [fadeTransition, despawnDrones]);
    
    const handleActivateShip = (newShipId: string) => {
        const stationId = getStationId(activeSystemId!, gameDataRef.current.dockedStation!.userData.name);
        if (!stationId) return;
    
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId] || { items: [], materials: {} };
            newState.stationHangars[stationId] = stationHangar; // Ensure it's assigned if it was created
    
            // Unload cargo and fittings from old ship
            const oldShipId = p.currentShipId;
            const oldShipFitting = p.currentShipFitting;
            const oldShipCargo = p.shipCargo;
    
            // Move fitted modules to hangar
            Object.values(oldShipFitting).flat().forEach(moduleId => {
                if (moduleId) stationHangar.items.push(moduleId);
            });
    
            // Move items from cargo to hangar
            oldShipCargo.items.forEach(itemId => {
                stationHangar.items.push(itemId);
            });
    
            // Move materials from cargo to hangar
            for (const matId in oldShipCargo.materials) {
                stationHangar.materials[matId] = (stationHangar.materials[matId] || 0) + oldShipCargo.materials[matId];
            }
    
            // Add old ship to hangar
            stationHangar.items.push(oldShipId);
            
            // Remove new ship from hangar
            const newShipIndex = stationHangar.items.indexOf(newShipId);
            if (newShipIndex > -1) {
                stationHangar.items.splice(newShipIndex, 1);
            } else {
                console.error("Activated ship not found in hangar!");
                return p;
            }
    
            // Set up the new ship
            const newShipData = SHIP_DATA[newShipId];
            newState.currentShipId = newShipId;
            newState.currentShipFitting = {
                high: Array(newShipData.slots.high).fill(null),
                medium: Array(newShipData.slots.medium).fill(null),
                low: Array(newShipData.slots.low).fill(null),
                rig: Array(newShipData.slots.rig).fill(null),
            };
            // Reset HP for the new ship
            newState.shipHP = {
                shield: newShipData.attributes.shield, maxShield: newShipData.attributes.shield,
                armor: newShipData.attributes.armor, maxArmor: newShipData.attributes.armor,
                hull: newShipData.attributes.hull, maxHull: newShipData.attributes.hull,
            };
            
            // Reset ship cargo for the new ship
            newState.shipCargo = {
                items: [],
                materials: {},
            };
            // Drones return to hangar on ship switch
            if (p.droneBayCargo.length > 0) {
                stationHangar.items.push(...p.droneBayCargo);
                newState.droneBayCargo = [];
            }
    
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
                
                const outputItemData = getItemData(bpData.outputItem);
                const stackableCategories: string[] = ['Ammunition', 'Ore', 'Mineral', 'Component', 'Consumable', 'Material'];

                if (outputItemData && stackableCategories.includes(outputItemData.category)) {
                    // Add to materials (stackable)
                    newStationHangar.materials[bpData.outputItem] = (newStationHangar.materials[bpData.outputItem] || 0) + bpData.outputQuantity;
                } else {
                    // Add to items (non-stackable)
                    for (let i = 0; i < bpData.outputQuantity; i++) {
                        newStationHangar.items.push(bpData.outputItem);
                    }
                }
                
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
            const isWreck = navObj.type === 'wreck';
            setTargetData(t => ({...t, selectedTarget: {
                uuid: navObj.object3D.uuid,
                object3D: navObj.object3D,
                name: navObj.name,
                type: navObj.type,
                distance: distance,
                oreQuantity: navObj.object3D.userData.oreQuantity,
                shipName: navObj.object3D.userData.shipName,
                hp: navObj.object3D.userData.hp,
                loot: isWreck ? navObj.object3D.userData.loot : undefined,
            }}));
        }
    }, []);

    const handleStopMining = useCallback(() => {
        if (miningTimeoutRef.current) {
            clearTimeout(miningTimeoutRef.current);
            miningTimeoutRef.current = null;
        }
        setMiningState(null);
        setIsAutoMining(false);
    }, []);

    const handleDeselectTarget = useCallback(() => {
        if (miningState && miningState.targetId === targetData.selectedTarget?.uuid) {
            handleStopMining();
        }
        if (droneStatus === 'attacking' || droneStatus === 'mining') {
            setDroneStatus('idle');
        }
        setTargetData(t => ({...t, selectedTarget: null}));
    }, [targetData.selectedTarget, miningState, handleStopMining, droneStatus]);

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
    
    const startMiningCycle = useCallback(() => {
        if (!targetData.selectedTarget || targetData.selectedTarget.type !== 'asteroid' || miningState) {
            return false;
        }

        const minerModuleIds = playerState.currentShipFitting.high.filter((id): id is string => !!id && id.includes('miner'));
        if (minerModuleIds.length === 0) {
            alert("No mining laser fitted!");
            return false;
        }

        const currentShipData = SHIP_DATA[playerState.currentShipId];
        if (!currentShipData) return false;

        const totalCapacity = currentShipData.attributes.cargoCapacity + (currentShipData.attributes.oreHold || 0);
        let currentCargoVolume = 0;
        for (const matId in playerState.shipCargo.materials) {
            currentCargoVolume += (getItemData(matId)?.volume || 0) * playerState.shipCargo.materials[matId];
        }
        for (const itemId of playerState.shipCargo.items) {
            currentCargoVolume += (getItemData(itemId)?.volume || 0);
        }

        if (currentCargoVolume >= totalCapacity) {
            setShowCargoFullMessage(true);
            setTimeout(() => setShowCargoFullMessage(false), 3000);
            return false;
        }
        
        const distance = threeRef.current.player.position.distanceTo(targetData.selectedTarget.object3D.getWorldPosition(new THREE.Vector3()));
        if (distance > MINING_RANGE) {
            return false;
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
                if (!targetObject || targetObject.userData.oreQuantity <= 0) return p;
    
                const oreData = targetObject.userData.ore as Ore;
                const oreVolumePerUnit = oreData.volume || 0.1;
                
                const shipData = SHIP_DATA[p.currentShipId];
                if (!shipData) return p;

                const baseModuleYield = minerModuleIds.reduce((total, modId) => {
                    const moduleData = getItemData(modId) as Module;
                    return total + (moduleData?.attributes?.miningYield || 0);
                }, 0);
                
                let totalYieldMultiplier = 1.0;
                if (shipData.bonuses) {
                    shipData.bonuses.forEach(bonus => {
                        if (bonus.type === 'miningYield' && bonus.flat) {
                            totalYieldMultiplier += bonus.value / 100;
                        }
                    });
                }
                
                const potentialYield = baseModuleYield * totalYieldMultiplier;
                const amountToMine = Math.min(potentialYield, targetObject.userData.oreQuantity);
                if (amountToMine <= 0) return p;
    
                const capacity = shipData.attributes.cargoCapacity + (shipData.attributes.oreHold || 0);
                let currentVolume = 0;
                for (const matId in p.shipCargo.materials) {
                    currentVolume += (getItemData(matId)?.volume || 0) * p.shipCargo.materials[matId];
                }
                for (const itemId of p.shipCargo.items) {
                    currentVolume += (getItemData(itemId)?.volume || 0);
                }
    
                const availableSpace = Math.max(0, capacity - currentVolume);
                if (availableSpace <= 0) return p;
    
                const maxUnitsThatCanFit = Math.floor(availableSpace / oreVolumePerUnit);
                const amountToAdd = Math.min(amountToMine, maxUnitsThatCanFit);
    
                if (amountToAdd <= 0) {
                     setShowCargoFullMessage(true);
                     setTimeout(() => setShowCargoFullMessage(false), 3000);
                     return p;
                }
    
                const newState = JSON.parse(JSON.stringify(p));
                newState.shipCargo.materials[oreData.id] = (newState.shipCargo.materials[oreData.id] || 0) + amountToAdd;
                targetObject.userData.oreQuantity -= amountToAdd;
    
                const newVolume = currentVolume + (amountToAdd * oreVolumePerUnit);
                if (newVolume >= capacity) {
                    setShowCargoFullMessage(true);
                    setTimeout(() => setShowCargoFullMessage(false), 3000);
                }
    
                setTargetData(t => (t.selectedTarget && t.selectedTarget.uuid === targetObject.uuid) ? { ...t, selectedTarget: { ...t.selectedTarget, oreQuantity: targetObject.userData.oreQuantity } } : t);
    
                if (targetObject.userData.oreQuantity <= 0) {
                    targetObject.visible = false;
                     threeRef.current.scene.remove(targetObject);
                     gameDataRef.current.asteroids = gameDataRef.current.asteroids.filter(a => a.uuid !== targetObject.uuid);
                     gameDataRef.current.navObjects = gameDataRef.current.navObjects.filter(n => n.object3D.uuid !== targetObject.uuid);
                     handleDeselectTarget();
                }
                return newState;
            });
            setMiningState(null);
        }, cycleTime);
        return true;
    }, [playerState, targetData.selectedTarget, miningState, handleDeselectTarget, isAutoMining]);

    const handleMineSingleCycle = useCallback(() => {
        if (miningState) return;
        setIsAutoMining(false);
        startMiningCycle();
    }, [miningState, startMiningCycle]);

    const handleStartAutoMine = useCallback(() => {
        if (miningState || isAutoMining) return;
        setIsAutoMining(true);
    }, [miningState, isAutoMining]);

    // This effect drives the auto-mining loop.
    useEffect(() => {
        if (isAutoMining && !miningState) {
            const cycleStarted = startMiningCycle();
            if (!cycleStarted) {
                // If we failed to start a cycle (e.g., cargo full, out of range), stop trying.
                setIsAutoMining(false);
            }
        }
    }, [isAutoMining, miningState, startMiningCycle]);

    const handleAttackTarget = useCallback(() => {
        const { selectedTarget } = targetData;
        if (!selectedTarget || selectedTarget.type !== 'pirate' || !selectedTarget.hp) return;

        const fittedWeapons = playerState.currentShipFitting.high
            .map((id, index) => ({ id, slotKey: `high-${index}` }))
            .filter(item => {
                if (!item.id || deactivatedWeaponSlots.includes(item.slotKey)) return false;
                const moduleData = getItemData(item.id);
                return !!moduleData && ['projectile', 'hybrid', 'energy', 'missile'].includes(moduleData.subcategory);
            })
            .map(item => getItemData(item.id) as Module);
        
        if (fittedWeapons.length === 0) {
            return;
        }

        let totalDamage = 0;

        fittedWeapons.forEach(weapon => {
            const range = weapon.attributes.optimalRange || 0;
            if (selectedTarget.distance <= range) {
                totalDamage += weapon.attributes.damage || 0;
            }
        });

        if (totalDamage === 0) {
            return;
        }
        
        const newHp = { ...selectedTarget.hp };
        let remainingDamage = totalDamage;

        // Apply damage to shield, then armor, then hull
        if (newHp.shield > 0) {
            const damageToShield = Math.min(newHp.shield, remainingDamage);
            newHp.shield -= damageToShield;
            remainingDamage -= damageToShield;
        }
        if (remainingDamage > 0 && newHp.armor > 0) {
            const damageToArmor = Math.min(newHp.armor, remainingDamage);
            newHp.armor -= damageToArmor;
            remainingDamage -= damageToArmor;
        }
        if (remainingDamage > 0 && newHp.hull > 0) {
            const damageToHull = Math.min(newHp.hull, remainingDamage);
            newHp.hull -= damageToHull;
        }

        // Update target state
        setTargetData(t => t.selectedTarget ? { ...t, selectedTarget: { ...t.selectedTarget, hp: newHp } } : t);
        selectedTarget.object3D.userData.hp = newHp;
    }, [targetData.selectedTarget, playerState.currentShipFitting, deactivatedWeaponSlots]);

    // Autofire Effect
    useEffect(() => {
        const fireInterval = setInterval(() => {
            if (gameState === GameState.SOLAR_SYSTEM && targetData.selectedTarget?.type === 'pirate') {
                handleAttackTarget();
            }
        }, 1500); // Fire every 1.5 seconds

        return () => clearInterval(fireInterval);
    }, [gameState, targetData.selectedTarget, handleAttackTarget]);
    
    const handleLootWreck = useCallback(() => {
        if (!targetData.selectedTarget || targetData.selectedTarget.type !== 'wreck') return;
        
        const wreck = gameDataRef.current.wrecks.find(w => w.uuid === targetData.selectedTarget!.uuid);
        if (!wreck) return;
        
        const distance = threeRef.current.player.position.distanceTo(wreck.position);
        if (distance > LOOT_RANGE) {
            alert("You are too far away to loot the wreck.");
            return;
        }

        const loot = wreck.userData.loot as (AnyItem & { quantity?: number })[];
        
        setPlayerState(p => {
            // Cargo check
            const currentShipData = SHIP_DATA[p.currentShipId];
            const totalCapacity = currentShipData.attributes.cargoCapacity + (currentShipData.attributes.oreHold || 0);
            let currentVolume = 0;
            for (const matId in p.shipCargo.materials) {
                currentVolume += (getItemData(matId)?.volume || 0) * p.shipCargo.materials[matId];
            }
            for (const itemId of p.shipCargo.items) {
                currentVolume += (getItemData(itemId)?.volume || 0);
            }
            
            let lootVolume = 0;
            loot.forEach(item => {
                lootVolume += (item.volume || 0.1) * (item.quantity || 1);
            });

            if (currentVolume + lootVolume > totalCapacity) {
                setShowCargoFullMessage(true);
                setTimeout(() => setShowCargoFullMessage(false), 3000);
                return p;
            }

            // Add items to cargo
            const newState = JSON.parse(JSON.stringify(p));
            loot.forEach(item => {
                const stackableCategories: string[] = ['Ammunition', 'Ore', 'Mineral', 'Component', 'Consumable', 'Material'];
                if (stackableCategories.includes(item.category)) {
                    newState.shipCargo.materials[item.id] = (newState.shipCargo.materials[item.id] || 0) + (item.quantity || 1);
                } else {
                    for (let i = 0; i < (item.quantity || 1); i++) {
                        newState.shipCargo.items.push(item.id);
                    }
                }
            });
            return newState;
        });

        // Remove wreck
        threeRef.current.scene?.remove(wreck);
        gameDataRef.current.wrecks = gameDataRef.current.wrecks.filter(w => w.uuid !== wreck.uuid);
        gameDataRef.current.navObjects = gameDataRef.current.navObjects.filter(n => n.object3D.uuid !== wreck.uuid);
        handleDeselectTarget();

    }, [targetData.selectedTarget, handleDeselectTarget]);


    const handleTakeDamage = useCallback((damage: number) => {
        setIsTakingDamage(true);
        setTimeout(() => setIsTakingDamage(false), 200);

        setPlayerState(p => {
            const newHP = { ...p.shipHP };
            let remainingDamage = damage;

            if (newHP.shield > 0) {
                const damageToShield = Math.min(newHP.shield, remainingDamage);
                newHP.shield -= damageToShield;
                remainingDamage -= damageToShield;
            }
            if (remainingDamage > 0 && newHP.armor > 0) {
                const damageToArmor = Math.min(newHP.armor, remainingDamage);
                newHP.armor -= damageToArmor;
                remainingDamage -= damageToArmor;
            }
            if (remainingDamage > 0 && newHP.hull > 0) {
                newHP.hull -= remainingDamage;
            }
            
            if (newHP.hull <= 0) {
                console.error("PLAYER SHIP DESTROYED!");
                // TODO: Handle player destruction
            }

            return { ...p, shipHP: newHP };
        });
    }, []);

    // Effect to handle target destruction from any source
    useEffect(() => {
        if (targetData.selectedTarget?.type === 'pirate' && targetData.selectedTarget?.hp && targetData.selectedTarget.hp.hull <= 0) {
            console.log(`${targetData.selectedTarget.name} destroyed!`);

            const enemyIndex = gameDataRef.current.enemies.findIndex(e => e.object3D.uuid === targetData.selectedTarget?.uuid);
            if (enemyIndex === -1) return;

            const enemy = gameDataRef.current.enemies[enemyIndex];
            const lastPosition = enemy.object3D.position.clone();
            
            // 1. Add bounty
            setPlayerState(p => ({ ...p, isk: p.isk + enemy.bounty }));

            // 2. Create loot wreck
            const wreck = createEnemyLoot(threeRef.current.scene, enemy, lastPosition);
            if (wreck) {
                gameDataRef.current.wrecks.push(wreck);
                gameDataRef.current.navObjects.push({ name: wreck.userData.name, type: 'wreck', object3D: wreck });
            }

            // 3. Despawn logic
            threeRef.current.scene?.remove(enemy.object3D);
            gameDataRef.current.enemies.splice(enemyIndex, 1);
            gameDataRef.current.navObjects = gameDataRef.current.navObjects.filter(n => n.object3D.uuid !== targetData.selectedTarget?.uuid);

            handleDeselectTarget();
        }
    }, [targetData.selectedTarget, handleDeselectTarget]);


     // --- DRONE LOGIC ---

    const spawnDrones = useCallback(() => {
        if (!threeRef.current.player || playerState.droneBayCargo.length === 0) return;
        despawnDrones(); // Clear any existing drone objects first

        const droneGeometry = new THREE.ConeGeometry(5, 12, 4);
        const droneMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.6, roughness: 0.5 });
        const miningDroneMaterial = new THREE.MeshStandardMaterial({ color: 0x44ff44, metalness: 0.6, roughness: 0.5 });


        playerState.droneBayCargo.forEach((droneId, index) => {
            const droneData = getItemData(droneId) as Drone;
            if (!droneData) return;
            
            const material = droneData.attributes.miningYield ? miningDroneMaterial : droneMaterial;
            const droneMesh = new THREE.Mesh(droneGeometry, material);
            const playerPos = threeRef.current.player.position;
            const spawnOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
            droneMesh.position.copy(playerPos).add(spawnOffset);
            
            threeRef.current.scene.add(droneMesh);
            gameDataRef.current.drones.push({
                object3D: droneMesh,
                orbitAngle: (index / playerState.droneBayCargo.length) * Math.PI * 2,
                orbitRadius: 80 + (index * 10),
                id: droneId
            });
        });
    }, [playerState.droneBayCargo, despawnDrones]);

    const handleToggleDrones = useCallback(() => {
        if (droneStatus === 'docked') {
            if (playerState.droneBayCargo.length > 0) {
                spawnDrones();
                setDroneStatus('idle');
            }
        } else if (droneStatus === 'idle' || droneStatus === 'attacking' || droneStatus === 'mining') {
            setDroneStatus('returning');
        }
    }, [droneStatus, playerState.droneBayCargo, spawnDrones]);

    const handleDroneAttack = useCallback(() => {
        if (droneStatus === 'idle' && targetData.selectedTarget?.type === 'pirate') {
            setDroneStatus('attacking');
        }
    }, [droneStatus, targetData.selectedTarget]);
    
    const handleDroneMine = useCallback(() => {
        if (droneStatus === 'idle' && targetData.selectedTarget?.type === 'asteroid') {
            droneMiningTimerRef.current = Date.now(); // Set the timer when mining starts
            setDroneStatus('mining');
        }
    }, [droneStatus, targetData.selectedTarget]);

    // Drone Damage Loop
    useEffect(() => {
        if (droneStatus !== 'attacking') {
            return;
        }

        const damageInterval = setInterval(() => {
            let totalDroneDamage = 0;
            gameDataRef.current.drones.forEach(drone => {
                const droneData = getItemData(drone.id) as Drone;
                if (droneData) {
                    totalDroneDamage += droneData.attributes.damage || 0;
                }
            });

            if (totalDroneDamage > 0) {
                setTargetData(t => {
                    if (!t.selectedTarget || t.selectedTarget.type !== 'pirate' || !t.selectedTarget.hp) {
                        return t;
                    }

                    const newHp = { ...t.selectedTarget.hp };
                    let remainingDamage = totalDroneDamage;

                    if (newHp.shield > 0) {
                        const damageToShield = Math.min(newHp.shield, remainingDamage);
                        newHp.shield -= damageToShield;
                        remainingDamage -= damageToShield;
                    }
                    if (remainingDamage > 0 && newHp.armor > 0) {
                        const damageToArmor = Math.min(newHp.armor, remainingDamage);
                        newHp.armor -= damageToArmor;
                        remainingDamage -= damageToArmor;
                    }
                    if (remainingDamage > 0 && newHp.hull > 0) {
                        newHp.hull -= remainingDamage;
                    }

                    t.selectedTarget.object3D.userData.hp = newHp;

                    return { ...t, selectedTarget: { ...t.selectedTarget, hp: newHp } };
                });
            }
        }, 1000); // Apply DPS every second

        return () => clearInterval(damageInterval);
    }, [droneStatus]);
    

    const handleLoadDrone = useCallback((droneId: string) => {
        setPlayerState(p => {
            const currentShip = SHIP_DATA[p.currentShipId];
            if (p.droneBayCargo.length >= currentShip.attributes.droneBay) {
                alert("Drone bay is full.");
                return p;
            }
            
            const stationId = getStationId(activeSystemId!, gameDataRef.current.dockedStation!.userData.name);
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId];
            
            const itemIndexInHangar = stationHangar.items.indexOf(droneId);
            if (itemIndexInHangar > -1) {
                stationHangar.items.splice(itemIndexInHangar, 1);
                newState.droneBayCargo.push(droneId);
            }
            return newState;
        });
    }, [activeSystemId]);

    const handleUnloadDrone = useCallback((droneId: string, index: number) => {
        setPlayerState(p => {
            const stationId = getStationId(activeSystemId!, gameDataRef.current.dockedStation!.userData.name);
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId];

            newState.droneBayCargo.splice(index, 1);
            stationHangar.items.push(droneId);

            return newState;
        });
    }, [activeSystemId]);

    const handleToggleModule = useCallback((slotKey: string) => {
        setActiveModuleSlots(prev => 
            prev.includes(slotKey)
                ? prev.filter(s => s !== slotKey)
                : [...prev, slotKey]
        );
    }, []);
    
    const handleToggleWeapon = useCallback((slotKey: string) => {
        setDeactivatedWeaponSlots(prev =>
            prev.includes(slotKey)
                ? prev.filter(s => s !== slotKey)
                : [...prev, slotKey]
        );
    }, []);

    const handleToggleModuleGroup = useCallback((slotType: 'medium' | 'low') => {
        const slots = playerStateRef.current.currentShipFitting[slotType];
        if (!slots || slots.length === 0) return;
    
        let firstModuleSlotKey: string | null = null;
        for (let i = 0; i < slots.length; i++) {
            if (slots[i]) {
                firstModuleSlotKey = `${slotType}-${i}`;
                break;
            }
        }
    
        if (!firstModuleSlotKey) return;
    
        const isGroupCurrentlyActive = activeModuleSlots.includes(firstModuleSlotKey);
    
        setActiveModuleSlots(prev => {
            const newActiveSlots = new Set(prev);
            
            for (let i = 0; i < slots.length; i++) {
                const moduleId = slots[i];
                if (!moduleId) continue;
    
                const module = getItemData(moduleId) as Module;
                const isToggleable = !['mining_laser', 'projectile', 'hybrid', 'energy', 'missile'].includes(module.subcategory);
    
                if (isToggleable) {
                    const slotKey = `${slotType}-${i}`;
                    if (isGroupCurrentlyActive) {
                        newActiveSlots.delete(slotKey);
                    } else {
                        newActiveSlots.add(slotKey);
                    }
                }
            }
            
            return Array.from(newActiveSlots);
        });
    }, [activeModuleSlots]);


    const handleSlotClick = useCallback((slotType: 'high' | 'medium' | 'low', slotIndex: number) => {
        const moduleId = playerStateRef.current.currentShipFitting[slotType][slotIndex];
        if (!moduleId) return;

        const module = getItemData(moduleId) as Module;
        if (!module) return;

        const slotKey = `${slotType}-${slotIndex}`;
        const category = module.subcategory;

        if (['projectile', 'hybrid', 'energy', 'missile'].includes(category)) {
            handleToggleWeapon(slotKey);
        } else if (category.includes('miner')) {
            handleMineSingleCycle();
        } else {
            handleToggleModule(slotKey);
        }
    }, [handleToggleWeapon, handleMineSingleCycle, handleToggleModule]);

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
            gameData.enemies = [];
            gameData.wrecks = [];
            gameData.drones = [];
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
            
            const newEnemies = spawnEnemies(three.scene, systemId);
            gameData.enemies = newEnemies;
            newEnemies.forEach(enemy => {
                gameData.navObjects.push({ name: enemy.object3D.userData.name, type: 'pirate', object3D: enemy.object3D });
            });


            three.player = new THREE.Object3D();
            if (loadedPositionRef.current && loadedQuaternionRef.current) {
                three.player.position.copy(loadedPositionRef.current);
                three.player.quaternion.copy(loadedQuaternionRef.current);
                loadedPositionRef.current = null; // Consume it
                loadedQuaternionRef.current = null;
            } else if (undockPositionRef.current) {
                three.player.position.copy(undockPositionRef.current);
            } else {
                three.player.position.set(0, 0, systemData.planets && systemData.planets.length > 0 ? systemData.planets[systemData.planets.length - 1]!.distance + 4000 : 5000);
            }
            three.player.add(three.solarSystemCamera);
            three.solarSystemCamera.position.set(0, 0, 0);
            three.scene.add(three.player);
        };
        
        if(activeSystemId) {
            createSolarSystem(activeSystemId);
            
            if (initialDockedStationNameRef.current) {
                const stationObject = gameData.stations.find(
                    s => s.userData.name === initialDockedStationNameRef.current
                );
                if (stationObject) {
                    gameData.dockedStation = stationObject;
                }
                initialDockedStationNameRef.current = null; // Consume it
            }
        }

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
        const updateDrones = (delta: number, currentDroneStatus: DroneStatus) => {
            if (!three.player || currentDroneStatus === 'docked' || gameData.drones.length === 0) return;
        
            const droneSpeed = 150 * delta;
            let targetPosition: THREE.Vector3 | null = null;
        
            if ((currentDroneStatus === 'attacking' || currentDroneStatus === 'mining') && targetDataRef.current.selectedTarget) {
                targetPosition = targetDataRef.current.selectedTarget.object3D.getWorldPosition(new THREE.Vector3());
            } else {
                targetPosition = three.player.position.clone();
            }
        
            if (!targetPosition) {
                // Failsafe if target disappears but state hasn't updated
                setDroneStatus('idle');
                return;
            }
        
            const dronesToKeep: typeof gameData.drones = [];
        
            gameData.drones.forEach((drone, index) => {
                let keep = true;
                drone.orbitAngle += (0.5 + (index * 0.1)) * delta;
        
                let orbitCenter = targetPosition!;
                let desiredPosition: THREE.Vector3;
        
                if (currentDroneStatus === 'returning') {
                    desiredPosition = three.player.position.clone();
                    const distanceToPlayer = drone.object3D.position.distanceTo(desiredPosition);
                    if (distanceToPlayer < 100) {
                        three.scene.remove(drone.object3D);
                        keep = false;
                    }
                } else {
                     desiredPosition = new THREE.Vector3(
                        orbitCenter.x + Math.cos(drone.orbitAngle) * drone.orbitRadius,
                        orbitCenter.y + Math.sin(drone.orbitAngle * 1.2) * (drone.orbitRadius / 4),
                        orbitCenter.z + Math.sin(drone.orbitAngle) * drone.orbitRadius
                    );
                }
        
                if (keep) {
                    drone.object3D.position.lerp(desiredPosition, droneSpeed * 0.05);
                    drone.object3D.lookAt(orbitCenter);
                    dronesToKeep.push(drone);
                }
            });
        
            gameData.drones = dronesToKeep;
        
            if (currentDroneStatus === 'returning' && gameData.drones.length === 0) {
                setDroneStatus('docked');
            }

            // --- DRONE MINING LOGIC ---
            if (currentDroneStatus === 'mining') {
                const target = targetDataRef.current.selectedTarget;
                if (!target || target.type !== 'asteroid') {
                    setDroneStatus('idle');
                    return;
                }

                const firstMiningDroneData = gameData.drones
                    .map(d => getItemData(d.id) as Drone)
                    .find(d => d?.attributes?.miningYield);

                if (!firstMiningDroneData) { // No mining drones are out
                    setDroneStatus('idle');
                    return;
                }

                const cycleTime = (firstMiningDroneData.attributes.cycleTime || 5) * 1000;
                const now = Date.now();

                if (now - droneMiningTimerRef.current >= cycleTime) {
                    droneMiningTimerRef.current = now; // Reset timer for next cycle

                    const currentShipData = SHIP_DATA[playerStateRef.current.currentShipId];
                    if (!currentShipData) return;

                    const totalCapacity = currentShipData.attributes.cargoCapacity + (currentShipData.attributes.oreHold || 0);
                    let currentCargoVolume = 0;
                    for (const matId in playerStateRef.current.shipCargo.materials) {
                        currentCargoVolume += (getItemData(matId)?.volume || 0) * playerStateRef.current.shipCargo.materials[matId];
                    }
                    for (const itemId of playerStateRef.current.shipCargo.items) {
                        currentCargoVolume += (getItemData(itemId)?.volume || 0);
                    }

                    if (currentCargoVolume >= totalCapacity) {
                        setShowCargoFullMessage(true);
                        setTimeout(() => setShowCargoFullMessage(false), 3000);
                        setDroneStatus('idle');
                        return;
                    }

                    let totalDroneYield = 0;
                    gameData.drones.forEach(drone => {
                        const droneData = getItemData(drone.id) as Drone;
                        if (droneData && droneData.attributes.miningYield) {
                            totalDroneYield += droneData.attributes.miningYield;
                        }
                    });

                    if (totalDroneYield > 0) {
                        setPlayerState(p => {
                            if (!targetDataRef.current.selectedTarget) {
                                setDroneStatus('idle');
                                return p;
                            }
                            const targetObject = gameData.asteroids.find(a => a.uuid === targetDataRef.current.selectedTarget!.uuid);
                            if (!targetObject || targetObject.userData.oreQuantity <= 0) {
                                setDroneStatus('idle');
                                return p;
                            }

                            const oreData = targetObject.userData.ore as Ore;
                            const oreVolumePerUnit = oreData.volume || 0.1;
                            const amountToMine = Math.min(totalDroneYield, targetObject.userData.oreQuantity);

                            if (amountToMine <= 0) {
                                setDroneStatus('idle');
                                return p;
                            }

                            let currentVolume = 0;
                            for (const matId in p.shipCargo.materials) {
                                currentVolume += (getItemData(matId)?.volume || 0) * p.shipCargo.materials[matId];
                            }
                            for (const itemId of p.shipCargo.items) {
                                currentVolume += (getItemData(itemId)?.volume || 0);
                            }
                            const availableSpace = Math.max(0, totalCapacity - currentVolume);
                            if (availableSpace <= 0) {
                                return p;
                            }

                            const maxUnitsThatCanFit = Math.floor(availableSpace / oreVolumePerUnit);
                            const amountToAdd = Math.min(amountToMine, maxUnitsThatCanFit);

                            if (amountToAdd <= 0) {
                                setShowCargoFullMessage(true);
                                setTimeout(() => setShowCargoFullMessage(false), 3000);
                                setDroneStatus('idle');
                                return p;
                            }

                            const newState = JSON.parse(JSON.stringify(p));
                            newState.shipCargo.materials[oreData.id] = (newState.shipCargo.materials[oreData.id] || 0) + amountToAdd;
                            targetObject.userData.oreQuantity -= amountToAdd;

                            setTargetData(t => (t.selectedTarget && t.selectedTarget.uuid === targetObject.uuid) ? { ...t, selectedTarget: { ...t.selectedTarget, oreQuantity: targetObject.userData.oreQuantity } } : t);

                            if (targetObject.userData.oreQuantity <= 0) {
                                targetObject.visible = false;
                                threeRef.current.scene.remove(targetObject);
                                gameData.asteroids = gameData.asteroids.filter(a => a.uuid !== targetObject.uuid);
                                gameData.navObjects = gameData.navObjects.filter(n => n.object3D.uuid !== targetObject.uuid);
                                handleDeselectTarget();
                            }
                            
                            return newState;
                        });
                    }
                }
            }
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

            const targetableObjects = [...gameData.asteroids, ...gameData.stations, ...gameData.enemies.map(e => e.object3D), ...gameData.wrecks];
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
                let content = `<strong>${data.name}</strong>`;
                if (data.type === 'asteroid') {
                    content += `<br>Quantity: ${data.oreQuantity}`;
                } else if (data.type === 'pirate') {
                    content += `<br>Ship: ${data.shipName}`;
                } else if (data.type === 'wreck') {
                    content += `<br>Contains loot`;
                }
                setTooltipData(d => ({...d, visible: true, content}));
            } else {
                setTooltipData(d => d.visible ? ({...d, visible: false}) : d);
            }

            const isPlayerControllable = !isWarping() && !gameData.lookAtTarget;
            if (!three.player || !isPlayerControllable) return;

            const baseSpeed = currentShip.attributes.speed;
            const agility = currentShip.attributes.agility;
            const finalSpeed = baseSpeed * speedMultiplier;

            // Combine keyboard and joystick inputs
            const forwardInput = (keysRef.current['KeyW'] ? 1 : 0) - (keysRef.current['KeyS'] ? 1 : 0);
            const strafeInput = (keysRef.current['KeyD'] ? 1 : 0) - (keysRef.current['KeyA'] ? 1 : 0);
            
            const finalForward = Math.max(-1, Math.min(1, forwardInput - joystickVecRef.current.y));
            const finalStrafe = Math.max(-1, Math.min(1, strafeInput + joystickVecRef.current.x));

            if (finalForward !== 0) three.player.translateZ(-finalSpeed * finalForward * delta);
            if (finalStrafe !== 0) three.player.translateX(finalSpeed * finalStrafe * delta * 0.5);

            // Vertical, roll, and pitch controls remain keyboard-only for now
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
        const animate = (time: number) => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = three.clock.getDelta();
            
            // This is a way to get the most recent state inside the animation loop
            // which is a closure and would otherwise hold stale state.
            const currentDroneStatus = (mount.parentElement as HTMLElement)?.dataset.dronestatus as DroneStatus;
            
            const currentGameState = (mount.parentElement as HTMLElement)?.dataset.gamestate;

            if (currentGameState === GameState.SOLAR_SYSTEM) {
                 if (isWarping() && three.player) updateWarp(three.player, delta);
                 
                const currentShipId = (mount.parentElement as HTMLElement)?.dataset.shipid;
                if (currentShipId) {
                    const currentShip = SHIP_DATA[currentShipId];
                    if (currentShip) {
                        updateSolarSystem(delta, currentShip);
                        updateDrones(delta, currentDroneStatus);
                        updateEnemies(gameData.enemies, three.player, delta);

                        const now = performance.now();
                        if (now - lastEnemyAttackTimeRef.current > ENEMY_ATTACK_COOLDOWN) {
                            lastEnemyAttackTimeRef.current = now;
                            const totalDamage = updateEnemyAttacks(gameData.enemies, three.player);
                            if (totalDamage > 0) {
                                handleTakeDamage(totalDamage);
                            }
                        }
                    }
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

            const isModalOpen = (mount.parentElement as HTMLElement)?.dataset.modalopen === 'true';

            // Only update tooltip position if no modal is open. This prevents re-renders
            // that were resetting scroll positions in modals.
            if (!isModalOpen) {
                setTooltipData(d => ({ ...d, x: event.clientX, y: event.clientY }));
            }

            if(gameData.isMouseLooking && three.player && !isWarping() && !gameData.lookAtTarget) {
                const deltaX = event.clientX - prevMousePosRef.current.x;
                const deltaY = event.clientY - prevMousePosRef.current.y;
                const currentShipId = (mount.parentElement as HTMLElement)?.dataset.shipid;
                const ship = SHIP_DATA[currentShipId];
                if(!ship) return;
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
        
        const onTouchStart = (event: TouchEvent) => {
            // If the touch starts on a UI element that should allow scrolling,
            // do nothing and let the browser handle it.
            if ((event.target as HTMLElement).closest('.allow-touch-scroll')) {
                return;
            }

            // If the touch starts on the main 3D canvas, initiate camera look.
            if (event.target === three.renderer.domElement) {
                if (event.touches.length === 1) {
                    event.preventDefault();
                    prevMousePosRef.current.x = event.touches[0].clientX;
                    prevMousePosRef.current.y = event.touches[0].clientY;
                    const currentGameState = (mount.parentElement as HTMLElement)?.dataset.gamestate;
                    if (currentGameState === GameState.SOLAR_SYSTEM) {
                        const isModalOpen = (mount.parentElement as HTMLElement)?.dataset.modalopen === 'true';
                        if (!isModalOpen) gameData.isMouseLooking = true;
                    }
                }
            }
        };

        const onTouchMove = (event: TouchEvent) => {
            if (event.touches.length === 1) {
                 // Only prevent default and rotate camera if we are in "mouse looking" mode.
                if(gameData.isMouseLooking && three.player && !isWarping() && !gameData.lookAtTarget) {
                    event.preventDefault(); // Prevent scrolling ONLY when rotating camera.
                    const touch = event.touches[0];
                    const deltaX = touch.clientX - prevMousePosRef.current.x;
                    const deltaY = touch.clientY - prevMousePosRef.current.y;
                    const currentShipId = (mount.parentElement as HTMLElement)?.dataset.shipid;
                    const ship = SHIP_DATA[currentShipId];
                    if(!ship) return;
                    const agilityFactor = 1 / (ship.attributes.agility * 2);
                    three.player.rotateY(-deltaX * agilityFactor * 0.05);
                    three.player.rotateX(-deltaY * agilityFactor * 0.05);

                    prevMousePosRef.current.x = touch.clientX;
                    prevMousePosRef.current.y = touch.clientY;
                }
            }
        };

        const onTouchEnd = () => {
            gameData.isMouseLooking = false;
        };

        // --- INIT & CLEANUP ---
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
        document.addEventListener('touchcancel', onTouchEnd);
        
        animate(0);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            document.removeEventListener('touchcancel', onTouchEnd);
            if (mountRef.current && three.renderer) mountRef.current.removeChild(three.renderer.domElement);
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
    
    // Effect to keep joystick ref up-to-date for the animation loop
    useEffect(() => {
        joystickVecRef.current = joystickVector;
    }, [joystickVector]);

    const isTouchDevice = 'ontouchstart' in window;
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

    const isAttackButtonDisabled = droneStatus !== 'idle' || !targetData.selectedTarget || targetData.selectedTarget.type !== 'pirate';
    const isDroneMineButtonDisabled = droneStatus !== 'idle' || !targetData.selectedTarget || targetData.selectedTarget.type !== 'asteroid';
    const isDockable = targetData.selectedTarget?.type === 'station' && targetData.selectedTarget.distance < DOCKING_RANGE;

    const hasDroneBay = playerState.currentShipFitting.low.some(id => id === 'mod_drone_bay_s');


    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center text-2xl">
                Loading...
            </div>
        );
    }

    if (showNamePrompt) {
        return <NewPlayerModal onStart={handleStartNewGame} />;
    }

    return (
        <div 
            id="app-container"
            className={`transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            data-gamestate={gameState}
            data-shipid={playerState.currentShipId}
            data-modalopen={isModalOpen}
            data-mining={!!miningState}
            data-miningtarget={miningState?.targetId || ''}
            data-dronestatus={droneStatus}
        >
             <div
                className={`fixed inset-0 z-[250] pointer-events-none transition-all duration-200 ease-out ${
                    isTakingDamage ? 'shadow-[inset_0_0_100px_30px_rgba(255,0,0,0.5)]' : ''
                }`}
            />
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
                    
                    {gameState === GameState.SOLAR_SYSTEM && (
                         <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 text-lg pointer-events-none">
                            Ship: {currentShip?.name}
                        </div>
                    )}

                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && (
                         <div className="absolute top-28 left-2.5 z-5 flex flex-col gap-4">
                            <ShipStatsUI playerState={playerState} shipHP={playerState.shipHP} />
                            <MissionTrackerUI playerState={playerState} />
                        </div>
                    )}
                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && <NavPanel data={navPanelData} selectedTargetId={targetData.selectedTarget?.uuid || null} onSelectTarget={handleSelectTarget} />}
                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && 
                        <SelectedTargetUI 
                            target={targetData.selectedTarget} 
                            miningState={miningState ? { targetId: miningState.targetId, progress: miningState.progress } : null} 
                            isAutoMining={isAutoMining}
                            onWarp={handleWarpToTarget} 
                            onMine={handleMineSingleCycle}
                            onAutoMine={handleStartAutoMine}
                            onStopMine={handleStopMining}
                            onLookAt={handleLookAtTarget}
                            onDeselect={handleDeselectTarget}
                            onAttack={handleAttackTarget}
                            setTooltip={setTooltipContent}
                            clearTooltip={clearTooltipContent}
                            isDockable={isDockable}
                            onDock={() => {
                                if (targetData.selectedTarget && targetData.selectedTarget.type === 'station') {
                                    dockAtStation(targetData.selectedTarget.object3D);
                                }
                            }}
                            onLootWreck={handleLootWreck}
                        />
                    }
                    
                    {gameState === GameState.SOLAR_SYSTEM && !isModalOpen && (
                         <ModuleBarUI
                            playerState={playerState}
                            onSlotClick={handleSlotClick}
                            activeModuleSlots={activeModuleSlots}
                            deactivatedWeaponSlots={deactivatedWeaponSlots}
                            onToggleModuleGroup={handleToggleModuleGroup}
                            setTooltip={setTooltipContent}
                            clearTooltip={clearTooltipContent}
                            hasDroneBay={hasDroneBay}
                            droneStatus={droneStatus}
                            activeDrones={gameDataRef.current.drones.length}
                            totalDrones={playerState.droneBayCargo.length}
                            onToggleDrones={handleToggleDrones}
                            onDroneAttack={handleDroneAttack}
                            isAttackButtonDisabled={isAttackButtonDisabled}
                            onDroneMine={handleDroneMine}
                            isMineButtonDisabled={isDroneMineButtonDisabled}
                            selectedTargetType={targetData.selectedTarget?.type || null}
                        />
                    )}

                    {gameState === GameState.SOLAR_SYSTEM && (
                        <div className="absolute bottom-28 w-full text-center pointer-events-none z-10">
                            {isWarpingState && <p className="text-2xl text-cyan-400 animate-pulse">WARP DRIVE ACTIVE</p>}
                            <p className="text-sm">Speed: {Math.round(speedMultiplier * 100)}%</p>
                        </div>
                    )}


                    {gameState === GameState.SOLAR_SYSTEM && isTouchDevice && !isModalOpen && <VirtualJoystick onMove={setJoystickVector} />}

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

                    {gameState === GameState.SOLAR_SYSTEM && showCargoFullMessage && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-red-500 font-bold animate-pulse z-50 pointer-events-none">
                            SHIP CARGO FULL
                        </div>
                    )}
                    
                    <HangarModal isOpen={isShipHangarOpen} onClose={() => setShipHangarOpen(false)} playerState={playerState} onActivateShip={handleActivateShip} stationId={stationId} />
                    {stationId && <ItemHangarModal isOpen={isItemHangarOpen} onClose={() => setItemHangarOpen(false)} playerState={playerState} setPlayerState={setPlayerState} stationId={stationId} /> }

                    {gameState === GameState.DOCKED && gameDataRef.current.dockedStation && (
                        <StationInterface 
                            stationName={gameDataRef.current.dockedStation.userData.name}
                            onUndock={() => {
                                setShowStationHelp(false);
                                keysRef.current = {}; // Reset keyboard state to prevent "stuck keys"
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
                        <FittingInterface 
                            isOpen={isFittingOpen} 
                            onClose={() => setFittingOpen(false)} 
                            playerState={playerState} 
                            setPlayerState={setPlayerState} 
                            stationId={stationId}
                            onLoadDrone={handleLoadDrone}
                            onUnloadDrone={handleUnloadDrone}
                        />
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