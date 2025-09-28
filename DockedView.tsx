import React, { useState, useEffect } from 'react';
import type { PlayerState, AgentData, MissionData, Drone, NpcMinerInfo, StorageLocation, StationMarketData, CorporationData, NpcTraderData, AnyItem, DeployedShip, Ship } from './types';
import { 
    SHIP_DATA,
    BLUEPRINT_DATA,
    getItemData,
    DOCKED_BACKGROUND_IMAGES,
    SOLAR_SYSTEM_DATA,
    GALAXY_DATA,
} from './constants';
import {
    HangarModal,
    ItemHangarModal,
    CraftingInterface,
    FittingInterface,
    ReprocessingInterface,
    MarketInterface,
    StationInterface,
    BusinessMap,
} from './StationModals';
import { AgentInterface } from './GeminiAgent';
import { SkillsUI } from './SkillsUI';
import { addSkillXp } from './skills';
import { TestingGrounds } from './TestingGrounds';
import { UIButton, ItemIcon } from './UI';

// --- Modals for NPC Command Center ---

const AuthorizeShipModal: React.FC<{
    corp: CorporationData;
    onAuthorize: (corpId: string, shipId: string) => void;
    onClose: () => void;
}> = ({ corp, onAuthorize, onClose }) => {
    const shipsToFund = [
        { id: 'ship_venture', name: 'Venture (Miner)' },
        { id: 'ship_rifter', name: 'Rifter (Small Combat)' },
        { id: 'ship_stabber', name: 'Stabber (Medium Combat)' },
        { id: 'ship_hurricane', name: 'Hurricane (Large Combat)' },
    ];

    const getRequiredMaterials = (shipId: string) => {
        const blueprintId = `bp_${shipId.replace('ship_', '')}`;
        const blueprint = BLUEPRINT_DATA[blueprintId];
        return blueprint ? blueprint.materials : {};
    };

    return (
         <div className="fixed inset-0 bg-black/80 z-[220] flex items-center justify-center" onClick={onClose}>
            <div className="bg-gray-900 border-2 border-gray-500 p-6 rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl text-center mb-4">Authorize Ship Construction for {corp.name}</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Authorizing construction will check the corporation's hangar for existing materials and place buy orders on the market for any missing resources. The orders will be fulfilled by their Supply Trader NPC.</p>
                <div className="space-y-3">
                    {shipsToFund.map(shipInfo => {
                        const materials = getRequiredMaterials(shipInfo.id);
                        return (
                            <div key={shipInfo.id} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3">
                                        <ItemIcon item={getItemData(shipInfo.id)} />
                                        <span className="text-lg">{shipInfo.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 pl-10">
                                        Materials: {Object.entries(materials).map(([id, qty]) => `${getItemData(id)?.name} x${qty}`).join(', ')}
                                    </div>
                                </div>
                                <UIButton onClick={() => onAuthorize(corp.id, shipInfo.id)} className="!text-sm !py-2 !px-4 ml-4">Authorize</UIButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const AssignConquestModal: React.FC<{
    corp: CorporationData;
    allCorporations: Record<string, CorporationData>;
    onAssign: (corpId: string, systemId: number) => void;
    onClose: () => void;
}> = ({ corp, allCorporations, onAssign, onClose }) => {
    const allClaimedSystems = Object.values(allCorporations).map(c => c.claimedSystemId).filter(id => id !== null);
    const unclaimedSystems = GALAXY_DATA.systems.filter(s => s.security <= 0.0 && !allClaimedSystems.includes(s.id));

    return (
        <div className="fixed inset-0 bg-black/80 z-[220] flex items-center justify-center" onClick={onClose}>
            <div className="bg-gray-900 border-2 border-gray-500 p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl text-center mb-4">Assign Conquest Target for {corp.name}</h3>
                 <p className="text-sm text-gray-400 text-center mb-6">Select an unclaimed 0.0 security system for the corporation to conquer. They will deploy their available combat fleet to claim it.</p>
                 <div className="max-h-80 overflow-y-auto bg-black/30 p-2 rounded">
                    {unclaimedSystems.length > 0 ? (
                        unclaimedSystems.map(system => (
                            <div key={system.id} className="flex justify-between items-center p-2 hover:bg-gray-700/50 rounded">
                                <span>{system.name}</span>
                                <UIButton onClick={() => onAssign(corp.id, system.id)} className="!text-xs !py-1 !px-2">Assign Target</UIButton>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 p-4">No unclaimed null-sec systems available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- NPC Command Interface Component ---
const NpcCommandInterface: React.FC<{
    minerData: Record<string, NpcMinerInfo>;
    corporationData: Record<string, CorporationData>;
    traderData: Record<string, NpcTraderData>;
    onUndock: () => void;
    onOpenBusinessMap: () => void;
    playerState: PlayerState;
    onAuthorizeCorpShipConstruction: (corpId: string, shipId: string) => void;
    onAssignCorpConquest: (corpId: string, systemId: number) => void;
}> = ({ minerData, corporationData, traderData, onUndock, onOpenBusinessMap, playerState, onAuthorizeCorpShipConstruction, onAssignCorpConquest }) => {
    const [activeTab, setActiveTab] = useState<'miners' | 'corps'>('miners');
    const [authorizeShipModalCorpId, setAuthorizeShipModalCorpId] = useState<string | null>(null);
    const [assignConquestModalCorpId, setAssignConquestModalCorpId] = useState<string | null>(null);
    
    const miners = Object.values(minerData).sort((a, b) => a.name.localeCompare(b.name));
    const corporations = Object.values(corporationData).sort((a,b) => a.name.localeCompare(b.name));

    const formatCargo = (cargo: StorageLocation) => {
        const items = Object.entries(cargo.materials);
        if (items.length === 0) {
            return <span className="text-gray-500">Empty</span>;
        }
        return items.map(([id, qty]) => {
            const item = getItemData(id);
            return (
                <div key={id} className="flex items-center gap-1" title={`${item?.name}: ${qty.toLocaleString()}`}>
                    <ItemIcon item={item} size="small" />
                    <span className="text-xs">{qty.toLocaleString()}</span>
                </div>
            );
        });
    };
    
    const getStateColor = (state: string) => {
        switch(state) {
            case 'MINING':
            case 'SELLING':
            case 'BUYING': return 'text-green-400';
            case 'TRAVELING_TO_BELT':
            case 'RETURNING_TO_STATION':
            case 'TRAVELING_TO_BUY':
            case 'TRAVELING_TO_SELL': return 'text-cyan-400';
            case 'DOCKING':
            case 'ANALYZING_MARKET':
            case 'UNDOCKING': return 'text-yellow-400';
            case 'IDLE': return 'text-gray-500';
            default: return 'text-white';
        }
    };

    const MinersView = () => (
        <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-800">
                <tr>
                    <th className="p-2">System</th>
                    <th className="p-2">Agent Name</th>
                    <th className="p-2">Ship</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Target</th>
                    <th className="p-2">Cargo</th>
                </tr>
            </thead>
            <tbody>
                {miners.map(miner => (
                    <tr key={miner.uuid} className="border-b border-gray-700 hover:bg-gray-700/20">
                        <td className="p-2">{GALAXY_DATA.systems.find(s => s.id === miner.systemId)?.name || 'Unknown'}</td>
                        <td className="p-2">{miner.name}</td>
                        <td className="p-2">{miner.shipName}</td>
                        <td className={`p-2 font-semibold ${getStateColor(miner.state)}`}>{miner.state.replace(/_/g, ' ')}</td>
                        <td className="p-2 text-gray-400">{miner.miningTargetName || '---'}</td>
                        <td className="p-2">
                            <div className="flex gap-2 items-center">
                                {formatCargo(miner.cargo)}
                            </div>
                        </td>
                    </tr>
                ))}
                {miners.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 p-8">No active NPC miners detected.</td></tr>}
            </tbody>
        </table>
    );

    const CorporationsView = () => {
        const getSystemNameById = (id: number | null) => id ? (GALAXY_DATA.systems.find(s => s.id === id)?.name || 'Unknown') : 'None';
        const getStationNameById = (id: string) => {
            const parts = id.split('_');
            if (parts.length < 3) return 'Unknown Station';
            const systemId = parseInt(parts[1], 10);
            const systemName = getSystemNameById(systemId);
            return `${systemName} - ${parts.slice(2).join(' ')}`;
        }
    
        return (
            <div className="space-y-4">
                {corporations.map(corp => {
                    const corpTraders = Object.values(traderData).filter(t => t.corporationId === corp.id);
                    const corpShipsInHangar = corp.assetHangar.items.filter(id => id.startsWith('ship_')).reduce((acc, id) => {
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    
                    const hasCombatShipInHangar = corp.assetHangar.items.some(id => {
                        const item = getItemData(id) as Ship;
                        return item?.category === 'Ship' && !item.class.toLowerCase().includes('mining') && !item.class.toLowerCase().includes('industrial');
                    });
    
                    return (
                        <div key={corp.id} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="border-b border-gray-600 pb-2 mb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-cyan-300 m-0">{corp.name}</h4>
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>HQ: {getStationNameById(corp.homeStationId)}</span>
                                            <span className="ml-4">Claimed System: <span className="font-semibold text-white">{getSystemNameById(corp.claimedSystemId)}</span></span>
                                        </div>
                                    </div>
                                    <p className="text-lg font-mono text-yellow-400 m-0 text-right flex-shrink-0">Treasury: {corp.isk.toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK</p>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <UIButton onClick={() => setAuthorizeShipModalCorpId(corp.id)} className="!text-xs !py-1">Authorize Construction</UIButton>
                                    <UIButton onClick={() => setAssignConquestModalCorpId(corp.id)} disabled={!hasCombatShipInHangar} className="!text-xs !py-1">Assign Conquest Target</UIButton>
                                </div>
                            </div>

                            {corp.playerAssignedGoal && (
                                <div className="bg-green-900/40 border border-green-500 rounded p-2 mb-3 text-sm">
                                    <p className="font-bold text-green-300 m-0">
                                        Player Directive: <span className="text-white">Conquer {getSystemNameById(corp.playerAssignedGoal.targetId)}</span>
                                    </p>
                                </div>
                            )}

                            {corp.strategicGoal && corp.strategicGoal.action !== 'idle' && (
                                <div className="bg-purple-900/40 border border-purple-500 rounded p-2 mb-3 text-sm">
                                    <p className="font-bold text-purple-300 m-0">
                                        Strategic Directive: <span className="text-white">
                                            {corp.strategicGoal.action === 'build_ship' 
                                                ? `Build a ${getItemData(corp.strategicGoal.targetId)?.name}`
                                                : `Conquer ${getSystemNameById(parseInt(corp.strategicGoal.targetId, 10))}`
                                            }
                                        </span>
                                    </p>
                                    <p className="text-purple-400 italic m-0">CEO Reasoning: "{corp.strategicGoal.reasoning}"</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <h5 className="text-base font-semibold mb-1">Build Queue</h5>
                                    <div className="space-y-1 max-h-24 overflow-y-auto mb-2">
                                        {corp.buildQueue && corp.buildQueue.length > 0 ? (
                                            corp.buildQueue.map((shipId, index) => (
                                                <div key={`${shipId}-${index}`} className="flex items-center justify-between text-xs">
                                                    <span>{getItemData(shipId)?.name}</span>
                                                    <span className="text-cyan-300">#{index + 1}</span>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-gray-500">No ships in queue.</p>}
                                    </div>
                                    <h5 className="text-base font-semibold mb-1">Active Buy Orders</h5>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {corp.buyOrders && Object.keys(corp.buyOrders).length > 0 ? (
                                            Object.entries(corp.buyOrders).map(([matId, qty]) => (
                                                <div key={matId} className="flex items-center justify-between text-xs">
                                                    <span>{getItemData(matId)?.name}</span>
                                                    <span className="text-yellow-300">Need: {qty.toLocaleString()}</span>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-gray-500">No active buy orders.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-base font-semibold mb-1">Deployed Fleet ({corp.shipsInSpace.length})</h5>
                                    {corp.shipsInSpace.length > 0 ? (
                                        <ul className="list-none p-0 m-0 max-h-40 overflow-y-auto">
                                            {corp.shipsInSpace.map((ship, index) => (
                                                <li key={index} className="text-xs border-b border-gray-700 py-1">
                                                    <div className="flex justify-between">
                                                        <span>{getItemData(ship.shipId)?.name}</span>
                                                        <span className={`font-semibold ${ship.state === 'mining' ? 'text-green-400' : 'text-cyan-400'}`}>{ship.state}</span>
                                                    </div>
                                                    <div className="text-gray-400">{getSystemNameById(ship.systemId)}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-xs text-gray-500">No ships deployed.</p>}
                                </div>
    
                                <div>
                                    <h5 className="text-base font-semibold mb-1">Traders ({corpTraders.length})</h5>
                                    {corpTraders.length > 0 ? (
                                         <ul className="list-none p-0 m-0 max-h-40 overflow-y-auto">
                                            {corpTraders.map(trader => (
                                                <li key={trader.uuid} className="text-xs border-b border-gray-700 py-1">
                                                    <div className="flex justify-between"><span>{trader.name}</span> <span className={`font-semibold ${getStateColor(trader.state)}`}>{trader.state.replace(/_/g, ' ')}</span></div>
                                                    <div className="text-gray-400">{GALAXY_DATA.systems.find(s => s.id === trader.currentSystemId)?.name}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-xs text-gray-500">No active traders.</p>}
                                </div>
    
                                <div>
                                    <h5 className="text-base font-semibold mb-1">Hangar Assets</h5>
                                    <div className="space-y-1">
                                        {Object.keys(corpShipsInHangar).length > 0 ? (
                                            Object.entries(corpShipsInHangar).map(([shipId, qty]) => (
                                                <div key={shipId} className="flex items-center justify-between text-xs">
                                                    <span>{getItemData(shipId)?.name}</span>
                                                    <span>x{qty}</span>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-gray-500">No ships in hangar.</p>}
                                    </div>
                                    <h6 className="text-sm font-semibold mt-2 mb-1 text-gray-400">Materials</h6>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                      {Object.keys(corp.assetHangar.materials).length > 0 ? (
                                        Object.entries(corp.assetHangar.materials)
                                          .sort(([matA], [matB]) => (getItemData(matA)?.name || matA).localeCompare(getItemData(matB)?.name || matB))
                                          .map(([matId, qty]) => (
                                            <div key={matId} className="flex items-center justify-between text-xs">
                                                <span>{getItemData(matId)?.name}</span>
                                                <span>x{qty.toLocaleString()}</span>
                                            </div>
                                        ))
                                      ) : <p className="text-xs text-gray-500">No materials.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                 {authorizeShipModalCorpId && (
                    <AuthorizeShipModal
                        corp={corporationData[authorizeShipModalCorpId]}
                        onAuthorize={onAuthorizeCorpShipConstruction}
                        onClose={() => setAuthorizeShipModalCorpId(null)}
                    />
                )}
                {assignConquestModalCorpId && (
                     <AssignConquestModal
                        corp={corporationData[assignConquestModalCorpId]}
                        allCorporations={corporationData}
                        onAssign={(corpId, systemId) => {
                            onAssignCorpConquest(corpId, systemId);
                            setAssignConquestModalCorpId(null);
                        }}
                        onClose={() => setAssignConquestModalCorpId(null)}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex flex-col allow-touch-scroll">
            <div className="flex justify-between items-center pb-2.5 mb-5 flex-shrink-0">
                <h2 className="text-2xl">NPC Command Center</h2>
                <div>
                    <UIButton onClick={onOpenBusinessMap} className="mr-4">Business Map</UIButton>
                    <UIButton onClick={onUndock}>Undock</UIButton>
                </div>
            </div>
             <div className="flex-shrink-0 flex mb-4 border-b-2 border-gray-600">
                <button 
                    onClick={() => setActiveTab('miners')} 
                    className={`flex-1 py-2 text-lg font-bold ${activeTab === 'miners' ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Miners
                </button>
                <button 
                    onClick={() => setActiveTab('corps')} 
                    className={`flex-1 py-2 text-lg font-bold ${activeTab === 'corps' ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Corporations
                </button>
            </div>
            <div className="flex-grow overflow-y-auto bg-black/30 p-2 rounded">
                {activeTab === 'miners' ? <MinersView /> : <CorporationsView />}
            </div>
        </div>
    );
};


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
    globalNpcMinerData: Record<string, NpcMinerInfo>;
    stationMarketData: StationMarketData;
    setStationMarketData: React.Dispatch<React.SetStateAction<StationMarketData>>;
    globalCorporationData: Record<string, CorporationData>;
    globalNpcTraderData: Record<string, NpcTraderData>;
    onAuthorizeCorpShipConstruction: (corpId: string, shipId: string) => void;
    onAssignCorpConquest: (corpId: string, systemId: number) => void;
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
    globalNpcMinerData,
    stationMarketData,
    setStationMarketData,
    globalCorporationData,
    globalNpcTraderData,
    onAuthorizeCorpShipConstruction,
    onAssignCorpConquest,
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
    const [isBusinessMapOpen, setBusinessMapOpen] = useState(false);

    // Gemini-related state (cached data)
    const [agents, setAgents] = useState<Record<string, AgentData>>({});
    const [stationMissions, setStationMissions] = useState<Record<string, MissionData[]>>({});
    
    const systemData = SOLAR_SYSTEM_DATA[systemId];
    const stationData = systemData?.station;
    const isTestingStation = stationData?.name === stationName && stationData.type === 'testing';
    const isNpcCommandStation = stationData?.name === stationName && stationData.type === 'npc_command';

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
    
            // Check completion criteria based on mission type
            if (mission.type === 'mining') {
                const stationHangar = p.stationHangars[mission.stationId];
                if (!stationHangar) {
                    console.error("Station hangar not found for mission turn-in.");
                    return p;
                }
    
                for (const oreId in mission.objectives) {
                    const required = mission.objectives[oreId];
                    if ((stationHangar.materials[oreId] || 0) < required) {
                        console.error("Not enough materials to complete mission.");
                        return p; // Failsafe, button should be disabled
                    }
                }
            } else if (mission.type === 'combat') {
                const objectiveKey = Object.keys(mission.objectives)[0];
                const required = mission.objectives[objectiveKey];
                const current = mission.progress?.[objectiveKey] || 0;
                if (current < required) {
                    console.error("Combat mission objectives not met.");
                    return p; // Failsafe, button should be disabled
                }
            } else {
                 console.error(`Unknown mission type for completion: ${mission.type}`);
                 return p;
            }
            
            const newState = JSON.parse(JSON.stringify(p));
            const rewardHangar = newState.stationHangars[mission.stationId];
            
            // Consume mission items if it's a mining mission
            if (mission.type === 'mining') {
                for (const oreId in mission.objectives) {
                    rewardHangar.materials[oreId] -= mission.objectives[oreId];
                    if (rewardHangar.materials[oreId] <= 0) {
                        delete rewardHangar.materials[oreId];
                    }
                }
            }
            // For combat missions, no items are consumed from hangar.
    
            // Grant rewards
            if (mission.rewards.isk) {
                newState.isk += mission.rewards.isk;
            }
            if (mission.rewards.items) {
                mission.rewards.items.forEach(itemReward => {
                    const itemData = getItemData(itemReward.id);
                    if (itemData?.category === 'Ore' || itemData?.category === 'Mineral') {
                        rewardHangar.materials[itemReward.id] = (rewardHangar.materials[itemReward.id] || 0) + itemReward.quantity;
                    } else {
                        for(let i=0; i < itemReward.quantity; i++) {
                            rewardHangar.items.push(itemReward.id);
                        }
                    }
                });
            }
    
            // Remove the completed mission from the active list
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
            ) : isNpcCommandStation ? (
                <NpcCommandInterface
                    minerData={globalNpcMinerData}
                    corporationData={globalCorporationData}
                    traderData={globalNpcTraderData}
                    onUndock={onUndock}
                    onOpenBusinessMap={() => setBusinessMapOpen(true)}
                    playerState={playerState}
                    onAuthorizeCorpShipConstruction={onAuthorizeCorpShipConstruction}
                    onAssignCorpConquest={onAssignCorpConquest}
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
                            stationMarketData={stationMarketData}
                            setStationMarketData={setStationMarketData}
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

            {isBusinessMapOpen && (
                <BusinessMap
                    stationMarketData={stationMarketData}
                    onClose={() => setBusinessMapOpen(false)}
                />
            )}
        </>
    );
};