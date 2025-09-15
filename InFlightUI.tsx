// InFlightUI.tsx
import React from 'react';
import type { PlayerState, Target, NavPanelItem, Module, Drone, AnyItem } from './types';
import { 
    SHIP_DATA,
    getItemData,
} from './constants';
import { UIButton, ItemIcon, HPBar } from './UI';

// --- CONSTANTS ---
const MINING_RANGE = 1500;
const WARP_MIN_DISTANCE = 1000;
const LOOT_RANGE = 2500;

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
