import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiPlayerState, PlayerState, GalaxyData, SolarSystemData, AnyItem, Ship } from './types';
import { getItemData, SHIP_DATA, BLUEPRINT_DATA, SOLAR_SYSTEM_DATA } from './constants';
import { ASTEROID_BELT_TYPES } from "./ores";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const actionSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            enum: ['mine', 'travel_to_system', 'dock', 'undock', 'sell_ore', 'buy_ship', 'idle', 'set_goal'],
            description: "The single, most logical action to perform this turn."
        },
        targetId: {
            type: Type.STRING,
            description: "The ID of the target. For 'mine', an ore ID like 'ore_veldspar'. For 'travel_to_system', a system ID. For 'buy_ship', a ship ID like 'ship_venture'. For other actions, can be null or descriptive."
        },
        reasoning: {
            type: Type.STRING,
            description: "A short, in-character thought process for the chosen action. This is my 'voice'."
        }
    },
    required: ["action", "reasoning"]
};

function getCargoVolume(cargo: GeminiPlayerState['shipCargo']): number {
    let volume = 0;
    for (const matId in cargo.materials) {
        const itemData = getItemData(matId);
        if (itemData?.volume) {
            volume += cargo.materials[matId] * itemData.volume;
        }
    }
    // Gemini player doesn't handle non-material items yet.
    return volume;
}

export async function runGeminiPlayerAction(
    geminiState: GeminiPlayerState,
    playerState: PlayerState, // Human player state for context
    galaxyData: GalaxyData,
    allSystemsData: Record<number, SolarSystemData>,
    // FIX: Add humanPlayerLocation parameter to correctly determine the human player's whereabouts.
    humanPlayerLocation: { systemId: number | null; isDocked: boolean; dockedStationId: string | null }
): Promise<{ newState: GeminiPlayerState, log: string }> {
    
    let newState = JSON.parse(JSON.stringify(geminiState)) as GeminiPlayerState;
    newState.lastActionTimestamp = Date.now();
    
    const currentSystem = galaxyData.systems.find(s => s.id === newState.currentSystemId);
    const currentSystemData = allSystemsData[newState.currentSystemId];
    const currentShip = SHIP_DATA[newState.currentShipId];
    if (!currentSystem || !currentSystemData || !currentShip) {
        return { newState, log: "Error: Could not find current system or ship data. Idling." };
    }

    // --- CONTEXT GATHERING ---
    const systemAsteroidBeltType = currentSystemData.asteroidBeltType ? ASTEROID_BELT_TYPES[currentSystemData.asteroidBeltType] : undefined;
    const availableOres = systemAsteroidBeltType ? Object.keys(systemAsteroidBeltType.oreDistribution) : [];

    // FIX: Determine human player's system ID from the new location parameter.
    const humanSystemId = humanPlayerLocation.isDocked && humanPlayerLocation.dockedStationId
        ? parseInt(humanPlayerLocation.dockedStationId.split('_')[1], 10)
        : humanPlayerLocation.systemId;

    const context = {
        status: {
            name: newState.name,
            isk: newState.isk,
            currentGoal: newState.currentGoal,
            ship: {
                name: currentShip.name,
                cargoCapacity: currentShip.attributes.cargoCapacity + (currentShip.attributes.oreHold || 0),
                currentCargoVolume: getCargoVolume(newState.shipCargo),
                cargoContents: newState.shipCargo.materials,
            },
            location: {
                systemName: currentSystem.name,
                systemSecurity: currentSystem.security,
                isDocked: newState.isDocked,
                stationName: newState.isDocked ? currentSystemData.station?.name : null,
            }
        },
        environment: {
            availableOres: availableOres,
            stationServices: newState.isDocked ? ['market', 'hangar'] : [],
            canSellOre: newState.isDocked,
        },
        market: {
            shipsForSale: Object.values(SHIP_DATA)
                .filter(ship => (ship.basePrice || 0) > 0 && ship.basePrice! <= newState.isk)
                .map(ship => ({ id: ship.id, name: ship.name, class: ship.class, price: ship.basePrice }))
                .slice(0, 5) // Limit for brevity
        },
        humanPlayer: {
            name: playerState.playerName,
            ship: SHIP_DATA[playerState.currentShipId].name,
            // FIX: Use the derived human player system ID to find their location name.
            location: galaxyData.systems.find(s => s.id === humanSystemId)?.name || 'Unknown'
        }
    };

    const systemInstruction = `
        You are an AI pilot named Gemini in the space game GalExpl3D.
        Your primary goal is to become a successful capsuleer. You are currently focused on your stated goal.
        You are a new pilot, so act cautiously. Mine resources, sell them for profit (ISK), and upgrade your ship when you can afford it.
        You can only perform ONE action per turn. Your actions are simulated.
        Analyze your current status, environment, and goal to make the best decision.
        If your cargo is full, you should dock to sell your ore. If you are docked with ore, you should sell it.
        If you have enough ISK, consider buying a better ship to achieve your goals faster.
        If you are idle, set a new, reasonable goal.
        Respond ONLY with a single JSON object matching the provided schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the current game state:\n${JSON.stringify(context, null, 2)}\n\nWhat is your next action?`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: actionSchema,
            },
        });

        const jsonStr = response.text.trim();
        const decision = JSON.parse(jsonStr) as { action: string, targetId?: string, reasoning: string };
        let logMessage = decision.reasoning;

        // --- ACTION SIMULATION ---
        switch (decision.action) {
            case 'mine':
                if (newState.isDocked) {
                    logMessage += " (Decision Error: Must undock before mining. Idling this turn.)";
                } else {
                    const cargoCapacity = currentShip.attributes.cargoCapacity + (currentShip.attributes.oreHold || 0);
                    const currentVolume = getCargoVolume(newState.shipCargo);
                    if (currentVolume >= cargoCapacity) {
                         logMessage += " (Action Blocked: Cargo is full. Will try to dock next turn.)";
                         newState.currentGoal = "Cargo is full. I need to find a station and sell my ore.";
                    } else {
                        const oreToMine = context.environment.availableOres.length > 0 ? context.environment.availableOres[0] : 'ore_veldspar';
                        const oreData = getItemData(oreToMine);
                        if (!oreData) {
                            logMessage += ` (Internal Error: Could not find data for ore '${oreToMine}'. Idling.)`;
                            break;
                        }
                        const minedAmount = 200; // Simulate one cycle
                        newState.shipCargo.materials[oreToMine] = (newState.shipCargo.materials[oreToMine] || 0) + minedAmount;
                        logMessage += ` Mined ${minedAmount} units of ${oreData.name}.`;
                    }
                }
                break;
            case 'dock':
                if (!currentSystemData.station) {
                    logMessage += " (Decision Error: No station in this system. Idling.)";
                } else if (!newState.isDocked) {
                    newState.isDocked = true;
                    newState.dockedStationId = `station_${newState.currentSystemId}_${currentSystemData.station.name.replace(/ /g, '_')}`;
                    logMessage += ` Docked at ${currentSystemData.station.name}.`;
                } else {
                    logMessage += " (Already docked. Idling.)";
                }
                break;
            case 'undock':
                if (newState.isDocked) {
                    newState.isDocked = false;
                    newState.dockedStationId = null;
                } else {
                     logMessage += " (Already in space. Idling.)";
                }
                break;
            case 'sell_ore':
                if (!newState.isDocked) {
                    logMessage += " (Decision Error: Must be docked to sell. Idling.)";
                } else {
                    let totalProfit = 0;
                    for (const matId in newState.shipCargo.materials) {
                        const oreData = getItemData(matId);
                        const quantity = newState.shipCargo.materials[matId];
                        if (oreData && oreData.basePrice) {
                            totalProfit += quantity * oreData.basePrice * 0.9; // Sell at 90%
                        }
                    }
                    if (totalProfit > 0) {
                        newState.isk += totalProfit;
                        newState.shipCargo.materials = {};
                        logMessage += ` Sold ore for ${totalProfit.toFixed(0)} ISK.`;
                    } else {
                        logMessage += " (No ore to sell.)";
                    }
                }
                break;
            case 'buy_ship':
                if (!newState.isDocked) {
                    logMessage += " (Decision Error: Must be docked to buy ships.)";
                } else if (decision.targetId) {
                    const shipToBuy = SHIP_DATA[decision.targetId];
                    if (shipToBuy && shipToBuy.basePrice && newState.isk >= shipToBuy.basePrice) {
                        newState.isk -= shipToBuy.basePrice;
                        // For simplicity, we'll just swap the ship. Old ship is 'lost'.
                        newState.currentShipId = shipToBuy.id;
                        newState.shipCargo = { items: [], materials: {} }; // Empty cargo
                        logMessage += ` Purchased a new ${shipToBuy.name}!`;
                        newState.currentGoal = `Test out my new ${shipToBuy.name}.`;
                    } else {
                        logMessage += " (Could not afford or find the ship. Idling.)";
                    }
                }
                break;
            case 'travel_to_system':
                const targetSystemId = parseInt(decision.targetId || '', 10);
                if (!isNaN(targetSystemId) && galaxyData.systems.find(s => s.id === targetSystemId)) {
                    // Simulating travel: for now, it's instant.
                    newState.currentSystemId = targetSystemId;
                    newState.isDocked = false; // Travel always undocks
                    newState.dockedStationId = null;
                    logMessage += ` Arrived in ${galaxyData.systems.find(s => s.id === targetSystemId)!.name}.`;
                } else {
                    logMessage += " (Invalid travel target. Idling.)";
                }
                break;
            case 'set_goal':
                if(decision.targetId) {
                    newState.currentGoal = decision.targetId;
                    logMessage += ` New goal set: ${newState.currentGoal}`;
                }
                break;
            case 'idle':
                // Do nothing
                break;
        }

        return { newState, log: logMessage };

    } catch (error) {
        console.error("Gemini Player Action Error:", error);
        // FIX: Previously this catch block didn't return anything, which could cause a crash in App.tsx.
        // It now returns the original state and a log message, preventing the crash.
        return { 
            newState, 
            log: "Encountered a system glitch. Retrying on the next cycle." 
        };
    }
}