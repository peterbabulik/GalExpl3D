// GeminiAgent.tsx
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

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
            // Data is already cached, do nothing.
             if (activeMissionForThisAgent) {
                setSelectedMission(activeMissionForThisAgent);
             } else if (cachedMissions.length > 0) {
                setSelectedMission(cachedMissions[0]);
             }
            return;
        }

        const generateData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                
                const system = GALAXY_DATA.systems.find(s => s.id === systemId);
                const systemData = SOLAR_SYSTEM_DATA[systemId];
                if (!system || !systemData) throw new Error("System data not found.");

                const beltData = ASTEROID_BELT_TYPES[systemData.asteroidBeltType || 'sparse'];
                const availableOres = Object.keys(beltData.oreDistribution).map(id => getItemData(id)?.name).filter(Boolean);
                const availableBps = ['bp_rifter', 'bp_venture', 'bp_miner_i', 'bp_shield_extender'];

                // 1. Generate Agent
                const agentSchema = {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        corporation: { type: Type.STRING },
                        backstory: { type: Type.STRING },
                    }
                };
                const agentPrompt = `Generate a unique mission agent for a space station. The station is in the "${system.name}" system, which has a security level of ${system.security.toFixed(1)}. Provide the agent's full name, their corporation's name, and a short, engaging backstory (2-3 sentences).`;
                const agentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: agentPrompt,
                    config: { responseMimeType: 'application/json', responseSchema: agentSchema }
                });
                const agentData = JSON.parse(agentResponse.text) as Omit<AgentData, 'id'>;
                const newAgent: AgentData = { ...agentData, id: stationId };
                setCachedAgent(newAgent);

                // 2. Generate Missions
                const missionSchema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                             title: { type: Type.STRING },
                             description: { type: Type.STRING },
                             objectiveOre: { type: Type.STRING },
                             objectiveQuantity: { type: Type.NUMBER },
                             reward: {
                                 type: Type.OBJECT,
                                 properties: {
                                     isk: { type: Type.NUMBER, nullable: true },
                                     itemId: { type: Type.STRING, nullable: true },
                                     itemQuantity: { type: Type.NUMBER, nullable: true },
                                 }
                             }
                        }
                    }
                };
                const missionsPrompt = `Based on the agent "${newAgent.name}" of "${newAgent.corporation}" and system information, generate 3 unique mining missions. Agent's personality: ${newAgent.backstory}. System: "${system.name}" (Security: ${system.security.toFixed(1)}). Available ore names in this system are: ${availableOres.join(', ')}. Missions should have a title, a short description from the agent's perspective, a single mining objective (use one of the available ore names and a quantity between 2,000 and 25,000), and a reward. Rewards can be ISK, a blueprint, or a specific item. The reward value should be proportional to the quantity and rarity of the ore required. Available blueprints for rewards are: ${availableBps.join(', ')}. For an item reward, use the blueprint ID as the itemId.`;
                const missionsResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: missionsPrompt,
                    config: { responseMimeType: 'application/json', responseSchema: missionSchema }
                });
                const missionData = JSON.parse(missionsResponse.text);

                const newMissions: MissionData[] = missionData.map((m: any, index: number) => {
                    const oreId = Object.keys(ORE_DATA).find(key => ORE_DATA[key].name === m.objectiveOre);
                    return {
                        id: `${stationId}-${index}-${Date.now()}`,
                        agent: newAgent,
                        stationId,
                        title: m.title,
                        description: m.description,
                        objectives: oreId ? { [oreId]: m.objectiveQuantity } : {},
                        rewards: {
                            isk: m.reward?.isk,
                            items: m.reward?.itemId ? [{ id: m.reward.itemId, quantity: m.reward.itemQuantity || 1 }] : undefined
                        },
                        status: 'offered'
                    };
                }).filter((m: MissionData) => Object.keys(m.objectives).length > 0);

                setCachedMissions(newMissions);
                 if (newMissions.length > 0) {
                    setSelectedMission(newMissions[0]);
                }

            } catch (e) {
                console.error("Gemini API call failed:", e);
                setError("Failed to contact the agent. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        generateData();
    }, [isOpen, stationId, systemId, cachedAgent, cachedMissions, setCachedAgent, setCachedMissions, activeMissionForThisAgent]);

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