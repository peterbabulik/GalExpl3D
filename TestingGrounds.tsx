// TestingGrounds.tsx
import React, { useState, useCallback } from 'react';
import { ShipData, ShipClasses } from './ships';
import { MODULE_DATA } from './modules';
import { UIButton } from './UI';
import { calculateShipStats, isModulePassive, CalculatedStats } from './stat-calculator';
import type { Module, PlayerState } from './types';


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

// Helper to compare stats and return a list of changes
const compareStats = (base: CalculatedStats, active: CalculatedStats): string[] => {
    const changes: string[] = [];
    const epsilon = 0.001;

    if (Math.abs(base.maxVelocity - active.maxVelocity) > epsilon) changes.push('Velocity');
    if (Math.abs(base.capacitor.capacity - active.capacitor.capacity) > epsilon) changes.push('Cap Capacity');
    if (Math.abs(base.capacitor.rechargeRate - active.capacitor.rechargeRate) > epsilon) changes.push('Cap Recharge');

    if (Math.abs(base.defenses.shield.hp - active.defenses.shield.hp) > epsilon) changes.push('Shield HP');
    if (Math.abs(base.defenses.shield.em - active.defenses.shield.em) > epsilon) changes.push('Shield EM Res');
    if (Math.abs(base.defenses.shield.thermal - active.defenses.shield.thermal) > epsilon) changes.push('Shield Therm Res');
    if (Math.abs(base.defenses.shield.kinetic - active.defenses.shield.kinetic) > epsilon) changes.push('Shield Kin Res');
    if (Math.abs(base.defenses.shield.explosive - active.defenses.shield.explosive) > epsilon) changes.push('Shield Exp Res');

    if (Math.abs(base.defenses.armor.hp - active.defenses.armor.hp) > epsilon) changes.push('Armor HP');
    if (Math.abs(base.defenses.armor.em - active.defenses.armor.em) > epsilon) changes.push('Armor EM Res');
    if (Math.abs(base.defenses.armor.thermal - active.defenses.armor.thermal) > epsilon) changes.push('Armor Therm Res');
    if (Math.abs(base.defenses.armor.kinetic - active.defenses.armor.kinetic) > epsilon) changes.push('Armor Kin Res');
    if (Math.abs(base.defenses.armor.explosive - active.defenses.armor.explosive) > epsilon) changes.push('Armor Exp Res');
    
    return changes;
};


export const TestingGrounds: React.FC<TestingGroundsProps> = ({ stationName, onUndock }) => {
    const [selectedShipId, setSelectedShipId] = useState<string>('ship_hurricane');
    const [logs, setLogs] = useState<string[]>(['Welcome to the Testing Grounds. Select a ship and run tests.']);
    const [isTesting, setIsTesting] = useState(false);
    
    const allShips = Object.values(ShipData).sort((a, b) => a.name.localeCompare(b.name));

    const runPassiveTests = useCallback(async () => {
        setIsTesting(true);
        const newLogs: string[] = [];

        try {
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
                const testFitting: PlayerState['currentShipFitting'] = {
                    high: Array(shipData.slots.high).fill(null),
                    medium: Array(shipData.slots.medium).fill(null),
                    low: Array(shipData.slots.low).fill(null),
                    rig: Array(shipData.slots.rig).fill(null),
                };

                if (testFitting[module.slot].length > 0) {
                    testFitting[module.slot][0] = module.id;
                } else {
                    newLogs.push(`WARN: Could not fit ${module.name} to ${shipData.name}, no slots of type '${module.slot}' available.`);
                    continue;
                }
                
                const activeSlots = [`${module.slot}-0`];

                const stats = calculateShipStats(shipData, testFitting, {}, activeSlots);
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

    const runActivationTest = useCallback(async () => {
        setIsTesting(true);
        const newLogs: string[] = [];
        let testsRun = 0;
        let testsPassed = 0;
        let testsFailed = 0;
        let testsSkipped = 0;

        try {
            newLogs.push('--- Starting Active Module Stat Change Test (All Ships) ---');
            setLogs(newLogs);
            await new Promise(resolve => setTimeout(resolve, 0));

            for (const shipData of allShips) {
                newLogs.push(`Testing ship: ${shipData.name}`);
                setLogs([...newLogs]);
                await new Promise(resolve => setTimeout(resolve, 0));

                const shipSize = getShipSizeCategory(shipData.class);
                const allModules = Object.values(MODULE_DATA);
                const compatibleModules = allModules.filter(module => {
                    if (shipData.slots[module.slot] === 0) return false;
                    if (module.size === 'all') return true;
                    return module.size === shipSize;
                });

                for (const module of compatibleModules) {
                    testsRun++;
                    const testFitting: PlayerState['currentShipFitting'] = {
                        high: Array(shipData.slots.high).fill(null),
                        medium: Array(shipData.slots.medium).fill(null),
                        low: Array(shipData.slots.low).fill(null),
                        rig: Array(shipData.slots.rig).fill(null),
                    };

                    if (testFitting[module.slot].length === 0) continue;
                    testFitting[module.slot][0] = module.id;
                    
                    const slotKey = `${module.slot}-0`;

                    if (isModulePassive(module)) {
                        newLogs.push(`  - [SKIP] ${module.name} is passive.`);
                        testsSkipped++;
                        continue;
                    }

                    const baseStats = calculateShipStats(shipData, testFitting, {}, []);
                    const activeStats = calculateShipStats(shipData, testFitting, {}, [slotKey]);

                    const changes = compareStats(baseStats, activeStats);

                    if (changes.length > 0) {
                        newLogs.push(`  - [PASS] ${module.name} changed stats: ${changes.join(', ')}`);
                        testsPassed++;
                    } else {
                        newLogs.push(`  - [FAIL] ${module.name} is ACTIVE but did NOT change stats.`);
                        testsFailed++;
                    }
                }
                 if (newLogs.length > 50) {
                    setLogs([...newLogs]); // Update logs periodically
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            newLogs.push('--- Test run complete. ---');
            newLogs.push(`Summary: ${testsPassed} passed, ${testsFailed} failed, ${testsSkipped} skipped out of ${testsRun} total.`);
            setLogs(newLogs);

        } catch (error) {
            console.error("Activation test run failed:", error);
            setLogs(prev => [...prev, '--- An error occurred during the activation test run. Check console. ---']);
        } finally {
            setIsTesting(false);
        }
    }, [allShips]);

    return (
        <div className="absolute inset-0 z-[200] p-8 box-border flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-4xl mb-6 text-center">Docked at {stationName}</h2>
            <div className="w-full max-w-6xl h-[70vh] flex gap-6 bg-gray-900/80 border border-gray-600 rounded-lg p-6">
                <div className="w-1/3 flex flex-col">
                    <h3 className="text-2xl mb-4">1. Select Ship (for passive test)</h3>
                    <div className="overflow-y-auto bg-black/30 p-2 rounded flex-grow">
                        {allShips.map(ship => (
                            <div
                                key={ship.id}
                                onClick={() => !isTesting && setSelectedShipId(ship.id)}
                                className={`p-2 rounded ${selectedShipId === ship.id ? 'bg-indigo-700' : 'hover:bg-gray-700'} ${isTesting ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}
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
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <UIButton onClick={runPassiveTests} disabled={isTesting || !selectedShipId} className="w-full !text-lg !py-3">
                            {isTesting ? 'Testing...' : 'Test Module Passive Effects'}
                        </UIButton>
                         <UIButton onClick={runActivationTest} disabled={isTesting} className="w-full !text-lg !py-3">
                            {isTesting ? 'Testing...' : 'Test Module Active Effects'}
                        </UIButton>
                    </div>
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
