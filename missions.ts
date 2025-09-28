// missions.ts
import type { AgentData, MissionData } from './types';
import { GALAXY_DATA, BLUEPRINT_DATA, getItemData } from './constants';

const getSystemById = (id: number) => GALAXY_DATA.systems.find(s => s.id === id);

// Get a list of all blueprint IDs that are for small things (frigates, small modules)
const smallBlueprintRewards = Object.keys(BLUEPRINT_DATA).filter(id => {
    const bp = BLUEPRINT_DATA[id];
    const item = getItemData(bp.outputItem);
    if (!item) return false;
    if (item.category === 'Ship' && (item.class === 'Frigate' || item.class === 'Destroyer')) {
        return true;
    }
    if (item.category === 'Module' && item.size === 'small') {
        return true;
    }
    return false;
});

// Get a list of all blueprint IDs for medium things (cruisers, medium modules)
const mediumBlueprintRewards = Object.keys(BLUEPRINT_DATA).filter(id => {
    const bp = BLUEPRINT_DATA[id];
    const item = getItemData(bp.outputItem);
    if (!item) return false;
    if (item.category === 'Ship' && (item.class === 'Cruiser' || item.class === 'Battlecruiser' || item.class === 'Mining Barge')) {
        return true;
    }
    if (item.category === 'Module' && item.size === 'medium') {
        return true;
    }
    return false;
});


export function generateCombatMission(agent: AgentData, stationId: string, currentSystemId: number): MissionData | null {
    const nullSecSystems = GALAXY_DATA.systems.filter(s => s.security <= 0.0 && s.id !== currentSystemId);
    if (nullSecSystems.length === 0) return null;

    const targetSystem = nullSecSystems[Math.floor(Math.random() * nullSecSystems.length)];

    const level = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

    let objectiveKey: string;
    let quantity: number;
    let enemyTypeName: string;
    let baseIskReward: number;
    let blueprintRewardId: string | undefined = undefined;

    switch (level) {
        case 2:
            objectiveKey = 'destroy_pirate_medium';
            quantity = Math.floor(Math.random() * 3) + 2; // 2-4
            enemyTypeName = 'medium pirates';
            baseIskReward = 150000 * quantity;
             if (Math.random() < 0.3 && mediumBlueprintRewards.length > 0) { // 30% chance for BP
                blueprintRewardId = mediumBlueprintRewards[Math.floor(Math.random() * mediumBlueprintRewards.length)];
            }
            break;
        case 3:
            objectiveKey = 'destroy_pirate_large';
            quantity = Math.floor(Math.random() * 3) + 1; // 1-3
            enemyTypeName = 'large pirates';
            baseIskReward = 500000 * quantity;
             if (Math.random() < 0.6 && mediumBlueprintRewards.length > 0) { // 60% chance for BP
                blueprintRewardId = mediumBlueprintRewards[Math.floor(Math.random() * mediumBlueprintRewards.length)];
            }
            break;
        case 1:
        default:
            objectiveKey = 'destroy_pirate_small';
            quantity = Math.floor(Math.random() * 3) + 3; // 3-5
            enemyTypeName = 'small pirates';
            baseIskReward = 50000 * quantity;
            if (Math.random() < 0.15 && smallBlueprintRewards.length > 0) { // 15% chance for BP
                blueprintRewardId = smallBlueprintRewards[Math.floor(Math.random() * smallBlueprintRewards.length)];
            }
            break;
    }

    const title = `Combat Op: Eradicate Pirates in ${targetSystem.name}`;
    const description = `Pilot, we have reports of hostile pirate activity in the ${targetSystem.name} system. We need you to go there and eliminate ${quantity} ${enemyTypeName}. This is a dangerous task, but the rewards will be substantial.`;

    const mission: MissionData = {
        id: `${stationId}-combat-${targetSystem.id}-${Date.now()}`,
        agent,
        stationId,
        type: 'combat',
        title,
        description,
        objectives: { [objectiveKey]: quantity },
        rewards: {
            isk: baseIskReward,
        },
        status: 'offered',
        locationSystemId: targetSystem.id,
        progress: {},
    };
    
    if (blueprintRewardId) {
        mission.rewards.items = [{ id: blueprintRewardId, quantity: 1 }];
    }

    return mission;
}