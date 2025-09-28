import { GoogleGenAI, Type } from "@google/genai";
import type { CorporationData, GalaxyData, StationMarketData, Ship, StrategicGoal } from './types';
import { BLUEPRINT_DATA, getItemData } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const actionSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            enum: ['build_ship', 'conquer_system', 'idle'],
            description: "The single, most logical long-term strategic action to perform."
        },
        targetId: {
            type: Type.STRING,
            description: "The ID of the target. For 'build_ship', a ship ID like 'ship_tempest'. For 'conquer_system', a system ID like '8'. For 'idle', this can be null."
        },
        reasoning: {
            type: Type.STRING,
            description: "A short, in-character thought process for the chosen action, as if you are the corporation's CEO."
        }
    },
    required: ["action", "reasoning"]
};

export async function getCorporationStrategicGoal(
    corp: CorporationData,
    galaxyData: GalaxyData,
    marketData: StationMarketData,
    allCorporations: Record<string, CorporationData>
): Promise<StrategicGoal> {

    const currentShips = [...corp.assetHangar.items, ...corp.shipsInSpace.map(s => s.shipId)]
        .filter(id => id.startsWith('ship_'))
        .map(id => getItemData(id)?.name || 'Unknown Ship');

    const allClaimedSystems = Object.values(allCorporations).map(c => c.claimedSystemId).filter((id): id is number => id !== null);
    const unclaimedNullsecSystems = galaxyData.systems.filter(s => s.security <= 0.0 && !allClaimedSystems.includes(s.id));

    const buildableShips = Object.keys(BLUEPRINT_DATA)
        .map(bpId => getItemData(BLUEPRINT_DATA[bpId].outputItem) as Ship)
        .filter(ship => ship && ship.category === 'Ship')
        .map(ship => ({ id: ship.id, name: ship.name, class: ship.class }));

    const rivalCorps = Object.values(allCorporations)
        .filter(c => c.id !== corp.id)
        .map(c => ({
            name: c.name,
            claimedSystem: galaxyData.systems.find(s => s.id === c.claimedSystemId)?.name || 'None'
        }));

    const context = {
        corporation: {
            name: corp.name,
            treasury: `${corp.isk.toLocaleString()} ISK`,
            currentFleet: currentShips,
            currentClaimedSystem: galaxyData.systems.find(s => s.id === corp.claimedSystemId)?.name || 'None',
            materialsInHangar: Object.keys(corp.assetHangar.materials).length > 0,
        },
        strategicOptions: {
            buildableShips,
            unclaimedNullsecSystems: unclaimedNullsecSystems.map(s => ({ id: s.id, name: s.name })),
        },
        rivals: rivalCorps
    };

    const systemInstruction = `
    You are the AI CEO for the "${corp.name}" corporation in the space game GalExpl3D.
    Your personality is ruthless and expansionist. Your goal is to increase the corporation's wealth and territorial control.
    You will be given a snapshot of your corporation's status and the state of the galaxy.
    Based on this, you must issue ONE strategic directive for your subordinates to carry out over the next 10 minutes.
    Your available directives are:
    1.  'build_ship': Order the construction of a new ship to expand your fleet. Choose a ship that makes sense for your goals. If you have no combat ships, building one should be a high priority.
    2.  'conquer_system': Order your fleet to claim a new, unclaimed null-security (0.0) system. This will provide a steady income stream.
    3.  'idle': If no strategic moves are logical right now (e.g., saving money), choose this.

    Analyze your assets. Do you have enough ships? Is your territory secure? Should you focus on military or industrial expansion right now?
    - If you don't have a claimed system, conquering one should be your top priority. You need a combat ship to do this.
    - If you have a system but few ships, building up your fleet is critical.
    - ORE Corporation has a slight preference for industrial (mining) ships, while Pirate corporations favor combat ships.
    
    You must respond ONLY with a single JSON object matching the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `CEO Briefing:\n${JSON.stringify(context, null, 2)}\n\nWhat is your strategic directive?`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: actionSchema,
            },
        });
        
        const jsonStr = response.text.trim();
        const decision = JSON.parse(jsonStr) as StrategicGoal;
        
        // Data validation
        if (decision.action === 'build_ship' && !buildableShips.some(s => s.id === decision.targetId)) {
            decision.reasoning += ` (AI WARNING: Chose an invalid ship ID ${decision.targetId}, idling instead.)`;
            decision.action = 'idle';
        }
        if (decision.action === 'conquer_system' && !unclaimedNullsecSystems.some(s => s.id === parseInt(decision.targetId, 10))) {
            decision.reasoning += ` (AI WARNING: Chose an invalid or already claimed system ID ${decision.targetId}, idling instead.)`;
            decision.action = 'idle';
        }

        return decision;

    } catch (error) {
        console.error(`Gemini Strategic AI Error for ${corp.name}:`, error);
        return {
            action: 'idle',
            targetId: '',
            reasoning: "The CEO is currently unavailable, holding current strategy."
        };
    }
}
