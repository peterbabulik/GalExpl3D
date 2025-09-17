

import React, { useState, useEffect } from 'react';
import type { PlayerState, AgentData, MissionData, Drone } from './types';
import { 
    SHIP_DATA,
    BLUEPRINT_DATA,
    getItemData,
    DOCKED_BACKGROUND_IMAGES,
    SOLAR_SYSTEM_DATA,
} from './constants';
import {
    HangarModal,
    ItemHangarModal,
    CraftingInterface,
    FittingInterface,
    ReprocessingInterface,
    MarketInterface,
    StationInterface,
} from './StationModals';
import { AgentInterface } from './GeminiAgent';
import { SkillsUI } from './SkillsUI';
import { addSkillXp } from './skills';
import { TestingGrounds } from './TestingGrounds';

// --- Docked Background Component ---
const DockedBackground: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % DOCKED_BACKGROUND_IMAGES.length);
        }, 10000); // Change image every 10 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {DOCKED_BACKGROUND_IMAGES.map((url, index) => (
                <div
                    key={url}
                    className="fixed inset-0 bg-cover bg-center z-0 transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${url})`,
                        opacity: index === currentIndex ? 1 : 0,
                    }}
                    aria-hidden="true"
                />
            ))}
        </>
    );
};

interface DockedViewProps {
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    onUndock: () => void;
    stationId: string;
    stationName: string;
    systemId: number;
    isHomeStation: boolean;
    onSetHomeStation: () => void;
}

export const DockedView: React.FC<DockedViewProps> = ({
    playerState,
    setPlayerState,
    onUndock,
    stationId,
    stationName,
    systemId,
    isHomeStation,
    onSetHomeStation,
}) => {
    // --- STATE MANAGEMENT ---
    const [isShipHangarOpen, setShipHangarOpen] = useState(false);
    const [isItemHangarOpen, setItemHangarOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isFittingOpen, setFittingOpen] = useState(false);
    const [isReprocessingOpen, setReprocessingOpen] = useState(false);
    const [isMarketOpen, setMarketOpen] = useState(false);
    const [isAgentInterfaceOpen, setAgentInterfaceOpen] = useState(false);
    const [isSkillsOpen, setSkillsOpen] = useState(false);
    const [showStationHelp, setShowStationHelp] = useState(false);

    // Gemini-related state (cached data)
    const [agents, setAgents] = useState<Record<string, AgentData>>({});
    const [stationMissions, setStationMissions] = useState<Record<string, MissionData[]>>({});
    
    const systemData = SOLAR_SYSTEM_DATA[systemId];
    const stationData = systemData?.station;
    const isTestingStation = stationData?.name === stationName && stationData.type === 'testing';

    // --- HANDLERS ---
    const handleActivateShip = (newShipId: string) => {
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
                capacitor: newShipData.attributes.capacitor, maxCapacitor: newShipData.attributes.capacitor,
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
        if (!stationId) return;

        const bpData = BLUEPRINT_DATA[bpId];
        
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const newStationHangar = newState.stationHangars[stationId] || { items: [], materials: {} };

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
                    newStationHangar.materials[bpData.outputItem] = (newStationHangar.materials[bpData.outputItem] || 0) + bpData.outputQuantity;
                } else {
                    for (let i = 0; i < bpData.outputQuantity; i++) {
                        newStationHangar.items.push(bpData.outputItem);
                    }
                }
                
                newState.stationHangars[stationId] = newStationHangar;
                
                const xpGained = Math.ceil(bpData.manufacturingTime / 10);
                return addSkillXp(newState, 'skill_crafting', xpGained);
            }
            return newState;
        });
    };

    const handleAcceptMission = (mission: MissionData) => {
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
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

            for (const oreId in mission.objectives) {
                const required = mission.objectives[oreId];
                if ((stationHangar.materials[oreId] || 0) < required) {
                    console.error("Not enough materials to complete mission.");
                    return p;
                }
            }
            
            const newState = JSON.parse(JSON.stringify(p));
            const newHangar = newState.stationHangars[mission.stationId];

            for (const oreId in mission.objectives) {
                newHangar.materials[oreId] -= mission.objectives[oreId];
                if (newHangar.materials[oreId] <= 0) {
                    delete newHangar.materials[oreId];
                }
            }

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

            newState.activeMissions = newState.activeMissions.filter(m => m.id !== missionId);
            return newState;
        });
    };

    const handleLoadDrone = (droneId: string) => {
        setPlayerState(p => {
            const currentShip = SHIP_DATA[p.currentShipId];
            if (p.droneBayCargo.length >= currentShip.attributes.droneBay) {
                alert("Drone bay is full.");
                return p;
            }
            
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId];
            
            const itemIndexInHangar = stationHangar.items.indexOf(droneId);
            if (itemIndexInHangar > -1) {
                stationHangar.items.splice(itemIndexInHangar, 1);
                newState.droneBayCargo.push(droneId);
            }
            return newState;
        });
    };

    const handleUnloadDrone = (droneId: string, index: number) => {
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const stationHangar = newState.stationHangars[stationId];

            newState.droneBayCargo.splice(index, 1);
            stationHangar.items.push(droneId);

            return newState;
        });
    };
    
    return (
        <>
            <DockedBackground />
            
            {isTestingStation ? (
                 <TestingGrounds
                    stationName={stationName}
                    onUndock={() => {
                        onUndock();
                    }}
                />
            ) : (
                <>
                    <StationInterface 
                        stationName={stationName}
                        onUndock={() => {
                            setShowStationHelp(false);
                            onUndock();
                        }}
                        onOpenCrafting={() => { setCraftingOpen(true); setShowStationHelp(false); }}
                        onOpenShipHangar={() => { setShipHangarOpen(true); setShowStationHelp(false); }}
                        onOpenItemHangar={() => { setItemHangarOpen(true); setShowStationHelp(false); }}
                        onOpenFitting={() => { setFittingOpen(true); setShowStationHelp(false); }}
                        onOpenReprocessing={() => { setReprocessingOpen(true); setShowStationHelp(false); }}
                        onOpenMarket={() => { setMarketOpen(true); setShowStationHelp(false); }}
                        onOpenAgent={() => { setAgentInterfaceOpen(true); setShowStationHelp(false); }}
                        onOpenSkills={() => { setSkillsOpen(true); setShowStationHelp(false); }}
                        showHelp={showStationHelp}
                        onToggleHelp={() => setShowStationHelp(prev => !prev)}
                        onSetHomeStation={onSetHomeStation}
                        isHomeStation={isHomeStation}
                    />

                    <HangarModal isOpen={isShipHangarOpen} onClose={() => setShipHangarOpen(false)} playerState={playerState} onActivateShip={handleActivateShip} stationId={stationId} />
                    {stationId && <ItemHangarModal isOpen={isItemHangarOpen} onClose={() => setItemHangarOpen(false)} playerState={playerState} setPlayerState={setPlayerState} stationId={stationId} /> }

                    {isCraftingOpen && (
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

                    {isMarketOpen && stationId && systemId && (
                        <MarketInterface
                            isOpen={isMarketOpen}
                            onClose={() => setMarketOpen(false)}
                            playerState={playerState}
                            setPlayerState={setPlayerState}
                            stationId={stationId}
                            systemId={systemId}
                        />
                    )}
                    
                    {isAgentInterfaceOpen && stationId && systemId && (
                        <AgentInterface
                            isOpen={isAgentInterfaceOpen}
                            onClose={() => setAgentInterfaceOpen(false)}
                            playerState={playerState}
                            onAcceptMission={handleAcceptMission}
                            onCompleteMission={handleCompleteMission}
                            stationId={stationId}
                            systemId={systemId}
                            stationName={stationName}
                            cachedAgent={agents[stationId]}
                            setCachedAgent={(agent) => setAgents(a => ({...a, [stationId]: agent}))}
                            cachedMissions={stationMissions[stationId]}
                            setCachedMissions={(missions) => setStationMissions(m => ({...m, [stationId]: missions}))}
                        />
                    )}
                    
                    {isSkillsOpen && (
                        <SkillsUI
                            isOpen={isSkillsOpen}
                            onClose={() => setSkillsOpen(false)}
                            playerState={playerState}
                        />
                    )}
                </>
            )}
        </>
    );
};