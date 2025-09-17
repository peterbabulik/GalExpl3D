// GeminiAgent.tsx
import React, { useState, useEffect } from 'react';
// import { GoogleGenAI, Type } from "@google/genai";

import type { AgentData, MissionData, PlayerState } from './types';
// FIX: `ORE_DATA` is not exported from `./constants`. It should be imported from `./ores`.
import { 
    getItemData,
    SOLAR_SYSTEM_DATA,
    GALAXY_DATA
} from './constants';
import { ASTEROID_BELT_TYPES, ORE_DATA } from './ores';
import { UIButton, ItemIcon, hasMaterials } from './UI';

export const AgentInterface: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    onAcceptMission: (mission: MissionData) => void;
    onCompleteMission: (missionId: string) => void;
    stationId: string;
    systemId: number;
    stationName: string;
    cachedAgent: AgentData | undefined;
    setCachedAgent: (agent: AgentData) => void;
    cachedMissions: MissionData[] | undefined;
    setCachedMissions: (missions: MissionData[]) => void;
}> = ({ isOpen, onClose, playerState, onAcceptMission, onCompleteMission, stationId, systemId, stationName, cachedAgent, setCachedAgent, cachedMissions, setCachedMissions }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMission, setSelectedMission] = useState<MissionData | null>(null);

    const activeMissionForThisAgent = playerState.activeMissions.find(m => m.stationId === stationId);

    useEffect(() => {
        if (!isOpen) return;

        if (cachedAgent && cachedMissions) {
            if (activeMissionForThisAgent) {
                setSelectedMission(activeMissionForThisAgent);
            } else if (cachedMissions.length > 0) {
                setSelectedMission(cachedMissions[0]);
            }
            return;
        }

        const generateMockData = () => {
            setIsLoading(true);
            setError(null);

            // Artificial delay to simulate loading
            setTimeout(() => {
                try {
                    const system = GALAXY_DATA.systems.find(s => s.id === systemId);
                    const systemData = SOLAR_SYSTEM_DATA[systemId];
                    if (!system || !systemData) throw new Error("System data not found.");

                    const mockAgent: AgentData = {
                        id: stationId,
                        name: `Agent ${stationName.split(' ')[0]}`,
                        corporation: "Local Mining Inc.",
                        backstory: `We keep the wheels of industry turning in ${system.name}. Help us meet our quotas, pilot, and you'll be well compensated.`
                    };
                    setCachedAgent(mockAgent);

                    const beltData = ASTEROID_BELT_TYPES[systemData.asteroidBeltType || 'sparse'];
                    const availableOreIds = Object.keys(beltData.oreDistribution);

                    const mockMissions: MissionData[] = availableOreIds.slice(0, 3).map((oreId, index) => {
                        const oreData = getItemData(oreId);
                        const quantity = (Math.floor(Math.random() * 5) + 1) * 2000;
                        // FIX: Explicitly type the mission object to ensure its properties
                        // match the MissionData interface, particularly for literal types
                        // like 'type' and 'status'.
                        const mission: MissionData = {
                            id: `${stationId}-${index}-${Date.now()}`,
                            agent: mockAgent,
                            stationId,
                            type: 'mining',
                            title: `Mining Op: ${oreData?.name}`,
                            description: `We have a client who needs a large shipment of ${oreData?.name}. Bring me ${quantity.toLocaleString()} units and I will reward you handsomely.`,
                            objectives: { [oreId]: quantity },
                            rewards: {
                                isk: Math.ceil(quantity * (oreData?.basePrice || 10) * 1.25)
                            },
                            status: 'offered'
                        };
                        return mission;
                    }).filter(m => m.objectives && Object.keys(m.objectives).length > 0);

                    setCachedMissions(mockMissions);
                    if (mockMissions.length > 0) {
                        setSelectedMission(mockMissions[0]);
                    }
                } catch (e) {
                     console.error("Failed to generate mock agent data:", e);
                     setError("Failed to load agent data. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            }, 500);
        };

        generateMockData();

    }, [isOpen, stationId, systemId, stationName, cachedAgent, cachedMissions, setCachedAgent, setCachedMissions, activeMissionForThisAgent]);


    const handleAccept = () => {
        if (!selectedMission) return;
        onAcceptMission(selectedMission);
    };

    const handleComplete = () => {
        if (!activeMissionForThisAgent) return;
        onCompleteMission(activeMissionForThisAgent.id);
        setSelectedMission(cachedMissions?.[0] || null);
    };
    
    if (!isOpen) return null;
    
    const missionToShow = activeMissionForThisAgent || selectedMission;
    
    let canComplete = false;
    if (activeMissionForThisAgent) {
        const hangar = playerState.stationHangars[stationId];
        canComplete = hangar ? hasMaterials(hangar.materials, activeMissionForThisAgent.objectives) : false;
    }
    
    const missionList = activeMissionForThisAgent ? [activeMissionForThisAgent] : (cachedMissions || []);
    
    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex gap-5 allow-touch-scroll">
             <div className="bg-gray-800 border border-gray-600 p-4 w-1/3 flex flex-col">
                <h3 className="text-center text-xl mt-0 mb-4">Missions</h3>
                {isLoading && <p className="text-center text-cyan-400">Contacting agent...</p>}
                {error && <p className="text-center text-red-400">{error}</p>}
                <div className="overflow-y-auto">
                    {missionList.map(mission => (
                        <div
                            key={mission.id}
                            onClick={() => setSelectedMission(mission)}
                            className={`p-2.5 cursor-pointer border-b border-gray-700 ${mission.status === 'accepted' ? 'border-l-4 border-l-green-500' : 'hover:bg-gray-700'} ${missionToShow?.id === mission.id ? 'bg-indigo-800' : ''}`}
                        >
                            <p className="font-bold m-0">{mission.title}</p>
                            <p className="text-sm text-gray-400 m-0">{mission.status === 'accepted' ? 'Status: Active' : 'Status: Available'}</p>
                        </div>
                    ))}
                </div>
             </div>
             <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl mt-0">{cachedAgent?.name || 'Agent'}</h3>
                    <UIButton onClick={onClose}>Back to Station</UIButton>
                </div>
                <div className="overflow-y-auto">
                    {cachedAgent && (
                        <div className="bg-black/20 p-3 rounded mb-4">
                            <p className="text-lg font-semibold">{cachedAgent.corporation}</p>
                            <p className="text-gray-300 italic">{cachedAgent.backstory}</p>
                        </div>
                    )}
                    {missionToShow && (
                        <div>
                            <h4 className="text-2xl mb-2">{missionToShow.title}</h4>
                            <p className="text-gray-300 whitespace-pre-wrap mb-4">{missionToShow.description}</p>
                            <div className="bg-black/20 p-3 rounded mb-4 space-y-2">
                                <div>
                                    <h5 className="text-lg font-semibold text-yellow-400">Objective:</h5>
                                    {Object.entries(missionToShow.objectives).map(([oreId, qty]) => (
                                        <div key={oreId} className="flex items-center gap-2">
                                            <ItemIcon item={getItemData(oreId)} size="small" />
                                            <span className="m-0">{getItemData(oreId)?.name}: {qty.toLocaleString()} units</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h5 className="text-lg font-semibold text-green-400">Reward:</h5>
                                    {missionToShow.rewards.isk && <p className="m-0">{missionToShow.rewards.isk.toLocaleString()} ISK</p>}
                                    {missionToShow.rewards.items?.map((itemReward, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <ItemIcon item={getItemData(itemReward.id)} size="small" />
                                            <span className="m-0">{getItemData(itemReward.id)?.name} x {itemReward.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {missionToShow.status === 'offered' && !activeMissionForThisAgent && (
                                <UIButton onClick={handleAccept} className="w-full !text-lg !py-3">Accept Mission</UIButton>
                            )}
                             {missionToShow.status === 'accepted' && (
                                <UIButton onClick={handleComplete} disabled={!canComplete} className="w-full !text-lg !py-3">Complete Mission</UIButton>
                            )}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};
