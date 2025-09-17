// Console.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ConsoleMessage, ConsoleMessageType, PlayerState, Module } from './types';
import { SHIP_DATA, getItemData } from './constants';
import { calculateShipStats } from './stat-calculator';

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
        
        return calculateShipStats(currentShip, playerState.currentShipFitting, playerState.skills, activeModuleSlots);

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
             
             <h4 className="font-bold text-sm text-orange-300 border-b border-gray-600 mt-2 mb-1">Offense</h4>
             <div className="grid grid-cols-2 gap-x-4">
                 <div><span className="text-gray-400">DPS:</span> {shipStats.offense.dps.toFixed(1)}</div>
                 <div><span className="text-gray-400">Alpha:</span> {shipStats.offense.alphaDamage.toFixed(0)}</div>
             </div>

             <h4 className="font-bold text-sm text-green-300 border-b border-gray-600 mt-2 mb-1">Navigation</h4>
             <div><span className="text-gray-400">Max Velocity:</span> {Math.round(shipStats.maxVelocity)} m/s</div>
             
             {shipStats.activeModules.length > 0 && (
                <>
                    <h4 className="font-bold text-sm text-yellow-300 border-b border-gray-600 mt-2 mb-1">Active Modifiers</h4>
                    {shipStats.activeModules.map((mod, index) => (
                        <div key={index} className="mb-1">
                            <p className="font-semibold text-xs m-0 text-yellow-200">{mod.name}</p>
                            <ul className="list-disc list-inside text-gray-400 pl-2">
                                {Object.entries(mod.bonuses).map(([key, value]) => (
                                    <li key={key} className="text-green-400"><span className="text-gray-300">{key}:</span> {value}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </>
            )}
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