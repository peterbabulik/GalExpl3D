// StationModals.tsx
import React, { useState, useEffect, useRef } from 'react';

import type { PlayerState, StorageLocation, Module, Ore, Mineral, AnyItem, Drone, Ammunition, Skill } from './types';
import { 
    SHIP_DATA,
    BLUEPRINT_DATA,
    getItemData,
    SOLAR_SYSTEM_DATA,
} from './constants';
import { SKILL_DATA, addSkillXp } from './skills';
import { ORE_DATA, REFINING_EFFICIENCY, ASTEROID_BELT_TYPES } from './ores';
import { UIButton, ItemIcon, hasMaterials } from './UI';

const MARKET_BUY_PRICE_MODIFIER = 1.1; // Stations sell at 110% base price
const MARKET_SELL_PRICE_MODIFIER = 0.9; // Stations buy at 90% base price

const getSkillBonus = (playerSkills: PlayerState['skills'], effectType: string): number => {
    let totalBonus = 0;
    for (const skillId in playerSkills) {
        const skillDef = SKILL_DATA[skillId];
        const playerSkill = playerSkills[skillId];
        if (skillDef && playerSkill) {
            const effect = skillDef.effects.find(e => e.type === effectType);
            if (effect) {
                totalBonus += effect.value * playerSkill.level;
            }
        }
    }
    return totalBonus;
};

export const HangarModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    onActivateShip: (shipId: string) => void;
    stationId: string | null;
}> = ({ isOpen, onClose, playerState, onActivateShip, stationId }) => {
    if (!isOpen) return null;

    const stationHangar = stationId ? playerState.stationHangars[stationId] : null;
    const ownedShips = stationHangar ? stationHangar.items.filter(id => id.startsWith('ship_')) : [];

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-3xl h-[70vh] bg-gray-900/90 border-2 border-gray-500 z-[210] p-5 box-border flex flex-col allow-touch-scroll">
            <div className="flex justify-between items-center border-b-2 border-gray-500 pb-2.5 mb-2.5 flex-shrink-0">
                <h2 className="text-2xl">Ship Hangar</h2>
                <UIButton onClick={onClose}>Close</UIButton>
            </div>
            <div className="overflow-y-auto">
                {ownedShips.length === 0 && <p className="text-gray-400 text-center py-4">No ships in this hangar.</p>}
                {ownedShips.map(shipId => {
                    const ship = SHIP_DATA[shipId];
                    if (!ship) return null;
                    const isActive = playerState.currentShipId === shipId;
                    return (
                        <div key={shipId} className="flex justify-between items-center p-2.5 border-b border-gray-700 hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <ItemIcon item={ship} />
                                <div>
                                    <strong className="text-lg">{ship.name}</strong>
                                    <span className="text-gray-400 ml-4">({ship.class})</span>
                                </div>
                            </div>
                            <UIButton onClick={() => onActivateShip(shipId)} disabled={isActive}>
                                {isActive ? 'Active' : 'Activate'}
                            </UIButton>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ItemHangarModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    stationId: string;
}> = ({ isOpen, onClose, playerState, setPlayerState, stationId }) => {
    if (!isOpen) return null;

    const stationHangar = playerState.stationHangars[stationId] || { items: [], materials: {} };
    const shipCargo = playerState.shipCargo;

    const handleMoveItem = (itemId: string, from: 'ship' | 'station') => {
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
// FIX: Ensure the station hangar exists in the state before any transfer operations. This prevents errors when interacting with a new, uninitialized station hangar.
            if (!newState.stationHangars[stationId]) {
                newState.stationHangars[stationId] = { items: [], materials: {} };
            }
            
            const sourceHangar = from === 'ship' ? newState.shipCargo : newState.stationHangars[stationId];
            const destHangar = from === 'ship' ? newState.stationHangars[stationId] : newState.shipCargo;

            const itemIndex = sourceHangar.items.indexOf(itemId);
            if (itemIndex > -1) {
                sourceHangar.items.splice(itemIndex, 1);
                destHangar.items.push(itemId);
            }
            return newState;
        });
    };

    const handleMoveMaterialStack = (matId: string, quantity: number, from: 'ship' | 'station') => {
        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            
// FIX: Ensure the station hangar exists in the state before any transfer operations. This prevents errors when interacting with a new, uninitialized station hangar.
            if (!newState.stationHangars[stationId]) {
                newState.stationHangars[stationId] = { items: [], materials: {} };
            }

            const sourceHangar = from === 'ship' ? newState.shipCargo : newState.stationHangars[stationId];
            const destHangar = from === 'ship' ? newState.stationHangars[stationId] : newState.shipCargo;

// FIX: Added check to ensure the source hangar has enough materials to transfer, preventing negative quantities.
            if (sourceHangar.materials[matId] && sourceHangar.materials[matId] >= quantity) {
                sourceHangar.materials[matId] -= quantity;
                if (sourceHangar.materials[matId] <= 0) {
                    delete sourceHangar.materials[matId];
                }
                destHangar.materials[matId] = (destHangar.materials[matId] || 0) + quantity;
            }

            return newState;
        });
    };

    const HangarColumn: React.FC<{ title: string; hangar: StorageLocation; type: 'ship' | 'station' }> = ({ title, hangar, type }) => {
        const transferLabel = type === 'ship' ? 'To Hangar >' : '< To Ship';
        return (
            <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col h-full">
                <h3 className="text-center text-xl mt-0 mb-4">{title}</h3>
                <div className="overflow-y-auto">
                    <h4 className="text-lg border-b border-gray-700 pb-1 mb-2">Items</h4>
                    {hangar.items.length === 0 && <p className="text-gray-500 text-sm pl-2 mb-4">No items.</p>}
                    <ul className="list-none p-0 m-0 mb-4">
                        {hangar.items.map((itemId, index) => {
                            const itemData = getItemData(itemId);
                            const isShip = itemData?.category === 'Ship';
                            return (
                                <li key={`${itemId}-${index}`} className="flex justify-between items-center p-1.5 hover:bg-gray-700">
                                    <div className="flex items-center gap-2">
                                        <ItemIcon item={itemData} />
                                        <span className={isShip ? 'text-cyan-400' : ''}>{itemData?.name || itemId}</span>
                                    </div>
                                    <UIButton onClick={() => handleMoveItem(itemId, type)} className="!px-2 !py-1">{transferLabel}</UIButton>
                                </li>
                            );
                        })}
                    </ul>
                    <h4 className="text-lg border-b border-gray-700 pb-1 mb-2">Materials</h4>
                    {Object.keys(hangar.materials).length === 0 && <p className="text-gray-500 text-sm pl-2">No materials.</p>}
                    <ul className="list-none p-0 m-0">
                         {Object.entries(hangar.materials)
                            .sort(([matA], [matB]) => (getItemData(matA)?.name || matA).localeCompare(getItemData(matB)?.name || matB))
                            .map(([matId, qty]) => (
                             <li key={matId} className="flex justify-between items-center p-1.5 hover:bg-gray-700">
                                <div className="flex items-center gap-2">
                                    <ItemIcon item={getItemData(matId)} />
                                    <span>{getItemData(matId)?.name || matId}</span>
                                </div>
                                 <div className="flex items-center gap-2">
                                     <span>{qty.toLocaleString()}</span>
                                     <UIButton onClick={() => handleMoveMaterialStack(matId, qty, type)} className="!px-2 !py-1">{transferLabel}</UIButton>
                                 </div>
                             </li>
                         ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex flex-col allow-touch-scroll">
            <div className="flex justify-between items-center pb-2.5 mb-5 flex-shrink-0">
                <h2 className="text-2xl">Item Hangar</h2>
                <UIButton onClick={onClose}>Back to Station</UIButton>
            </div>
            <div className="flex gap-5 flex-grow h-[calc(100%-60px)]">
                <HangarColumn title="Ship Cargo" hangar={shipCargo} type="ship" />
                <HangarColumn title="Station Hangar" hangar={stationHangar} type="station" />
            </div>
        </div>
    );
};


export const CraftingInterface: React.FC<{
    onClose: () => void;
    playerState: PlayerState;
    onManufacture: (bpId: string) => void;
    stationId: string | null;
}> = ({ onClose, playerState, onManufacture, stationId }) => {
    const [selectedBpId, setSelectedBpId] = useState<string | null>(null);
    const [craftingMessage, setCraftingMessage] = useState('');

    const stationHangar = stationId ? playerState.stationHangars[stationId] || { items: [], materials: {} } : null;

    const availableBlueprints = stationHangar
        ? [...new Set(stationHangar.items.filter(itemId => itemId.startsWith('bp_')))]
        : [];
    availableBlueprints.sort((a, b) => (BLUEPRINT_DATA[a]?.name || a).localeCompare(BLUEPRINT_DATA[b]?.name || b));

    const handleManufactureClick = (bpId: string) => {
        onManufacture(bpId);
        const bpData = BLUEPRINT_DATA[bpId];
        const itemData = getItemData(bpData.outputItem);
        setCraftingMessage(`Successfully manufactured ${bpData.outputQuantity}x ${itemData?.name || bpData.outputItem}!`);
        setTimeout(() => setCraftingMessage(''), 3000);
        // Refresh the view after crafting
        const currentSelection = selectedBpId;
        if (currentSelection === bpId) {
            setSelectedBpId(null);
            setTimeout(() => setSelectedBpId(currentSelection), 0);
        }
    };

    const selectedBpData = selectedBpId ? BLUEPRINT_DATA[selectedBpId] : null;
    const canManufacture = selectedBpData && stationHangar ? hasMaterials(stationHangar.materials, selectedBpData.materials) : false;
    
    const timeBonus = getSkillBonus(playerState.skills, 'manufacturingTimeBonus');
    const displayTime = selectedBpData ? selectedBpData.manufacturingTime * (1 + timeBonus) : 0;
    const timeFormatted = new Date(displayTime * 1000).toISOString().slice(11, 19);

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex gap-5 allow-touch-scroll">
            <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                <h3 className="text-center text-xl mt-0 mb-4">Blueprints in Hangar</h3>
                <div className="overflow-y-auto">
                    {availableBlueprints.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No blueprints in this hangar.</p>
                    ) : (
                        <ul className="list-none p-0 m-0">
                            {availableBlueprints.map(bpId => (
                                <li
                                    key={bpId}
                                    onClick={() => setSelectedBpId(bpId)}
                                    className={`p-2.5 cursor-pointer border-b border-gray-700 hover:bg-gray-700 ${selectedBpId === bpId ? 'bg-indigo-800' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ItemIcon item={BLUEPRINT_DATA[bpId]} />
                                        <span>{BLUEPRINT_DATA[bpId]?.name || bpId}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="bg-gray-800 border border-gray-600 p-4 flex-[2] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl mt-0">{selectedBpData?.name || 'Select a Blueprint'}</h3>
                    <UIButton onClick={onClose}>Back to Station</UIButton>
                </div>
                {selectedBpData && stationHangar ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg m-0">Required Materials (from Station Hangar):</h4>
                            <span className="text-gray-400">Time: {timeFormatted}</span>
                        </div>
                        <ul className="list-none p-0 mb-4 bg-black/20 rounded">
                            {Object.entries(selectedBpData.materials)
                               .sort(([matA], [matB]) => (getItemData(matA)?.name || matA).localeCompare(getItemData(matB)?.name || matB))
                               .map(([mat, requiredQty]) => {
                                const playerQty = stationHangar.materials[mat] || 0;
                                const hasEnough = playerQty >= requiredQty;
                                const matName = getItemData(mat)?.name || mat;
                                return (
                                    <li key={mat} className="flex justify-between p-1.5 border-b border-gray-700/50 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            <ItemIcon item={getItemData(mat)} />
                                            <span>{matName}</span>
                                        </div>
                                        <span className="flex-grow border-b border-dotted border-gray-600 mx-2"></span>
                                        <span className="font-semibold">
                                            <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>{playerQty.toLocaleString()}</span> / {requiredQty.toLocaleString()}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        <hr className="border-gray-600 my-4" />
                        <UIButton onClick={() => handleManufactureClick(selectedBpData.id)} disabled={!canManufacture} className="w-full !p-4 !text-lg">
                            Manufacture
                        </UIButton>
                        <p className="text-center text-green-400 mt-4 h-6">{craftingMessage}</p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">Select a blueprint from the list to see details.</p>
                )}
                 {selectedBpData && !stationHangar && (
                    <p className="text-red-400">Cannot craft, not docked at a valid station.</p>
                )}
            </div>
        </div>
    );
};

export const FittingInterface: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    stationId: string;
    onLoadDrone: (droneId: string) => void;
    onUnloadDrone: (droneId: string, index: number) => void;
}> = ({ isOpen, onClose, playerState, setPlayerState, stationId, onLoadDrone, onUnloadDrone }) => {
    if (!isOpen) return null;

    const currentShip = SHIP_DATA[playerState.currentShipId];
    const stationHangar = playerState.stationHangars[stationId] || { items: [], materials: {} };
    
    const availableModules = stationHangar.items
        .map(id => getItemData(id))
        .filter((item): item is Module => !!item && item.category === 'Module');

    const availableDrones = stationHangar.items
        .map(id => getItemData(id))
        .filter((item): item is Drone => !!item && item.category === 'Drone');

    const handleFitModule = (moduleId: string, instanceIndex: number) => {
        const moduleData = getItemData(moduleId) as Module;
        if (!moduleData) return;
        const slotType = moduleData.slot;
        
        setPlayerState(p => {
            const fitting = p.currentShipFitting;
            if(!fitting[slotType]) return p;
            const firstEmptyIndex = fitting[slotType].indexOf(null);
            if (firstEmptyIndex === -1) {
                alert(`No empty ${slotType} slots available.`);
                return p;
            }
            const newState = JSON.parse(JSON.stringify(p));
            const newStationHangar = newState.stationHangars[stationId];
            const itemIndexInHangar = newStationHangar.items.findIndex((id: string, idx: number) => id === moduleId && idx === instanceIndex);
            if (itemIndexInHangar > -1) {
                newStationHangar.items.splice(itemIndexInHangar, 1);
            }
            newState.currentShipFitting[slotType][firstEmptyIndex] = moduleId;
            return newState;
        });
    };
    
    const handleUnfitModule = (slotType: 'high' | 'medium' | 'low' | 'rig', slotIndex: number) => {
         setPlayerState(p => {
            const moduleId = p.currentShipFitting[slotType][slotIndex];
            if (!moduleId) return p;
            const newState = JSON.parse(JSON.stringify(p));
            const newStationHangar = newState.stationHangars[stationId];
            newState.currentShipFitting[slotType][slotIndex] = null;
            newStationHangar.items.push(moduleId);
            return newState;
         });
    };

    const SlotGroup: React.FC<{ type: 'high' | 'medium' | 'low'; slots: (string | null)[] }> = ({ type, slots }) => (
        <div>
            <h4 className="text-lg border-b border-gray-700 pb-1 mb-2 capitalize">{type} Slots ({slots.length})</h4>
            <div className="space-y-1">
                {slots.map((moduleId, index) => (
                    <div key={index} className="flex justify-between items-center p-1.5 bg-black/20 rounded h-10">
                        {moduleId ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <ItemIcon item={getItemData(moduleId)} size="small" />
                                    <span className="text-cyan-300">{getItemData(moduleId)?.name}</span>
                                </div>
                                <UIButton onClick={() => handleUnfitModule(type, index)} className="!px-2 !py-1">Unfit</UIButton>
                            </>
                        ) : (
                            <span className="text-gray-500">[ Empty Slot ]</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex gap-5 allow-touch-scroll">
            <div className="bg-gray-800 border border-gray-600 p-4 flex-[2] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl mt-0">{currentShip.name} - Fitting</h3>
                    <UIButton onClick={onClose}>Back to Station</UIButton>
                </div>
                <div className="space-y-4 overflow-y-auto">
                    <SlotGroup type="high" slots={playerState.currentShipFitting.high} />
                    <SlotGroup type="medium" slots={playerState.currentShipFitting.medium} />
                    <SlotGroup type="low" slots={playerState.currentShipFitting.low} />
                     <div>
                        <h4 className="text-lg border-b border-gray-700 pb-1 mb-2 capitalize">Drone Bay ({playerState.droneBayCargo.length} / {currentShip.attributes.droneBay})</h4>
                        <div className="space-y-1">
                            {playerState.droneBayCargo.map((droneId, index) => (
                                <div key={`${droneId}-${index}`} className="flex justify-between items-center p-1.5 bg-black/20 rounded h-10">
                                    <div className="flex items-center gap-2">
                                        <ItemIcon item={getItemData(droneId)} size="small" />
                                        <span className="text-yellow-300">{getItemData(droneId)?.name}</span>
                                    </div>
                                    <UIButton onClick={() => onUnloadDrone(droneId, index)} className="!px-2 !py-1">Unload</UIButton>
                                </div>
                            ))}
                            {playerState.droneBayCargo.length === 0 && <div className="p-1.5 bg-black/20 rounded h-10 flex items-center"><span className="text-gray-500">[ Empty Drone Bay ]</span></div>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                <h3 className="text-center text-xl mt-0 mb-4">Items in Hangar</h3>
                <div className="overflow-y-auto">
                    <h4 className="text-lg border-b border-gray-700 pb-1 mb-2">Modules</h4>
                    <ul className="list-none p-0 m-0 mb-4">
                        {availableModules.length === 0 && <p className="text-gray-500 text-sm pl-2">No modules.</p>}
                        {stationHangar.items.map((itemId, index) => {
                            const itemData = getItemData(itemId);
                            if (itemData?.category !== 'Module') return null;
                            return (
                                <li key={`${itemId}-${index}`} className="flex justify-between items-center p-1.5 hover:bg-gray-700">
                                    <div className="flex items-center gap-2">
                                        <ItemIcon item={itemData} />
                                        <span>{itemData.name} <span className="text-xs text-gray-400">({(itemData as Module).slot})</span></span>
                                    </div>
                                    <UIButton onClick={() => handleFitModule(itemId, index)} className="!px-2 !py-1">Fit</UIButton>
                                </li>
                            );
                        })}
                    </ul>

                    <h4 className="text-lg border-b border-gray-700 pb-1 mb-2">Drones</h4>
                    <ul className="list-none p-0 m-0">
                        {availableDrones.length === 0 && <p className="text-gray-500 text-sm pl-2">No drones.</p>}
                        {stationHangar.items.map((itemId, index) => {
                            const itemData = getItemData(itemId);
                            if (itemData?.category !== 'Drone') return null;
                            return (
                                <li key={`${itemId}-${index}`} className="flex justify-between items-center p-1.5 hover:bg-gray-700">
                                     <div className="flex items-center gap-2">
                                        <ItemIcon item={itemData} />
                                        <span>{itemData.name}</span>
                                    </div>
                                    <UIButton onClick={() => onLoadDrone(itemId)} className="!px-2 !py-1">Load</UIButton>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const ReprocessingInterface: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    stationId: string;
}> = ({ isOpen, onClose, playerState, setPlayerState, stationId }) => {
    const [queue, setQueue] = useState<Record<string, number>>({});
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const stationHangar = playerState.stationHangars[stationId] || { items: [], materials: {} };
    
    // Combine all reprocessable items from the hangar
    const reprocessableItems: Record<string, { item: AnyItem, quantity: number }> = {};
    // Process materials (ores)
    Object.entries(stationHangar.materials).forEach(([id, quantity]) => {
        const item = getItemData(id);
        if (item && item.category === 'Ore') {
            reprocessableItems[id] = { item, quantity };
        }
    });
    // Process items (modules, ammo, drones)
    stationHangar.items.forEach(id => {
        const item = getItemData(id);
        if (item && (item.category === 'Module' || item.category === 'Ammunition' || item.category === 'Drone')) {
            if (reprocessableItems[id]) {
                reprocessableItems[id].quantity++;
            } else {
                reprocessableItems[id] = { item, quantity: 1 };
            }
        }
    });

    const allAvailableItems = Object.values(reprocessableItems)
        .sort((a, b) => a.item.name.localeCompare(b.item.name));

    const availableOres = allAvailableItems.filter(i => i.item.category === 'Ore');
    const availableModules = allAvailableItems.filter(i => i.item.category === 'Module');
    const availableAmmunition = allAvailableItems.filter(i => i.item.category === 'Ammunition');
    const availableDrones = allAvailableItems.filter(i => i.item.category === 'Drone');


    const handleAddToQueue = (itemId: string, quantity: number) => {
        if (quantity <= 0) return;
        const currentQty = queue[itemId] || 0;
        const availableQty = reprocessableItems[itemId]?.quantity || 0;
        const newQty = Math.min(availableQty, currentQty + quantity);
        setQueue(q => ({ ...q, [itemId]: newQty }));
    };

    const handleSetQueueAmount = (itemId: string, amount: string) => {
        const availableQty = reprocessableItems[itemId]?.quantity || 0;
        const quantity = Math.max(0, Math.min(availableQty, parseInt(amount, 10) || 0));
        if (quantity === 0) {
            const newQueue = { ...queue };
            delete newQueue[itemId];
            setQueue(newQueue);
        } else {
            setQueue(q => ({ ...q, [itemId]: quantity }));
        }
    };

    const clearQueue = () => setQueue({});

    const calculateYield = () => {
        const yieldPreview: Record<string, number> = {};
        const reprocessingSkillBonus = getSkillBonus(playerState.skills, 'reprocessingEfficiencyBonus');
        const efficiency = REFINING_EFFICIENCY.base + reprocessingSkillBonus;
        const finalEfficiency = Math.min(efficiency, REFINING_EFFICIENCY.maxEfficiency);

        for (const itemId in queue) {
            const itemData = getItemData(itemId);
            const quantity = queue[itemId];
            if (!itemData || !quantity) continue;

            if (itemData.category === 'Ore') {
                const oreData = itemData as Ore;
                const batches = quantity / 100;
                for (const mineralId in oreData.refineYield) {
                    const baseYieldPerBatch = oreData.refineYield[mineralId];
                    const finalYield = Math.floor(batches * baseYieldPerBatch * finalEfficiency);
                    if (finalYield > 0) {
                        yieldPreview[mineralId] = (yieldPreview[mineralId] || 0) + finalYield;
                    }
                }
            } else if (itemData.category === 'Module' || itemData.category === 'Ammunition' || itemData.category === 'Drone') {
                const itemYieldData = (itemData as (Module | Ammunition | Drone)).reprocessingYield;
                if (!itemYieldData) continue;

                for (const mineralId in itemYieldData) {
                    const baseYieldPerItem = itemYieldData[mineralId];
                    const finalYield = Math.floor(quantity * baseYieldPerItem * finalEfficiency);
                    if (finalYield > 0) {
                        yieldPreview[mineralId] = (yieldPreview[mineralId] || 0) + finalYield;
                    }
                }
            }
        }
        return Object.entries(yieldPreview).sort(([idA], [idB]) => (getItemData(idA)?.name || idA).localeCompare(getItemData(idB)?.name || idB));
    };

    const handleReprocess = () => {
        const finalYield = Object.fromEntries(calculateYield());
        const xpGained = Object.keys(queue).length * 25; // 25 XP per stack type

        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            const hangar = newState.stationHangars[stationId];
            if (!hangar) return p;

            // Consume items from queue
            for (const itemId in queue) {
                const itemData = getItemData(itemId);
                const quantityToRemove = queue[itemId];
                if (!itemData) continue;

                if (itemData.category === 'Ore') {
                    hangar.materials[itemId] -= quantityToRemove;
                    if (hangar.materials[itemId] <= 0) {
                        delete hangar.materials[itemId];
                    }
                } else if (itemData.category === 'Module' || itemData.category === 'Ammunition' || itemData.category === 'Drone') {
                    let removedCount = 0;
                    hangar.items = hangar.items.filter((id: string) => {
                        if (id === itemId && removedCount < quantityToRemove) {
                            removedCount++;
                            return false; // remove this item instance
                        }
                        return true; // keep this item instance
                    });
                }
            }

            // Add minerals
            for (const mineralId in finalYield) {
                hangar.materials[mineralId] = (hangar.materials[mineralId] || 0) + finalYield[mineralId];
            }
            
            // Add skill XP
            if (xpGained > 0) {
                return addSkillXp(newState, 'skill_reprocessing', xpGained);
            }
            
            return newState;
        });

        clearQueue();
        setMessage('Reprocessing complete.');
        setTimeout(() => setMessage(''), 3000);
    };

    const yieldPreview = calculateYield();
    const reprocessingSkillBonus = getSkillBonus(playerState.skills, 'reprocessingEfficiencyBonus');
    const currentEfficiency = Math.min(REFINING_EFFICIENCY.base + reprocessingSkillBonus, REFINING_EFFICIENCY.maxEfficiency);


    const ReprocessableList: React.FC<{ title: string; items: { item: AnyItem, quantity: number }[] }> = ({ title, items }) => {
        if (items.length === 0) return null;
        return (
            <>
                <h4 className="text-lg border-b border-gray-700 pb-1 mb-2 mt-4">{title}</h4>
                <ul className="list-none p-0 m-0">
                    {items.map(({ item, quantity }) => {
                        const inQueueQty = queue[item.id] || 0;
                        const remainingQty = quantity - inQueueQty;
                        return (
                            <li key={item.id} className="flex justify-between items-center p-2 border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <ItemIcon item={item} />
                                    <div>
                                        <span className="font-semibold">{item.name}</span>
                                        <br />
                                        <span className="text-sm text-gray-400">Available: {remainingQty.toLocaleString()}</span>
                                    </div>
                                </div>
                                <UIButton onClick={() => handleAddToQueue(item.id, remainingQty)} disabled={remainingQty <= 0}>Add All</UIButton>
                            </li>
                        );
                    })}
                </ul>
            </>
        );
    };


    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex gap-5 allow-touch-scroll">
            {/* Left Panel: Available Items */}
            <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                <h3 className="text-center text-xl mt-0 mb-4">Reprocessable Items</h3>
                <div className="overflow-y-auto">
                    {allAvailableItems.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No reprocessable items in hangar.</p>}
                    <ReprocessableList title="Ores" items={availableOres} />
                    <ReprocessableList title="Modules" items={availableModules} />
                    <ReprocessableList title="Ammunition" items={availableAmmunition} />
                    <ReprocessableList title="Drones" items={availableDrones} />
                </div>
            </div>

            {/* Right Panel: Reprocessing Job */}
            <div className="bg-gray-800 border border-gray-600 p-4 flex-[2] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl mt-0">Reprocessing Job ({(currentEfficiency * 100).toFixed(1)}% Yield)</h3>
                    <UIButton onClick={onClose}>Back to Station</UIButton>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <h4 className="text-lg">Input Items</h4>
                    {Object.keys(queue).length === 0 ? (
                        <p className="text-gray-500 text-sm pl-2 mb-4">Add items from your hangar to reprocess.</p>
                    ) : (
                        <ul className="list-none p-0 m-0 mb-4 bg-black/20 rounded">
                            {Object.entries(queue).map(([itemId, quantity]) => {
                                const itemData = getItemData(itemId);
                                return (
                                    <li key={itemId} className="flex justify-between items-center p-2 border-b border-gray-700/50 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            <ItemIcon item={itemData} />
                                            <span>{itemData?.name || itemId}</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => handleSetQueueAmount(itemId, e.target.value)}
                                            className="bg-gray-900 text-white text-right w-28 p-1 border border-gray-600"
                                            max={reprocessableItems[itemId]?.quantity || 0}
                                            min="0"
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <hr className="border-gray-600 my-4" />

                    <h4 className="text-lg">Output Minerals</h4>
                    {yieldPreview.length === 0 ? (
                         <p className="text-gray-500 text-sm pl-2 mb-4">No minerals will be produced.</p>
                    ) : (
                        <ul className="list-none p-0 m-0 mb-4 bg-black/20 rounded">
                            {yieldPreview.map(([mineralId, quantity]) => {
                                const mineralData = getItemData(mineralId) as Mineral;
                                return (
                                    <li key={mineralId} className="flex justify-between items-center p-2 border-b border-gray-700/50 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            <ItemIcon item={mineralData} />
                                            <span>{mineralData.name}</span>
                                        </div>
                                        <span className="font-semibold">{quantity.toLocaleString()}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex-shrink-0 pt-4 border-t border-gray-600">
                    <div className="flex justify-between items-center">
                        <UIButton onClick={clearQueue} disabled={Object.keys(queue).length === 0}>Clear</UIButton>
                        <p className="text-center text-green-400 h-6 flex-grow">{message}</p>
                        <UIButton onClick={handleReprocess} disabled={Object.keys(queue).length === 0} className="!px-8 !py-3">Reprocess</UIButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MarketInterface: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    stationId: string;
    systemId: number;
}> = ({ isOpen, onClose, playerState, setPlayerState, stationId, systemId }) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [buyCategory, setBuyCategory] = useState<'blueprints' | 'ores'>('blueprints');
    const [quantities, setQuantities] = useState<Record<string, string>>({} as Record<string, string>);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const stationHangar = playerState.stationHangars[stationId] || { items: [], materials: {} };

    const getMarketOres = (systemId: number): Ore[] => {
        const systemData = SOLAR_SYSTEM_DATA[systemId];
        if (!systemData?.asteroidBeltType) return [];
        
        const beltData = ASTEROID_BELT_TYPES[systemData.asteroidBeltType];
        if (!beltData) return [];
        
        const oreIds = Object.keys(beltData.oreDistribution);
        return oreIds.map(id => ORE_DATA[id]).filter((o): o is Ore => !!o);
    };

    const handleQuantityChange = (itemId: string, value: string) => {
        setQuantities(q => ({ ...q, [itemId]: value }));
    };

    const showMessage = (text: string) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 3000);
    }

    const handleBuy = (item: AnyItem) => {
        const quantity = parseInt(quantities[item.id] || '0', 10);
        if (isNaN(quantity) || quantity <= 0) return;
        
        const price = (item.basePrice || 0) * MARKET_BUY_PRICE_MODIFIER;
        const totalCost = price * quantity;

        if (playerState.isk < totalCost) {
            showMessage("Not enough ISK.");
            return;
        }

        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            newState.isk -= totalCost;
            
            const hangar = newState.stationHangars[stationId] || { items: [], materials: {} };
            
            if (item.category === 'Blueprint' || item.category === 'Module' || item.category === 'Ship') {
                for (let i = 0; i < quantity; i++) {
                    hangar.items.push(item.id);
                }
            } else {
                hangar.materials[item.id] = (hangar.materials[item.id] || 0) + quantity;
            }

            newState.stationHangars[stationId] = hangar;
            return newState;
        });

        handleQuantityChange(item.id, '');
        showMessage(`Purchased ${quantity.toLocaleString()}x ${item.name}.`);
    };

    const handleSell = (item: AnyItem) => {
        const quantity = parseInt(quantities[item.id] || '0', 10);
        if (isNaN(quantity) || quantity <= 0) return;

        const availableQty = stationHangar.materials[item.id] || 0;
        if (availableQty < quantity) {
            showMessage("Not enough items to sell.");
            return;
        }

        const price = (item.basePrice || 0) * MARKET_SELL_PRICE_MODIFIER;
        const totalProfit = price * quantity;

        setPlayerState(p => {
            const newState = JSON.parse(JSON.stringify(p));
            newState.isk += totalProfit;
            
            const hangar = newState.stationHangars[stationId];
            hangar.materials[item.id] -= quantity;
            if (hangar.materials[item.id] <= 0) {
                delete hangar.materials[item.id];
            }

            return newState;
        });

        handleQuantityChange(item.id, '');
        showMessage(`Sold ${quantity.toLocaleString()}x ${item.name}.`);
    };

    const buyItems = (buyCategory === 'blueprints' ? Object.values(BLUEPRINT_DATA) : getMarketOres(systemId))
        .sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    
    const sellableItems = Object.entries(stationHangar.materials)
        .map(([id, qty]) => ({ item: getItemData(id), qty }))
        .filter(({ item }) => item?.category === 'Ore')
        .sort((a, b) => a.item!.name.localeCompare(b.item!.name));

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex flex-col allow-touch-scroll">
            <div className="flex justify-between items-center pb-2.5 mb-5 flex-shrink-0">
                <h2 className="text-2xl">Market</h2>
                <UIButton onClick={onClose}>Back to Station</UIButton>
            </div>
            
            <div className="flex gap-2 mb-4">
                <UIButton onClick={() => setActiveTab('buy')} className={activeTab === 'buy' ? '!bg-indigo-700' : ''}>Buy Orders</UIButton>
                <UIButton onClick={() => setActiveTab('sell')} className={activeTab === 'sell' ? '!bg-indigo-700' : ''}>Sell Items</UIButton>
                <p className="flex-grow text-right text-green-400 h-6 text-lg">{message}</p>
            </div>

            {activeTab === 'buy' && (
                <div className="flex gap-5 flex-grow min-h-0">
                    <div className="bg-gray-800 border border-gray-600 p-4 w-64 flex flex-col flex-shrink-0">
                        <h3 className="text-center text-xl mt-0 mb-4">Categories</h3>
                        <ul className="list-none p-0 m-0">
                             <li onClick={() => setBuyCategory('blueprints')} className={`p-2 cursor-pointer ${buyCategory === 'blueprints' ? 'bg-indigo-800' : 'hover:bg-gray-700'}`}>Blueprints</li>
                             <li onClick={() => setBuyCategory('ores')} className={`p-2 cursor-pointer ${buyCategory === 'ores' ? 'bg-indigo-800' : 'hover:bg-gray-700'}`}>Ores</li>
                        </ul>
                    </div>
                    <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                        <div className="overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-gray-800">
                                    <tr><th className="p-2">Item</th><th className="p-2">Price (ISK)</th><th className="p-2 w-32">Quantity</th><th className="p-2 w-24">Action</th></tr>
                                </thead>
                                <tbody>
                                    {buyItems.map(item => {
                                        const price = (item.basePrice || 0) * MARKET_BUY_PRICE_MODIFIER;
                                        return (
                                            <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <ItemIcon item={item} />
                                                        <span>{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">{price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td className="p-2"><input type="number" value={quantities[item.id] || ''} onChange={e => handleQuantityChange(item.id, e.target.value)} className="w-full bg-gray-900 text-white p-1 border border-gray-600" min="1" /></td>
                                                <td className="p-2"><UIButton onClick={() => handleBuy(item)} className="w-full">Buy</UIButton></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'sell' && (
                 <div className="bg-gray-800 border border-gray-600 p-4 flex-1 flex flex-col">
                    <div className="overflow-y-auto">
                         <table className="w-full text-left">
                                <thead className="sticky top-0 bg-gray-800">
                                    <tr><th className="p-2">Item</th><th className="p-2">In Hangar</th><th className="p-2">Sell Price (ISK)</th><th className="p-2 w-32">Quantity</th><th className="p-2 w-24">Action</th></tr>
                                </thead>
                                <tbody>
                                    {sellableItems.map(({ item, qty }) => {
                                        if (!item) return null;
                                        const price = (item.basePrice || 0) * MARKET_SELL_PRICE_MODIFIER;
                                        return (
                                            <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <ItemIcon item={item} />
                                                        <span>{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">{qty.toLocaleString()}</td>
                                                <td className="p-2">{price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td className="p-2"><input type="number" value={quantities[item.id] || ''} onChange={e => handleQuantityChange(item.id, e.target.value)} className="w-full bg-gray-900 text-white p-1 border border-gray-600" min="1" max={qty}/></td>
                                                <td className="p-2"><UIButton onClick={() => handleSell(item)} className="w-full">Sell</UIButton></td>
                                            </tr>
                                        )
                                    })}
                                     {sellableItems.length === 0 && (
                                        <tr><td colSpan={5} className="p-4 text-center text-gray-500">No sellable ores in your station hangar.</td></tr>
                                    )}
                                </tbody>
                            </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export const StationHelpOverlay: React.FC<{onClose: () => void}> = ({onClose}) => {
    // Approximate vertical center of the button list, adjusted for the title above it.
    const listCenterY = '55%';
    // Vertical distance between the center of each button.
    const buttonStep = 3.25; // in rem
    // Calculates the vertical center of a button based on its index (1-based).
    const buttonCenterY = (index: number) => `calc(${listCenterY} + ${(index - 4.5) * buttonStep}rem)`;

    return (
        <div className="absolute inset-0 z-[201]" onClick={onClose}>
            <div className="relative w-full h-full pointer-events-none text-lg font-semibold">
                {/* RIGHT SIDE (BLUE) - Explains how to get resources */}
                <div className="absolute text-blue-400 text-left" style={{ top: `calc(${buttonCenterY(1)} - 0.7rem)`, left: 'calc(50% + 18rem)' }}>
                    Mine Asteroids
                </div>
                <div className="absolute h-px w-[9rem] bg-blue-400" style={{ top: buttonCenterY(1), left: 'calc(50% + 9rem)' }}></div>
                <div className="absolute w-px h-[19.5rem] bg-blue-400" style={{ top: buttonCenterY(1), left: 'calc(50% + 9rem)' }}></div>

                <div className="absolute text-blue-400 text-left" style={{ top: `calc(${buttonCenterY(3)} - 0.7rem)`, left: 'calc(50% + 18rem)' }}>
                    Move Asteroids from<br/>Ship to Station
                </div>
                <div className="absolute h-px w-[9rem] bg-blue-400" style={{ top: buttonCenterY(3), left: 'calc(50% + 9rem)' }}></div>

                <div className="absolute text-blue-400 text-left leading-tight" style={{ top: `calc(${buttonCenterY(7)} - 0.5rem)`, left: 'calc(50% + 18rem)' }}>
                    Sell Asteroids for ISK<br/>Buy Blueprints
                </div>
                <div className="absolute h-px w-[9rem] bg-blue-400" style={{ top: buttonCenterY(7), left: 'calc(50% + 9rem)' }}></div>

                {/* LEFT SIDE (RED) - Explains what to do with resources */}
                <div className="absolute text-red-400 text-right" style={{ top: `calc(${buttonCenterY(4)} - 0.7rem)`, right: 'calc(50% + 18rem)' }}>
                    Fitt to Ship
                </div>
                <div className="absolute h-px w-[9rem] bg-red-400" style={{ top: buttonCenterY(4), right: 'calc(50% + 9rem)' }}></div>
                <div className="absolute w-px h-[9.75rem] bg-red-400" style={{ top: buttonCenterY(4), right: 'calc(50% + 9rem)' }}></div>

                <div className="absolute text-red-400 text-right" style={{ top: `calc(${buttonCenterY(5)} - 0.7rem)`, right: 'calc(50% + 18rem)' }}>
                    Craft
                </div>
                <div className="absolute h-px w-[9rem] bg-red-400" style={{ top: buttonCenterY(5), right: 'calc(50% + 9rem)' }}></div>

                <div className="absolute text-red-400 text-right" style={{ top: `calc(${buttonCenterY(6)} - 0.7rem)`, right: 'calc(50% + 18rem)' }}>
                    Reprocess
                </div>
                <div className="absolute h-px w-[9rem] bg-red-400" style={{ top: buttonCenterY(6), right: 'calc(50% + 9rem)' }}></div>
            </div>
        </div>
    );
};


export const StationInterface: React.FC<{
    stationName: string;
    onUndock: () => void;
    onOpenCrafting: () => void;
    onOpenShipHangar: () => void;
    onOpenItemHangar: () => void;
    onOpenFitting: () => void;
    onOpenReprocessing: () => void;
    onOpenMarket: () => void;
    onOpenAgent: () => void;
    onOpenSkills: () => void;
    showHelp: boolean;
    onToggleHelp: () => void;
    onSetHomeStation: () => void;
    isHomeStation: boolean;
}> = ({ stationName, onUndock, onOpenCrafting, onOpenShipHangar, onOpenItemHangar, onOpenFitting, onOpenReprocessing, onOpenMarket, onOpenAgent, onOpenSkills, showHelp, onToggleHelp, onSetHomeStation, isHomeStation }) => {
    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[200] p-12 box-border flex flex-col items-center justify-center">
            {showHelp && <StationHelpOverlay onClose={onToggleHelp} />}
             <div className="absolute top-5 right-5 z-[202]">
                <button 
                    onClick={onToggleHelp} 
                    className="w-10 h-10 bg-gray-700/80 rounded-full border border-gray-400 text-white text-2xl font-bold flex items-center justify-center hover:bg-gray-600/90"
                    aria-label="Toggle Help"
                >
                    ?
                </button>
            </div>
            <h2 className="text-4xl mb-10 text-center">Docked at {stationName}</h2>
            <div className="flex flex-col items-center gap-4">
                <UIButton onClick={onUndock} className="w-64 !text-base">Back to Space (Undock)</UIButton>
                <UIButton onClick={onOpenShipHangar} className="w-64 !text-base">Ship Hangar</UIButton>
                <UIButton onClick={onOpenItemHangar} className="w-64 !text-base">Item Hangar</UIButton>
                <UIButton onClick={onOpenFitting} className="w-64 !text-base">Fitting</UIButton>
                <UIButton onClick={onOpenCrafting} className="w-64 !text-base">Crafting</UIButton>
                <UIButton onClick={onOpenReprocessing} className="w-64 !text-base">Reprocessing</UIButton>
                <UIButton onClick={onOpenMarket} className="w-64 !text-base">Market</UIButton>
                <UIButton onClick={onOpenAgent} className="w-64 !text-base">Agent Missions</UIButton>
                <UIButton onClick={onOpenSkills} className="w-64 !text-base">Skills</UIButton>
                <UIButton onClick={onSetHomeStation} disabled={isHomeStation} className="w-64 !text-base">
                    {isHomeStation ? 'Current Home Station' : 'Set as Home Station'}
                </UIButton>
            </div>
        </div>
    );
};