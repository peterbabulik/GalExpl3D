// corporation-ai.ts
import type { CorporationData, StationMarketData, StationInfo, DeployedShip, GalaxyData, Ship } from './types';
import { BLUEPRINT_DATA, getItemData, SOLAR_SYSTEM_DATA, SHIP_DATA, FLEET_GOALS } from './constants';

const CLAIM_INCOME = 50000;
const MINING_YIELD_PER_TICK = 500; // Units of ore per tick for a deployed miner
const MINER_RETURN_TRIP_SECONDS = 120; // 2 minutes

export function updateCorporationsAI(
    currentCorporations: Record<string, CorporationData>,
    currentMarketData: StationMarketData,
    allStations: StationInfo[],
    tickInterval: number,
    galaxyData: GalaxyData,
): {
    updatedCorporations: Record<string, CorporationData>,
    updatedMarketData: StationMarketData
} {
    // FIX: Add explicit types to variables initialized with `JSON.parse` to ensure type safety. `JSON.parse` can return `any` or `unknown`, which can lead to type errors.
    const updatedCorporations: Record<string, CorporationData> = JSON.parse(JSON.stringify(currentCorporations));
    const updatedMarketData: StationMarketData = JSON.parse(JSON.stringify(currentMarketData));
    const allClaimedSystems = Object.values(updatedCorporations).map(c => c.claimedSystemId).filter(id => id !== null);

    for (const corpId in updatedCorporations) {
        const corp = updatedCorporations[corpId];
        const goals = FLEET_GOALS[corpId] || {};

        // === 1. UPDATE DEPLOYED SHIPS AND TIMERS ===
        
        // Income from claims
        const hasClaimingShip = corp.shipsInSpace.some(s => s.shipType === 'combat');
        if (corp.claimedSystemId !== null && hasClaimingShip) {
            corp.claimTimer -= tickInterval;
            if (corp.claimTimer <= 0) {
                corp.isk += CLAIM_INCOME;
                corp.claimTimer = 600; // Reset 10-minute timer
            }
        }

        // Update miners
        const completedMiners: DeployedShip[] = [];
        corp.shipsInSpace.forEach(ship => {
            if (ship.shipType === 'mining') {
                if (ship.state === 'mining') {
                    const shipData = SHIP_DATA[ship.shipId];
                    if (!ship.cargo) ship.cargo = { items: [], materials: {} };
                    
                    const oreId = 'ore_arkonor'; // Assume they mine the good stuff
                    ship.cargo.materials[oreId] = (ship.cargo.materials[oreId] || 0) + MINING_YIELD_PER_TICK;
                    
                    const cargoVolume = (getItemData(oreId)?.volume || 0.1) * ship.cargo.materials[oreId];
                    const capacity = (shipData.attributes.oreHold || 0) + shipData.attributes.cargoCapacity;
                    
                    if (cargoVolume >= capacity) {
                        ship.state = 'returning';
                        ship.returnTimer = MINER_RETURN_TRIP_SECONDS;
                    }
                } else if (ship.state === 'returning') {
                    ship.returnTimer! -= tickInterval;
                    if (ship.returnTimer! <= 0) {
                        // Deposit cargo
                        if (ship.cargo) {
                            for (const matId in ship.cargo.materials) {
                                corp.assetHangar.materials[matId] = (corp.assetHangar.materials[matId] || 0) + ship.cargo.materials[matId];
                            }
                        }
                        completedMiners.push(ship);
                    }
                }
            }
        });

        // Return completed miners to hangar
        if (completedMiners.length > 0) {
            const completedShipIds = completedMiners.map(s => s.shipId);
            corp.shipsInSpace = corp.shipsInSpace.filter(s => !completedMiners.includes(s));
            completedShipIds.forEach(shipId => corp.assetHangar.items.push(shipId));
        }


        // === 2. DEPLOY SHIPS FROM HANGAR (Goal Driven) ===
        
        // Check for player-assigned goals first
        if (corp.playerAssignedGoal && corp.playerAssignedGoal.action === 'conquer_system') {
            const targetSystemId = corp.playerAssignedGoal.targetId;
            if (!allClaimedSystems.includes(targetSystemId)) {
                const availableCombatShipId = corp.assetHangar.items.find(id => {
                    const item = getItemData(id) as Ship;
                    return item?.category === 'Ship' && !item.class.toLowerCase().includes('mining') && !item.class.toLowerCase().includes('industrial');
                });

                if (availableCombatShipId) {
                    corp.claimedSystemId = targetSystemId;
                    allClaimedSystems.push(targetSystemId); // Update our local copy for this tick
                    
                    corp.shipsInSpace.push({
                        shipId: availableCombatShipId,
                        shipType: 'combat',
                        systemId: targetSystemId,
                        state: 'claiming',
                    });
                    corp.assetHangar.items.splice(corp.assetHangar.items.indexOf(availableCombatShipId), 1);
                }
            }
            // Clear the goal whether it succeeded or not (e.g., if system was taken by another corp)
            delete corp.playerAssignedGoal;
        }


        // Default behavior: Deploy a combat ship to claim a system if needed
        if (corp.claimedSystemId === null) {
            const availableCombatShipId = corp.assetHangar.items.find(id => {
                const item = getItemData(id) as Ship;
                return item?.category === 'Ship' && !item.class.toLowerCase().includes('mining') && !item.class.toLowerCase().includes('industrial');
            });

            if (availableCombatShipId) {
                const unclaimedSystems = galaxyData.systems.filter(s => s.security <= 0.0 && !allClaimedSystems.includes(s.id));
                if (unclaimedSystems.length > 0) {
                    const targetSystem = unclaimedSystems[Math.floor(Math.random() * unclaimedSystems.length)];
                    corp.claimedSystemId = targetSystem.id;
                    allClaimedSystems.push(targetSystem.id);
                    
                    corp.shipsInSpace.push({
                        shipId: availableCombatShipId,
                        shipType: 'combat',
                        systemId: targetSystem.id,
                        state: 'claiming',
                    });
                    corp.assetHangar.items.splice(corp.assetHangar.items.indexOf(availableCombatShipId), 1);
                }
            }
        }

        // Deploy a mining ship if a system is claimed
        if (corp.claimedSystemId !== null) {
            const systemData = SOLAR_SYSTEM_DATA[corp.claimedSystemId];
            if (systemData && systemData.asteroidBeltType) {
                 const availableMinerId = corp.assetHangar.items.find(id => {
                    const item = getItemData(id) as Ship;
                    return item?.category === 'Ship' && item.class.toLowerCase().includes('mining');
                });
                 if (availableMinerId) {
                    corp.shipsInSpace.push({
                        shipId: availableMinerId,
                        shipType: 'mining',
                        systemId: corp.claimedSystemId,
                        state: 'mining',
                        cargo: { items: [], materials: {} },
                    });
                    corp.assetHangar.items.splice(corp.assetHangar.items.indexOf(availableMinerId), 1);
                 }
            }
        }


        // === 3. MANAGE SHIP CONSTRUCTION ===
        
        // 3a. Process player-authorized build queue first
        let builtFromQueue = false;
        if (corp.buildQueue && corp.buildQueue.length > 0) {
            const shipIdToBuild = corp.buildQueue[0];
            const blueprintId = `bp_${shipIdToBuild.replace('ship_', '')}`;
            const bp = BLUEPRINT_DATA[blueprintId];

            if (bp) {
                let hasMaterials = true;
                for (const matId in bp.materials) {
                    if ((corp.assetHangar.materials[matId] || 0) < bp.materials[matId]) {
                        hasMaterials = false;
                        break;
                    }
                }

                if (hasMaterials) {
                    // Consume materials
                    for (const matId in bp.materials) {
                        corp.assetHangar.materials[matId] -= bp.materials[matId];
                        if (corp.assetHangar.materials[matId] <= 0) delete corp.assetHangar.materials[matId];
                    }
                    // Add ship to hangar
                    corp.assetHangar.items.push(shipIdToBuild);
                    // Remove from queue
                    corp.buildQueue.shift();
                    builtFromQueue = true;
                }
            }
        }
        
        // 3b. Autonomous construction based on fleet goals (if nothing was built from queue)
        if (!builtFromQueue) {
            const currentFleetCount: Record<string, number> = {};
            [...corp.assetHangar.items, ...corp.shipsInSpace.map(s => s.shipId)].forEach(itemId => {
                if (itemId.startsWith('ship_')) {
                    currentFleetCount[itemId] = (currentFleetCount[itemId] || 0) + 1;
                }
            });

            const blueprintIdToBuild = Object.keys(BLUEPRINT_DATA).find(bpId => {
                const bp = BLUEPRINT_DATA[bpId];
                const neededCount = goals[bp.outputItem] || 0;
                const currentCount = currentFleetCount[bp.outputItem] || 0;
                if (currentCount >= neededCount) return false;

                for (const matId in bp.materials) {
                    if ((corp.assetHangar.materials[matId] || 0) < bp.materials[matId]) {
                        return false; // Not enough materials
                    }
                }
                return true; // Have enough materials
            });

            if (blueprintIdToBuild) {
                const bp = BLUEPRINT_DATA[blueprintIdToBuild];
                 for (const matId in bp.materials) {
                    corp.assetHangar.materials[matId] -= bp.materials[matId];
                    if (corp.assetHangar.materials[matId] <= 0) delete corp.assetHangar.materials[matId];
                }
                corp.assetHangar.items.push(bp.outputItem);
            }
        }
    }

    return { updatedCorporations, updatedMarketData };
}