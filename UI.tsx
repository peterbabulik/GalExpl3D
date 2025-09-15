// UI.tsx

// FIX: Import 'useCallback' from 'react' to fix 'Cannot find name' errors.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

import type { PlayerState, TooltipData, Target, TargetData, DockingData, NavPanelItem, StorageLocation, Module, Ore, Mineral, AnyItem, AgentData, MissionData, Drone, Ammunition } from './types';
import { 
    SHIP_DATA,
    BLUEPRINT_DATA,
    getItemData,
    SOLAR_SYSTEM_DATA,
    GALAXY_DATA,
} from './constants';
import { ORE_DATA, REFINING_EFFICIENCY, ASTEROID_BELT_TYPES } from './ores';

// --- CONSTANTS ---
const MINING_RANGE = 1500;
const WARP_MIN_DISTANCE = 1000;
const MARKET_BUY_PRICE_MODIFIER = 1.1; // Stations sell at 110% base price
const MARKET_SELL_PRICE_MODIFIER = 0.9; // Stations buy at 90% base price
const LOOT_RANGE = 2500;

// --- UTILITY FUNCTIONS ---
const hasMaterials = (playerMaterials: Record<string, number>, required: Record<string, number>) => {
    for (const mat in required) {
        if ((playerMaterials[mat] || 0) < required[mat]) {
            return false;
        }
    }
    return true;
};


// --- UI HELPER COMPONENTS ---

const ItemIcon: React.FC<{ item: AnyItem | undefined, size?: 'small' | 'normal' }> = ({ item, size = 'normal' }) => {
    const [imageError, setImageError] = useState(false);
    const sizeClass = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';

    useEffect(() => {
        // Reset error state if the item changes
        setImageError(false);
    }, [item?.id]);

    if (!item) {
        return <div className={`${sizeClass} flex-shrink-0 bg-black/50 rounded-md`}></div>;
    }
    
    const imagePath = `assets/pic/${item.name}.png`;

    if (imageError) {
        // Fallback to emoji if image fails to load
        let defaultIcon = '📦';
        if (item.category === 'Ship') defaultIcon = '🛸';
        else if (item.category === 'Blueprint') defaultIcon = '📜';
        else if (item.category === 'Module') defaultIcon = '🔧';
        else if (item.category === 'Ore' || item.category === 'Mineral') defaultIcon = '💎';
        else if (item.category === 'Drone') defaultIcon = '🤖';
        else if (item.category === 'Ammunition') defaultIcon = '💥';
        const textSizeClass = size === 'small' ? 'text-base' : 'text-xl';
        
        return (
            <div className={`${sizeClass} flex-shrink-0 flex items-center justify-center bg-black/50 rounded-md`} title={`${item.name} (image not found)`}>
                <span className={textSizeClass}>{defaultIcon}</span>
            </div>
        );
    }

    return (
        <div className={`${sizeClass} flex-shrink-0 bg-black/50 rounded-md flex items-center justify-center overflow-hidden`} title={item.name}>
            <img src={imagePath} alt={item.name} className="w-full h-full object-contain" onError={() => setImageError(true)} />
        </div>
    );
};


export const SystemInfoUI: React.FC<{
    systemName: string;
    playerState: PlayerState;
    onNavClick: () => void;
    isDocked: boolean;
}> = ({ systemName, playerState, onNavClick, isDocked }) => {
    return (
        <div className="absolute top-2.5 left-2.5 z-10 bg-black/50 p-2 rounded">
            <h1 className="text-2xl m-0">{systemName}</h1>
            <p className="text-lg text-yellow-400 m-0">{playerState.isk.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} ISK</p>
            {!isDocked && <UIButton onClick={onNavClick} className="mt-2">Navigation</UIButton>}
        </div>
    );
};


export const MiningProgressIndicator: React.FC<{
    progress: number;
    screenX: number;
    screenY: number;
    remainingTime: number;
}> = ({ progress, screenX, screenY, remainingTime }) => {
    const size = 80; // size of the indicator in pixels
    return (
        <div
            className="absolute flex items-center justify-center pointer-events-none z-20"
            style={{
                left: screenX - size / 2,
                top: screenY - size / 2,
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            <div
                className="absolute w-full h-full rounded-full"
                style={{
                    background: `conic-gradient(
                        rgba(34,197,94,0.7) ${progress}%,
                        transparent ${progress}%
                    )`,
                }}
            />
            <div className="absolute w-[calc(100%-8px)] h-[calc(100%-8px)] bg-black/70 rounded-full" />
            <span className="relative text-white font-mono text-lg z-10">
                {remainingTime.toFixed(1)}s
            </span>
        </div>
    );
};

export const UIButton: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`py-2 px-3 text-sm bg-gray-800/70 border border-gray-400 text-white font-mono cursor-pointer hover:bg-gray-700/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

export const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
    if (!data.visible) return null;
    return (
        <div
            className="absolute bg-black/75 border border-gray-500 px-2.5 py-1.5 rounded-sm text-sm pointer-events-none z-[100]"
            style={{ left: data.x + 15, top: data.y }}
            dangerouslySetInnerHTML={{ __html: data.content }}
        />
    );
};

export const TargetingReticle: React.FC<{ data: TargetData }> = ({ data }) => {
    if (!data.object) return null;
    return (
        <div
            className="absolute w-24 h-24 border border-white/50 pointer-events-none"
            style={{
                left: data.screenX - 48,
                top: data.screenY - 48,
                background: `
                    linear-gradient(to right, white 2px, transparent 2px) 0 0,
                    linear-gradient(to right, white 2px, transparent 2px) 0 100%,
                    linear-gradient(to left, white 2px, transparent 2px) 100% 0,
                    linear-gradient(to left, white 2px, transparent 2px) 100% 100%,
                    linear-gradient(to bottom, white 2px, transparent 2px) 0 0,
                    linear-gradient(to bottom, white 2px, transparent 2px) 100% 0,
                    linear-gradient(to top, white 2px, transparent 2px) 0 100%,
                    linear-gradient(to top, white 2px, transparent 2px) 100% 100%`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '15px 15px',
            }}
        />
    );
};

export const DockingIndicator: React.FC<{ data: DockingData }> = ({ data }) => {
    if (!data.visible) return null;
    return (
        <div className="absolute bottom-20 w-full text-center text-lg text-green-400 text-shadow-lg z-10 pointer-events-none">
            <p>Distance: {data.distance.toFixed(0)}m</p>
            <p>[ Press ENTER to Dock ]</p>
        </div>
    );
};

export const VirtualJoystick: React.FC<{ onMove: (vector: { x: number; y: number }) => void }> = ({ onMove }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const draggingState = useRef({
        isDragging: false,
        touchId: null as number | null,
        joystickCenter: { x: 0, y: 0 },
    });

    const updateThumb = useCallback((touch: Touch | React.Touch) => {
        if (!baseRef.current || !thumbRef.current) return;
        const { joystickCenter } = draggingState.current;

        const baseRadius = baseRef.current.offsetWidth / 2;
        let x = touch.clientX - joystickCenter.x;
        let y = touch.clientY - joystickCenter.y;
        
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance > baseRadius) {
            x = (x / distance) * baseRadius;
            y = (y / distance) * baseRadius;
        }
        
        thumbRef.current.style.transform = `translate(${x}px, ${y}px)`;
        
        onMove({
            x: x / baseRadius,
            y: y / baseRadius,
        });
    }, [onMove]);

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!baseRef.current) return;
        e.stopPropagation();
        const touch = e.changedTouches[0];
        
        const baseRect = baseRef.current.getBoundingClientRect();
        draggingState.current = {
            isDragging: true,
            touchId: touch.identifier,
            joystickCenter: {
                x: baseRect.left + baseRect.width / 2,
                y: baseRect.top + baseRect.height / 2,
            }
        };
        updateThumb(touch);
    }, [updateThumb]);

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            const { isDragging, touchId } = draggingState.current;
            if (!isDragging) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
            if (touch) {
                updateThumb(touch);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const { isDragging, touchId } = draggingState.current;
            if (!isDragging) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
            if (touch) {
                draggingState.current.isDragging = false;
                draggingState.current.touchId = null;
                if (thumbRef.current) {
                    thumbRef.current.style.transform = `translate(0px, 0px)`;
                }
                onMove({ x: 0, y: 0 });
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
        
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [onMove, updateThumb]);

    return (
        <div 
            ref={baseRef}
            onTouchStart={handleTouchStart}
            className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full flex items-center justify-center z-50"
            aria-hidden="true"
        >
            <div 
                ref={thumbRef}
                className="w-16 h-16 bg-white/30 rounded-full pointer-events-none transition-transform duration-75 ease-out"
            />
        </div>
    );
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

    const handleManufacture = (bpId: string) => {
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
                        <h4 className="text-lg">Required Materials (from Station Hangar):</h4>
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
                        <UIButton onClick={() => handleManufacture(selectedBpData.id)} disabled={!canManufacture} className="w-full !p-4 !text-lg">
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
        const efficiency = REFINING_EFFICIENCY.base; // 50% base efficiency

        for (const itemId in queue) {
            const itemData = getItemData(itemId);
            const quantity = queue[itemId];
            if (!itemData || !quantity) continue;

            if (itemData.category === 'Ore') {
                const oreData = itemData as Ore;
                const batches = quantity / 100;
                for (const mineralId in oreData.refineYield) {
                    const baseYieldPerBatch = oreData.refineYield[mineralId];
                    const finalYield = Math.floor(batches * baseYieldPerBatch * efficiency);
                    if (finalYield > 0) {
                        yieldPreview[mineralId] = (yieldPreview[mineralId] || 0) + finalYield;
                    }
                }
            } else if (itemData.category === 'Module' || itemData.category === 'Ammunition' || itemData.category === 'Drone') {
                const itemYieldData = (itemData as (Module | Ammunition | Drone)).reprocessingYield;
                if (!itemYieldData) continue;

                for (const mineralId in itemYieldData) {
                    const baseYieldPerItem = itemYieldData[mineralId];
                    const finalYield = Math.floor(quantity * baseYieldPerItem * efficiency);
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
            return newState;
        });

        clearQueue();
        setMessage('Reprocessing complete.');
        setTimeout(() => setMessage(''), 3000);
    };

    const yieldPreview = calculateYield();

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
                    <h3 className="text-xl mt-0">Reprocessing Job (50% Base Yield)</h3>
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
    showHelp: boolean;
    onToggleHelp: () => void;
    onSetHomeStation: () => void;
    isHomeStation: boolean;
}> = ({ stationName, onUndock, onOpenCrafting, onOpenShipHangar, onOpenItemHangar, onOpenFitting, onOpenReprocessing, onOpenMarket, onOpenAgent, showHelp, onToggleHelp, onSetHomeStation, isHomeStation }) => {
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
                <UIButton onClick={onSetHomeStation} disabled={isHomeStation} className="w-64 !text-base">
                    {isHomeStation ? 'Current Home Station' : 'Set as Home Station'}
                </UIButton>
                <UIButton onClick={onOpenAgent} className="w-64 !text-base">Agent Missions</UIButton>
            </div>
        </div>
    );
};

export const NavPanel: React.FC<{ 
    data: NavPanelItem[];
    selectedTargetId: string | null;
    onSelectTarget: (uuid: string) => void;
}> = ({ data, selectedTargetId, onSelectTarget }) => {
    const celestials = data.filter(item => item.type !== 'asteroid' && item.type !== 'pirate' && item.type !== 'wreck');
    const npcs = data.filter(item => item.type === 'pirate');
    const asteroids = data.filter(item => item.type === 'asteroid');
    const wrecks = data.filter(item => item.type === 'wreck');

    const typeOrder = { 'star': 0, 'planet': 1, 'station': 2 };
    celestials.sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99));

    const planetMap = new Map<string, NavPanelItem[]>();
    const topLevelCelestials: NavPanelItem[] = [];

    celestials.forEach(item => {
        if (item.type === 'station' && item.parentUUID) {
            if (!planetMap.has(item.parentUUID)) {
                planetMap.set(item.parentUUID, []);
            }
            planetMap.get(item.parentUUID)!.push(item);
        } else {
            topLevelCelestials.push(item);
        }
    });
    
    const renderItem = (item: NavPanelItem, indent: boolean = false, colorClass: string = '') => (
        <li key={item.uuid} className={`text-sm cursor-pointer ${indent ? 'pl-4' : ''} ${item.uuid === selectedTargetId ? 'bg-indigo-700/80' : 'hover:bg-gray-700/80'}`} onClick={() => onSelectTarget(item.uuid)}>
            <div className="flex justify-between py-0.5 px-1">
                <span className={`whitespace-nowrap overflow-hidden text-ellipsis pr-2 ${colorClass}`}>{item.name}</span>
                <span>{item.distanceStr}</span>
            </div>
        </li>
    );

    return (
        <div className="absolute top-2.5 right-2.5 w-72 max-h-[80vh] bg-gray-900/80 border border-gray-600 p-2.5 box-border z-5 flex flex-col allow-touch-scroll">
            <h3 className="mt-0 text-center flex-shrink-0 text-lg">System Overview</h3>
            <div className="overflow-y-auto">
                <h4 className="mt-2.5 mb-1.5 border-b border-gray-600 pb-1.5 text-base">Celestial Bodies</h4>
                <ul className="list-none p-0 m-0">
                    {topLevelCelestials.map(item => (
                        <React.Fragment key={item.uuid}>
                           {renderItem(item)}
                           {item.type === 'planet' && planetMap.has(item.uuid) && (
                                <ul className="list-none p-0 m-0">
                                    {planetMap.get(item.uuid)!.map(station => renderItem(station, true))}
                                </ul>
                            )}
                        </React.Fragment>
                    ))}
                </ul>
                {npcs.length > 0 && (
                    <>
                        <h4 className="mt-2.5 mb-1.5 border-b border-gray-600 pb-1.5 text-base">NPCs</h4>
                        <ul className="list-none p-0 m-0">
                            {npcs.map(item => renderItem(item, false, 'text-red-400'))}
                        </ul>
                    </>
                )}
                 {wrecks.length > 0 && (
                    <>
                        <h4 className="mt-2.5 mb-1.5 border-b border-gray-600 pb-1.5 text-base">Wrecks</h4>
                        <ul className="list-none p-0 m-0">
                            {wrecks.map(item => renderItem(item, false, 'text-gray-400'))}
                        </ul>
                    </>
                )}
                {asteroids.length > 0 && (
                    <>
                        <h4 className="mt-2.5 mb-1.5 border-b border-gray-600 pb-1.5 text-base">Asteroids</h4>
                        <ul className="list-none p-0 m-0">
                            {asteroids.slice(0, 15).map(item => renderItem(item))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

const HPBar: React.FC<{ current: number, max: number, color: string, label: string }> = ({ current, max, color, label }) => (
    <div className="w-full h-2 bg-black/50 relative my-0.5" title={`${label}: ${current}/${max}`}>
        <div className={`h-full ${color}`} style={{ width: `${(current / max) * 100}%` }}></div>
    </div>
);

export const ShipStatsUI: React.FC<{ playerState: PlayerState, shipHP: PlayerState['shipHP'] }> = ({ playerState, shipHP }) => {
    const currentShip = SHIP_DATA[playerState.currentShipId];
    if (!currentShip) return null;

    const minerModuleIds = playerState.currentShipFitting.high.filter((id): id is string => !!id && id.includes('miner'));
    const baseModuleYield = minerModuleIds.reduce((total, modId) => {
        const moduleData = getItemData(modId) as Module;
        return total + (moduleData?.attributes?.miningYield || 0);
    }, 0);

    let yieldMultiplier = 1.0;
    currentShip.bonuses.forEach(bonus => {
        if (bonus.type === 'miningYield' && bonus.flat) {
            yieldMultiplier += bonus.value / 100;
        }
    });
    const totalMiningYield = baseModuleYield * yieldMultiplier;

    const cycleTime = (() => {
        if (minerModuleIds.length > 0) {
            const firstMiner = getItemData(minerModuleIds[0]) as Module;
            return firstMiner?.attributes?.cycleTime || 60;
        }
        return 60;
    })();
    const miningYieldPerMinute = totalMiningYield > 0 ? (totalMiningYield * (60 / cycleTime)) : 0;
    
    const totalCapacity = currentShip.attributes.cargoCapacity + (currentShip.attributes.oreHold || 0);
    let currentVolume = 0;
    for (const matId in playerState.shipCargo.materials) {
        const itemData = getItemData(matId);
        if (itemData?.volume) {
            currentVolume += playerState.shipCargo.materials[matId] * itemData.volume;
        }
    }
    for (const itemId of playerState.shipCargo.items) {
        const itemData = getItemData(itemId);
        if (itemData?.volume) {
            currentVolume += itemData.volume;
        }
    }
    const cargoPercentage = totalCapacity > 0 ? (currentVolume / totalCapacity) * 100 : 0;
    
    return (
        <div className="w-72 bg-gray-900/80 border border-gray-600 p-2.5 box-border flex flex-col allow-touch-scroll">
            <h3 className="mt-0 text-center flex-shrink-0 text-lg">Ship Stats</h3>
            <div className="overflow-y-auto text-sm space-y-1">
                <HPBar current={shipHP.shield} max={shipHP.maxShield} color="bg-cyan-500" label="Shield" />
                <HPBar current={shipHP.armor} max={shipHP.maxArmor} color="bg-gray-400" label="Armor" />
                <HPBar current={shipHP.hull} max={shipHP.maxHull} color="bg-yellow-500" label="Hull" />
                
                <div className="border-t border-gray-700 mt-2 pt-1">
                    <div className="flex justify-between py-0.5 px-1">
                        <span>Cargo Hold</span>
                        <span>{currentVolume.toFixed(1)} / {totalCapacity.toLocaleString()} m³</span>
                    </div>
                    <div className="px-1 py-0.5">
                        <div className="w-full bg-gray-700 h-2.5 rounded-sm">
                            <div 
                                className="bg-cyan-500 h-2.5 rounded-sm" 
                                style={{ width: `${cargoPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                     <div className="flex justify-between py-0.5 px-1 border-t border-gray-700 mt-1 pt-1">
                        <span>Mining Yield</span>
                        <span>{miningYieldPerMinute.toLocaleString(undefined, {maximumFractionDigits: 0})} / min</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SelectedTargetUI: React.FC<{
    target: Target | null;
    miningState: { targetId: string, progress: number } | null;
    isAutoMining: boolean;
    onWarp: () => void;
    onMine: () => void;
    onAutoMine: () => void;
    onStopMine: () => void;
    onLookAt: () => void;
    onDeselect: () => void;
    onAttack: () => void;
    setTooltip: (content: string, event: React.MouseEvent) => void;
    clearTooltip: () => void;
    isDockable: boolean;
    onDock: () => void;
    onLootWreck: () => void;
}> = ({ target, miningState, isAutoMining, onWarp, onMine, onAutoMine, onStopMine, onLookAt, onDeselect, onAttack, setTooltip, clearTooltip, isDockable, onDock, onLootWreck }) => {
    if (!target) return null;

    const isActivelyMining = miningState !== null || isAutoMining;
    const canMine = target.type === 'asteroid' && target.distance <= MINING_RANGE;
    const canWarp = target.distance > WARP_MIN_DISTANCE;
    const canAttack = target.type === 'pirate';
    const canLoot = target.type === 'wreck' && target.distance <= LOOT_RANGE;

    const iconStyle = "w-8 h-8 p-1";

    return (
        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 w-72 bg-gray-900/80 border border-gray-600 p-3 box-border z-5 flex flex-col gap-2">
            <div className="text-center">
                <h3 className={`mt-0 mb-1 text-lg ${target.type === 'pirate' ? 'text-red-400' : ''} ${target.type === 'wreck' ? 'text-gray-400' : ''}`}>{target.name}</h3>
                <p className="m-0 text-gray-400">{(target.distance / 1000).toFixed(1)} km</p>
                {target.type === 'asteroid' && target.oreQuantity !== undefined && (
                    <p className="m-0 text-sm text-gray-500">Ore: {target.oreQuantity.toLocaleString()}</p>
                )}
                {target.type === 'pirate' && target.shipName && (
                    <p className="m-0 text-sm text-red-400">Ship: {target.shipName}</p>
                )}
                {target.type === 'pirate' && target.hp && (
                     <div className="space-y-0.5 mt-2">
                        <HPBar current={target.hp.shield} max={target.hp.maxShield} color="bg-cyan-500" label="Shield" />
                        <HPBar current={target.hp.armor} max={target.hp.maxArmor} color="bg-gray-400" label="Armor" />
                        <HPBar current={target.hp.hull} max={target.hp.maxHull} color="bg-yellow-500" label="Hull" />
                    </div>
                )}
            </div>
            
            <div className="flex justify-center items-center gap-3 my-2">
                <button onClick={onLookAt} className="bg-gray-700/80 rounded-full border border-gray-400 text-white hover:bg-gray-600/90" onMouseEnter={(e) => setTooltip('Look At', e)} onMouseLeave={clearTooltip} aria-label="Look At Target">
                    <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                </button>
                <button onClick={onWarp} disabled={!canWarp} className="bg-gray-700/80 rounded-full border border-gray-400 text-white hover:bg-gray-600/90 disabled:bg-gray-800/50 disabled:text-gray-500" onMouseEnter={(e) => setTooltip('Warp To', e)} onMouseLeave={clearTooltip} aria-label="Warp to Target">
                    <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5H11l5 7-5 7h4.5l5-7z"></path><path d="M8.5 5H4l5 7-5 7h4.5l5-7z"></path></svg>
                </button>
                {target.type === 'pirate' && (
                     <button onClick={onAttack} disabled={!canAttack} className="bg-red-800/80 rounded-full border border-red-400 text-white hover:bg-red-700/90 disabled:bg-gray-800/50 disabled:text-gray-500" onMouseEnter={(e) => setTooltip('Fight', e)} onMouseLeave={clearTooltip} aria-label="Fight Target">
                         <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L12 8"></path><path d="M12 16L12 22"></path><path d="M17 7L17 17"></path><path d="M7 7L7 17"></path><path d="M22 12L16 12"></path><path d="M8 12L2 12"></path>
                        </svg>
                    </button>
                )}
                {target.type === 'station' && (
                    <button onClick={onDock} disabled={!isDockable} className="bg-gray-700/80 rounded-lg border border-gray-400 text-white hover:bg-gray-600/90 disabled:bg-gray-800/50 disabled:text-gray-500" onMouseEnter={(e) => setTooltip('Dock at Station', e)} onMouseLeave={clearTooltip} aria-label="Dock at Station">
                        <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L12 8"></path><path d="M8 5L12 1L16 5"></path><path d="M3 10C3 7.23858 5.23858 5 8 5H16C18.7614 5 21 7.23858 21 10V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V10Z"></path></svg>
                    </button>
                )}
                {target.type === 'asteroid' && (
                    <>
                        {isActivelyMining ? (
                            <div className="relative">
                                <button onClick={onStopMine} className="relative bg-red-800/80 rounded-full border border-red-400 text-white hover:bg-red-700/90 overflow-hidden" onMouseEnter={(e) => setTooltip(isAutoMining ? 'Stop Auto-Mining' : 'Stop Mining', e)} onMouseLeave={clearTooltip} aria-label="Stop Mining">
                                    <svg className={`${iconStyle} relative z-10`} viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                                    {miningState && <div className="absolute top-0 left-0 w-full h-full rounded-full z-0" style={{ background: `conic-gradient(rgba(34,197,94,0.6) ${miningState.progress}%, transparent ${miningState.progress}%)` }} />}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={onMine} disabled={!canMine} className="bg-gray-700/80 rounded-full border border-gray-400 text-white hover:bg-gray-600/90 disabled:bg-gray-800/50 disabled:text-gray-500" onMouseEnter={(e) => setTooltip('Mine (Single Cycle)', e)} onMouseLeave={clearTooltip} aria-label="Mine Asteroid">
                                    <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor"><path d="M11 20.66V3.33L11.53 3.14C13.43 2.5 15 3.87 15 5.76V11H13V5.76C13 5.21 12.63 4.9 12.11 5.05L11 5.33V20.66L10.88 20.95C9 21.57 7.5 20.2 7.5 18.24V13H9.5V18.24C9.5 18.79 9.87 19.1 10.39 18.95L11 18.66V20.66Z" /></svg>
                                </button>
                                <button onClick={onAutoMine} disabled={!canMine} className="bg-gray-700/80 rounded-full border border-gray-400 text-white hover:bg-gray-600/90 disabled:bg-gray-800/50 disabled:text-gray-500" onMouseEnter={(e) => setTooltip('Mine Repetitively', e)} onMouseLeave={clearTooltip} aria-label="Mine Repetitively">
                                    <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
            {target.type === 'wreck' && (
                <UIButton onClick={onLootWreck} disabled={!canLoot} className="w-full mt-1">
                    Load to Cargo
                </UIButton>
            )}
            <UIButton onClick={onDeselect} className="w-full mt-1 !py-1 !text-sm">
                Deselect
            </UIButton>
        </div>
    );
};

export const ModuleBarUI: React.FC<{
    playerState: PlayerState;
    onSlotClick: (slotType: 'high' | 'medium' | 'low', slotIndex: number) => void;
    activeModuleSlots: string[];
    deactivatedWeaponSlots: string[];
    onToggleModuleGroup: (slotType: 'medium' | 'low') => void;
    setTooltip: (content: string, event: React.MouseEvent) => void;
    clearTooltip: () => void;
    hasDroneBay: boolean;
    droneStatus: 'docked' | 'idle' | 'attacking' | 'returning' | 'mining';
    activeDrones: number;
    totalDrones: number;
    onToggleDrones: () => void;
    onDroneAttack: () => void;
    isAttackButtonDisabled: boolean;
    onDroneMine: () => void;
    isMineButtonDisabled: boolean;
    selectedTargetType: 'pirate' | 'asteroid' | 'station' | 'planet' | 'star' | 'wreck' | null;
}> = ({ playerState, onSlotClick, activeModuleSlots, deactivatedWeaponSlots, onToggleModuleGroup, setTooltip, clearTooltip, hasDroneBay, droneStatus, activeDrones, totalDrones, onToggleDrones, onDroneAttack, isAttackButtonDisabled, onDroneMine, isMineButtonDisabled, selectedTargetType }) => {
    const { high, medium, low } = playerState.currentShipFitting;

    const getModuleIcon = (module: Module | undefined): string => {
        if (!module) return '';
        const sub = module.subcategory;
        if (sub.includes('miner')) return 'M';
        if (sub.includes('projectile') || sub.includes('hybrid') || sub.includes('energy')) return 'W';
        if (sub.includes('missile')) return 'L';
        if (sub.includes('shield_booster') || sub.includes('shield_extender')) return 'S';
        if (sub.includes('armor_repairer') || sub.includes('plates')) return 'A';
        if (sub.includes('afterburner') || sub.includes('microwarpdrive')) return 'P';
        return 'G'; // General/Generic
    };

    const renderSlot = (moduleId: string | null, slotType: 'high' | 'medium' | 'low', slotIndex: number) => {
        const slotKey = `${slotType}-${slotIndex}`;
        const module = moduleId ? getItemData(moduleId) as Module : null;
        const isActive = activeModuleSlots.includes(slotKey);

        const isWeapon = module?.slot === 'high' && ['projectile', 'hybrid', 'energy', 'missile'].includes(module.subcategory);
        const isDeactivated = isWeapon && deactivatedWeaponSlots.includes(slotKey);

        const baseStyle = "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all";
        const emptyStyle = "bg-gray-800 border-gray-600 text-gray-700";
        const filledStyle = "bg-gray-700 border-gray-400 text-white cursor-pointer hover:bg-gray-600";
        const activeStyle = isActive ? "!border-green-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" : "";
        const deactivatedStyle = isDeactivated ? "opacity-40 !bg-red-900/50" : "";


        return (
            <div
                key={slotKey}
                className={`${baseStyle} ${module ? filledStyle : emptyStyle} ${activeStyle} ${deactivatedStyle}`}
                onClick={() => module && onSlotClick(slotType, slotIndex)}
                onMouseEnter={(e) => module && setTooltip(module.name, e)}
                onMouseLeave={clearTooltip}
            >
                {module && getModuleIcon(module)}
            </div>
        );
    };

    const GroupButton: React.FC<{slotType: 'medium' | 'low'}> = ({ slotType }) => (
         <button 
            onClick={() => onToggleModuleGroup(slotType)}
            className="w-12 h-6 bg-gray-700 border border-gray-500 rounded text-xs hover:bg-gray-600"
            onMouseEnter={(e) => setTooltip(`Group Toggle ${slotType.charAt(0).toUpperCase() + slotType.slice(1)}`, e)}
            onMouseLeave={clearTooltip}
        >
            Group
        </button>
    );
    
    const droneButtonText = droneStatus === 'docked' ? 'Launch Drones' : 'Return Drones';
    const isDroneButtonDisabled = (droneStatus === 'docked' && totalDrones === 0) || droneStatus === 'returning';

    const engageButton = () => {
        if (selectedTargetType === 'pirate') {
            return (
                 <UIButton onClick={onDroneAttack} disabled={isAttackButtonDisabled} className="!text-xs !py-1 w-24">
                    Attack Target
                </UIButton>
            );
        }
        if (selectedTargetType === 'asteroid') {
            return (
                 <UIButton onClick={onDroneMine} disabled={isMineButtonDisabled} className="!text-xs !py-1 w-24">
                    Mine Target
                </UIButton>
            );
        }
        // Render a disabled placeholder if target is not engageable
        return (
            <UIButton disabled={true} className="!text-xs !py-1 w-24">
                Engage Target
            </UIButton>
        );
    };

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-50 pointer-events-auto">
             {hasDroneBay && (
                <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-600 rounded-md p-1 px-2">
                    <span className="font-bold text-lg text-yellow-300" title="Drones">D</span>
                    <span className="text-sm w-12 text-center">{activeDrones} / {totalDrones}</span>
                    <UIButton onClick={onToggleDrones} disabled={isDroneButtonDisabled} className="!text-xs !py-1 w-24">
                        {droneButtonText}
                    </UIButton>
                    {engageButton()}
                </div>
            )}
            <div className="flex justify-center items-center gap-1.5">
                {low.map((mod, i) => renderSlot(mod, 'low', i))}
                {low.length > 0 && <GroupButton slotType="low" />}
            </div>
             <div className="flex justify-center items-center gap-1.5">
                {medium.map((mod, i) => renderSlot(mod, 'medium', i))}
                {medium.length > 0 && <GroupButton slotType="medium" />}
            </div>
            <div className="flex justify-center gap-1.5">{high.map((mod, i) => renderSlot(mod, 'high', i))}</div>
        </div>
    );
};


// --- MISSION & AGENT UI ---

export const MissionTrackerUI: React.FC<{ playerState: PlayerState }> = ({ playerState }) => {
    if (!playerState.activeMissions || playerState.activeMissions.length === 0) {
        return null;
    }

    return (
        <div className="w-72 max-h-[30vh] bg-gray-900/80 border border-gray-600 p-2.5 box-border flex flex-col allow-touch-scroll">
            <h3 className="mt-0 text-center flex-shrink-0 text-lg">Mission Tracker</h3>
            <div className="overflow-y-auto text-sm space-y-3">
                {playerState.activeMissions.map(mission => {
                    const objectiveId = Object.keys(mission.objectives)[0];
                    if (!objectiveId) return null;
                    
                    const required = mission.objectives[objectiveId];
                    const stationHangar = playerState.stationHangars[mission.stationId];
                    const current = stationHangar?.materials[objectiveId] || 0;
                    const complete = current >= required;
                    const objectiveItem = getItemData(objectiveId);

                    return (
                        <div key={mission.id}>
                            <p className="font-bold m-0 leading-tight">{mission.title}</p>
                            <p className="text-xs text-gray-400 m-0 leading-tight">Agent: {mission.agent.name} ({mission.agent.corporation})</p>
                            <div className="text-sm flex items-center gap-2 mt-1">
                                <ItemIcon item={objectiveItem} size="small" />
                                <div>
                                    <span className="text-gray-300">{objectiveItem?.name}: </span>
                                    <span className={complete ? 'text-green-400' : 'text-yellow-400'}>
                                        {Math.min(current, required).toLocaleString()} / {required.toLocaleString()}
                                    </span>
                                    {complete && <span className="text-cyan-400 text-xs ml-2">[Ready for turn-in]</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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
                            isk: m.reward.isk,
                            items: m.reward.itemId ? [{ id: m.reward.itemId, quantity: m.reward.itemQuantity || 1 }] : undefined
                        },
                        status: 'offered'
                    };
                }).filter(m => Object.keys(m.objectives).length > 0);

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
    }, [isOpen, stationId, systemId]);

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
                                    <h5 className="text-lg font-semibold text-green-4