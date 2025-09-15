import type { PlayerState, Skill } from './types';

export const SKILL_DATA: Record<string, Skill> = {
    // Core Skills
    'skill_mining': {
        id: 'skill_mining',
        name: 'Mining',
        description: 'Increases yield from mining lasers.',
        rank: 1,
        effects: [{ type: 'miningYieldBonus', value: 0.05 }] // 5% per level
    },
    'skill_reprocessing': {
        id: 'skill_reprocessing',
        name: 'Reprocessing',
        description: 'Increases material yield from reprocessing ores and items.',
        rank: 2,
        effects: [{ type: 'reprocessingEfficiencyBonus', value: 0.02 }] // 2% per level
    },
    'skill_crafting': {
        id: 'skill_crafting',
        name: 'Industry',
        description: 'Reduces manufacturing time for items.',
        rank: 1,
        effects: [{ type: 'manufacturingTimeBonus', value: -0.04 }] // -4% per level
    },
    // Combat Skills
    'skill_small_projectiles': {
        id: 'skill_small_projectiles',
        name: 'Small Projectile Turrets',
        description: 'Increases damage dealt by small projectile weapons.',
        rank: 1,
        effects: [{ type: 'weaponDamageBonus_projectile_small', value: 0.02 }] // 2% per level
    },
     'skill_small_lasers': {
        id: 'skill_small_lasers',
        name: 'Small Energy Turrets',
        description: 'Increases damage dealt by small energy weapons.',
        rank: 1,
        effects: [{ type: 'weaponDamageBonus_energy_small', value: 0.02 }]
    },
    'skill_small_hybrids': {
        id: 'skill_small_hybrids',
        name: 'Small Hybrid Turrets',
        description: 'Increases damage dealt by small hybrid weapons.',
        rank: 1,
        effects: [{ type: 'weaponDamageBonus_hybrid_small', value: 0.02 }]
    },
    'skill_missiles': {
        id: 'skill_missiles',
        name: 'Missile Launcher Operation',
        description: 'Increases damage of all missile launchers.',
        rank: 2,
        effects: [{ type: 'weaponDamageBonus_missile_small', value: 0.02 }]
    },
    // Drone Skills
    'skill_drone_combat': {
        id: 'skill_drone_combat',
        name: 'Combat Drone Operation',
        description: 'Increases the damage of combat drones.',
        rank: 2,
        effects: [{ type: 'droneDamageBonus', value: 0.05 }] // 5% per level
    },
    'skill_drone_mining': {
        id: 'skill_drone_mining',
        name: 'Mining Drone Operation',
        description: 'Increases the mining yield of mining drones.',
        rank: 2,
        effects: [{ type: 'droneMiningYieldBonus', value: 0.05 }] // 5% per level
    },
    // Ship Support Skills
    'skill_shield_operation': {
        id: 'skill_shield_operation',
        name: 'Shield Operation',
        description: 'Increases the amount of shield restored by shield boosters.',
        rank: 2,
        effects: [{ type: 'shieldBoostBonus', value: 0.05 }] // 5% per level
    },
    'skill_armor_repair': {
        id: 'skill_armor_repair',
        name: 'Armor Repair Systems',
        description: 'Increases the amount of armor repaired by armor repairers.',
        rank: 2,
        effects: [{ type: 'armorRepairBonus', value: 0.05 }] // 5% per level
    },
};

export const MAX_SKILL_LEVEL = 5;

// Formula: 1000 * rank * 2^(level-1) for level > 0
export function getXpForLevel(level: number, rank: number): number {
    if (level <= 0) return 0;
    if (level > MAX_SKILL_LEVEL) return Infinity;
    return 1000 * rank * Math.pow(2, level - 1);
}

/**
 * Adds XP to a specific skill and handles leveling up.
 * @param currentState The current player state.
 * @param skillId The ID of the skill to add XP to.
 * @param xpToAdd The amount of XP to add.
 * @returns The new player state with updated skill XP and level.
 */
export function addSkillXp(
    currentState: PlayerState, 
    skillId: string, 
    xpToAdd: number
): PlayerState {
    const skillDef = SKILL_DATA[skillId];
    if (!skillDef || xpToAdd <= 0) {
        return currentState;
    }

    // Create a deep copy to avoid mutations of the original state
    const newState = JSON.parse(JSON.stringify(currentState));

    // Initialize skill if it doesn't exist
    if (!newState.skills[skillId]) {
        newState.skills[skillId] = { level: 0, xp: 0 };
    }

    let skill = newState.skills[skillId];
    
    // Don't add XP if skill is maxed
    if (skill.level >= MAX_SKILL_LEVEL) {
        return newState;
    }
    
    skill.xp += xpToAdd;
    
    // Loop to handle multiple level-ups from a single XP gain
    while (skill.level < MAX_SKILL_LEVEL) {
        const xpForNext = getXpForLevel(skill.level + 1, skillDef.rank);
        if (skill.xp >= xpForNext) {
            skill.level++;
            skill.xp -= xpForNext;
        } else {
            break; // Not enough XP for the next level
        }
    }
    
    // If max level is reached, cap the XP to 0 for that level.
    if (skill.level >= MAX_SKILL_LEVEL) {
        skill.xp = 0;
    }
    
    return newState;
}