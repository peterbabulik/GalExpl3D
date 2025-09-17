// Console.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ConsoleMessage, ConsoleMessageType, PlayerState, Module } from './types';
import { SHIP_DATA, getItemData } from './constants';

const getMessageColor = (type: ConsoleMessageType): string => {
    switch (type) {
        case 'damage_in': return 'text-red-400';
        case 'damage_out': return 'text-orange-400';
        case 'mining':
        case 'loot':
        case 'bounty': return 'text-green-400';
        case 'repair': return 'text-cyan-400';
        case 'system':
        default: return 'text-gray-300';
    }
};

const ShipInfoPanel: React.FC<{ playerState: PlayerState, activeModuleSlots: string[] }> = ({ playerState, activeModuleSlots }) => {
    const shipStats = useMemo(() => {
        const currentShip = SHIP_DATA[playerState.currentShipId];
        if (!currentShip) return null;

        // Base stats from the ship's hull
        const stats = {
            maxVelocity: currentShip.attributes.speed,
            capacitor: {
                capacity: currentShip.attributes.capacitor,
                rechargeRate: currentShip.attributes.capacitorRechargeRate,
                rechargeTime: 0,
            },
            defenses: {
                shield: { hp: currentShip.attributes.shield, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
                armor: { hp: currentShip.attributes.armor, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
                hull: { hp: currentShip.attributes.hull, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
            },
        };
        
        const allFittedModules = Object.values(playerState.currentShipFitting)
            .flat()
            .map(id => id ? getItemData(id) as Module : null)
            .filter((m): m is Module => m !== null);
            
        // --- Initialize accumulators for percentage bonuses ---
        let shieldBonusMultiplier = 1.0;
        let armorBonusMultiplier = 1.0;
        let capacitorCapacityMultiplier = 1.0;
        // Recharge bonus is multiplicative on the time reduction factor
        let capacitorRechargeTimeFactor = 1.0;


        allFittedModules.forEach(module => {
            const attrs = module.attributes;
            
            const slotKey = (() => {
                for (const slotType in playerState.currentShipFitting) {
                    const typedSlot = slotType as keyof typeof playerState.currentShipFitting;
                    const index = playerState.currentShipFitting[typedSlot].indexOf(module.id);
                    if (index !== -1) {
                        return `${typedSlot}-${index}`;
                    }
                }
                return '';
            })();
            const isActive = activeModuleSlots.includes(slotKey);

            // --- Apply Passive and Active Bonuses ---

            // Defenses - Flat bonuses (applied first)
            if (attrs.shieldHPBonus) stats.defenses.shield.hp += attrs.shieldHPBonus;
            if (attrs.armorHPBonus) stats.defenses.armor.hp += attrs.armorHPBonus;
            
            // Defenses - Accumulate percentage bonuses from passive modules
            if (attrs.shieldBonus) shieldBonusMultiplier += attrs.shieldBonus;
            if (attrs.armorBonus) armorBonusMultiplier += attrs.armorBonus;
            
            // Defenses - Resistances
            // Active hardeners
            if (isActive && attrs.shieldResistanceBonus) {
                 Object.keys(attrs.shieldResistanceBonus).forEach(dmgType => {
                    const key = dmgType as keyof typeof stats.defenses.shield;
                    if (key !== 'hp') {
                       stats.defenses.shield[key] = 1 - (1 - stats.defenses.shield[key]) * (1 - attrs.shieldResistanceBonus[dmgType]);
                    }
                });
            }
            // Passive hardeners
             if (attrs.armorResistanceBonus) { 
                Object.keys(attrs.armorResistanceBonus).forEach(dmgType => {
                    const key = dmgType as keyof typeof stats.defenses.armor;
                     if (key !== 'hp') {
                        stats.defenses.armor[key] = 1 - (1 - stats.defenses.armor[key]) * (1 - attrs.armorResistanceBonus[dmgType]);
                     }
                });
            }
            
            // Capacitor
            if (attrs.capacitorBonus) capacitorCapacityMultiplier += attrs.capacitorBonus;
            if (attrs.capacitorRechargeBonus) {
                // Stacking penalties aren't implemented, so this will be multiplicative
                capacitorRechargeTimeFactor *= (1 - attrs.capacitorRechargeBonus);
            }

            // Navigation - only apply if prop mod is active
            if (isActive && (module.subcategory === 'afterburner' || module.subcategory === 'microwarpdrive') && attrs.velocityBonus) {
                stats.maxVelocity *= attrs.velocityBonus;
            }
        });

        // --- Apply accumulated percentage bonuses ---
        stats.defenses.shield.hp *= shieldBonusMultiplier;
        stats.defenses.armor.hp *= armorBonusMultiplier;
        stats.capacitor.capacity *= capacitorCapacityMultiplier;
        
        // --- Final Calculations ---
        // Recalculate recharge rate based on new capacity and time factor
        const baseRechargeTime = currentShip.attributes.capacitor / currentShip.attributes.capacitorRechargeRate;
        const modifiedRechargeTime = baseRechargeTime * capacitorRechargeTimeFactor;
        
        stats.capacitor.rechargeTime = modifiedRechargeTime;
        if (modifiedRechargeTime > 0) {
            stats.capacitor.rechargeRate = stats.capacitor.capacity / modifiedRechargeTime;
        } else {
            stats.capacitor.rechargeRate = Infinity;
        }

        return stats;

    }, [playerState, activeModuleSlots]);

    if (!shipStats) return <div className="p-2">No ship data available.</div>;

    const renderResistance = (res: number) => `${(res * 100).toFixed(1)}%`;

    return (
        <div className="p-2 h-full overflow-y-auto text-xs font-mono" role="status">
            <h4 className="font-bold text-sm text-cyan-300 border-b border-gray-600 mb-1">Defenses</h4>
            <div className="grid grid-cols-5 gap-x-2 text-center text-gray-400">
                <span></span><span>EM</span><span>Therm</span><span>Kin</span><span>Exp</span>
            </div>
            <div className="grid grid-cols-5 gap-x-2 text-center">
                <span className="text-left font-bold">Shield</span>
                <span>{renderResistance(shipStats.defenses.shield.em)}</span>
                <span>{renderResistance(shipStats.defenses.shield.thermal)}</span>
                <span>{renderResistance(shipStats.defenses.shield.kinetic)}</span>
                <span>{renderResistance(shipStats.defenses.shield.explosive)}</span>
            </div>
             <div className="grid grid-cols-5 gap-x-2 text-center">
                <span className="text-left font-bold">Armor</span>
                <span>{renderResistance(shipStats.defenses.armor.em)}</span>
                <span>{renderResistance(shipStats.defenses.armor.thermal)}</span>
                <span>{renderResistance(shipStats.defenses.armor.kinetic)}</span>
                <span>{renderResistance(shipStats.defenses.armor.explosive)}</span>
            </div>
             <div className="grid grid-cols-5 gap-x-2 text-center">
                <span className="text-left font-bold">Hull</span>
                <span>{renderResistance(shipStats.defenses.hull.em)}</span>
                <span>{renderResistance(shipStats.defenses.hull.thermal)}</span>
                <span>{renderResistance(shipStats.defenses.hull.kinetic)}</span>
                <span>{renderResistance(shipStats.defenses.hull.explosive)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 mt-1">
                 <div><span className="text-gray-400">Shield HP:</span> {Math.round(shipStats.defenses.shield.hp)}</div>
                 <div><span className="text-gray-400">Armor HP:</span> {Math.round(shipStats.defenses.armor.hp)}</div>
                 <div><span className="text-gray-400">Hull HP:</span> {Math.round(shipStats.defenses.hull.hp)}</div>
            </div>

             <h4 className="font-bold text-sm text-purple-300 border-b border-gray-600 mt-2 mb-1">Capacitor</h4>
             <div className="grid grid-cols-2 gap-x-4">
                <div><span className="text-gray-400">Capacity:</span> {Math.round(shipStats.capacitor.capacity)} GJ</div>
                <div><span className="text-gray-400">Recharge:</span> {(shipStats.capacitor.rechargeRate).toFixed(2)} GJ/s</div>
                <div className="col-span-2"><span className="text-gray-400">Recharge Time:</span> {shipStats.capacitor.rechargeTime.toFixed(1)} s</div>
             </div>

             <h4 className="font-bold text-sm text-green-300 border-b border-gray-600 mt-2 mb-1">Navigation</h4>
             <div><span className="text-gray-400">Max Velocity:</span> {Math.round(shipStats.maxVelocity)} m/s</div>
        </div>
    );
}

export const ConsoleUI: React.FC<{ messages: ConsoleMessage[], playerState: PlayerState, activeModuleSlots: string[] }> = ({ messages, playerState, activeModuleSlots }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<'log' | 'info'>('log');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current && !isMinimized && activeTab === 'log') {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized, activeTab]);

    return (
        <div className={`fixed bottom-5 left-5 w-96 bg-black/70 border-2 border-gray-600 rounded-lg transition-all duration-300 z-40 ${isMinimized ? 'h-8' : 'h-64'}`}>
            <div className={`flex justify-between items-center px-3 h-8 bg-gray-800/80 cursor-pointer ${isMinimized ? 'rounded-lg' : 'rounded-t-lg'}`} onClick={() => setIsMinimized(!isMinimized)}>
                <h3 className="text-sm font-bold m-0 text-gray-200">CONSOLE</h3>
                <button className="text-gray-200 text-lg" aria-label={isMinimized ? 'Expand Console' : 'Minimize Console'}>
                    {isMinimized ? '▲' : '▼'}
                </button>
            </div>
            {!isMinimized && (
                 <div className="flex flex-col h-[calc(100%-2rem)]">
                    <div className="flex-shrink-0 flex bg-gray-800/80">
                        <button 
                            onClick={() => setActiveTab('log')} 
                            className={`flex-1 py-1 text-sm font-bold ${activeTab === 'log' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700/50'}`}
                        >
                            LOG
                        </button>
                        <button 
                            onClick={() => setActiveTab('info')} 
                            className={`flex-1 py-1 text-sm font-bold ${activeTab === 'info' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700/50'}`}
                        >
                            SHIP INFO
                        </button>
                    </div>

                    {activeTab === 'log' && (
                        <div ref={scrollRef} className="p-2 flex-grow overflow-y-auto text-sm font-mono" role="log" aria-live="polite">
                            {messages.map((msg, index) => (
                                <div key={index}>
                                    <span className="text-gray-500 mr-2" aria-hidden="true">{`[${msg.timestamp}]`}</span>
                                    <span className={getMessageColor(msg.type)}>{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'info' && (
                        <ShipInfoPanel playerState={playerState} activeModuleSlots={activeModuleSlots} />
                    )}
                </div>
            )}
        </div>
    );
};