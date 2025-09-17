// TestingGrounds.tsx
import React, { useState, useCallback } from 'react';
// FIX: Corrected import to use 'ShipData' as it is the exported member from './ships' and removed the non-existent 'SHIP_DATA'.
import { ShipData, ShipClasses } from './ships';
import { MODULE_DATA } from './modules';
import { UIButton } from './UI';
import { calculateShipStats } from './stat-calculator';
import type { Module } from './types';


interface TestingGroundsProps {
    stationName: string;
    onUndock: () => void;
}

const getShipSizeCategory = (shipClassString: string): 'small' | 'medium' | 'large' | 'capital' => {
    const classData = ShipClasses[shipClassString];
    if (classData) {
        return classData.size.toLowerCase() as any;
    }
    // Fallback for compound names
    if (shipClassString.toLowerCase().includes('frigate') || shipClassString.toLowerCase().includes('destroyer')) return 'small';
    if (shipClassString.toLowerCase().includes('cruiser') || shipClassString.toLowerCase().includes('barge')) return 'medium';
    if (shipClassString.toLowerCase().includes('battlecruiser') || shipClassString.toLowerCase().includes('battleship')) return 'large';
    if (shipClassString.toLowerCase().includes('capital') || shipClassString.toLowerCase().includes('command')) return 'capital';
    return 'small';
};


export const TestingGrounds: React.FC<TestingGroundsProps> = ({ stationName, onUndock }) => {
    const [selectedShipId, setSelectedShipId] = useState<string>('ship_hurricane');
    const [logs, setLogs] = useState<string[]>(['Welcome to the Testing Grounds. Select a ship and run tests.']);
    const [isTesting, setIsTesting] = useState(false);
    
    const allShips = Object.values(ShipData).sort((a, b) => a.name.localeCompare(b.name));

    const runTests = useCallback(async () => {
        setIsTesting(true);
        const newLogs: string[] = [];

        try {
            // FIX: Use 'ShipData' which is correctly imported. 'SHIP_DATA' was incorrect.
            const shipData = ShipData[selectedShipId];
            if (!shipData) {
                newLogs.push('ERROR: Could not find selected ship data.');
                setLogs(newLogs);
                setIsTesting(false);
                return;
            }

            newLogs.push(`--- Starting test run for ${shipData.name} ---`);
            setLogs(newLogs);
            await new Promise(resolve => setTimeout(resolve, 0));

            const shipSize = getShipSizeCategory(shipData.class);

            const allModules = Object.values(MODULE_DATA);

            const compatibleModules = allModules.filter(module => {
                if (shipData.slots[module.slot] === 0) return false;
                if (module.size === 'all') return true;
                return module.size === shipSize;
            });
            
            if (compatibleModules.length === 0) {
                 newLogs.push('No compatible modules found for this ship chassis.');
            }

            for (const module of compatibleModules) {
                // For this test, we assume the module is active to see its effect
                const stats = calculateShipStats(shipData, [module]);
                const logEntry = `Fitted [${module.name}]: ShieldHP=${Math.round(stats.defenses.shield.hp)}, ArmorHP=${Math.round(stats.defenses.armor.hp)}, Speed=${Math.round(stats.maxVelocity)}m/s, CapRecharge=${stats.capacitor.rechargeRate.toFixed(2)}GJ/s`;
                newLogs.push(logEntry);
                
                if (newLogs.length % 20 === 0) {
                    setLogs([...newLogs]);
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            newLogs.push(`--- Test run complete. ${compatibleModules.length} compatible modules tested. ---`);
            setLogs(newLogs);

        } catch (error) {
            console.error("Test run failed:", error);
            setLogs(prev => [...prev, '--- An error occurred during the test run. Check console. ---']);
        } finally {
            setIsTesting(false);
        }

    }, [selectedShipId]);

    return (
        <div className="absolute inset-0 z-[200] p-8 box-border flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-4xl mb-6 text-center">Docked at {stationName}</h2>
            <div className="w-full max-w-6xl h-[70vh] flex gap-6 bg-gray-900/80 border border-gray-600 rounded-lg p-6">
                <div className="w-1/3 flex flex-col">
                    <h3 className="text-2xl mb-4">1. Select Ship</h3>
                    <div className="overflow-y-auto bg-black/30 p-2 rounded flex-grow">
                        {allShips.map(ship => (
                            <div
                                key={ship.id}
                                onClick={() => setSelectedShipId(ship.id)}
                                className={`p-2 cursor-pointer rounded ${selectedShipId === ship.id ? 'bg-indigo-700' : 'hover:bg-gray-700'}`}
                            >
                                {ship.name} <span className="text-gray-400 text-sm">({ship.class})</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-2/3 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl">2. Run Tests</h3>
                        <UIButton onClick={onUndock}>Undock</UIButton>
                    </div>
                    <UIButton onClick={runTests} disabled={isTesting || !selectedShipId} className="w-full !text-lg !py-3 mb-4">
                        {isTesting ? 'Testing in Progress...' : 'Run All Compatible Module Tests'}
                    </UIButton>
                    <div className="bg-black/50 p-3 rounded flex-grow overflow-y-auto font-mono text-sm">
                        {logs.map((log, index) => (
                            <div key={index}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
