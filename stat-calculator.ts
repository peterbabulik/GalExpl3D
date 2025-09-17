// stat-calculator.ts
import type { Ship, Module } from './types';

export interface CalculatedStats {
    maxVelocity: number;
    capacitor: {
        capacity: number;
        rechargeRate: number;
        rechargeTime: number;
    };
    defenses: {
        shield: { hp: number; em: number; thermal: number; kinetic: number; explosive: number; };
        armor: { hp: number; em: number; thermal: number; kinetic: number; explosive: number; };
        hull: { hp: number; em: number; thermal: number; kinetic: number; explosive: number; };
    };
}

export function calculateShipStats(ship: Ship, fittedModules: Module[], activeModuleSlots: string[] = []): CalculatedStats {
    // --- Initial State ---
    const stats: CalculatedStats = {
        maxVelocity: ship.attributes.speed,
        capacitor: {
            capacity: ship.attributes.capacitor,
            rechargeRate: ship.attributes.capacitorRechargeRate,
            rechargeTime: 0,
        },
        defenses: {
            shield: { hp: ship.attributes.shield, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
            armor: { hp: ship.attributes.armor, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
            hull: { hp: ship.attributes.hull, em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        },
    };

    let capacitorCapacityMultiplier = 1.0;
    let capacitorRechargeTimeFactor = 1.0;
    
    // --- Stacking Penalty Setup ---
    const stackingPenaltyModulesApplied: Record<string, number> = {};
    
    const getStackingPenaltyKey = (module: Module): string => {
        // Groups modules by removing meta-level suffixes (e.g., _i, _ii) from the ID.
        // This makes 'mod_miner_i' and 'mod_miner_ii' share the same key 'mod_miner_'.
        return module.id.replace(/_[i_v]+$/, '_');
    };

    const getStackingEffectiveness = (penaltyKey: string): number => {
        const count = stackingPenaltyModulesApplied[penaltyKey] || 0;
        // Simplified EVE Online stacking penalty formula.
        // N-th module effectiveness: 1, 0.869, 0.571, 0.283, 0.106
        const effectiveness = [1, 0.869, 0.571, 0.283, 0.106][count] || 0.05;
        stackingPenaltyModulesApplied[penaltyKey] = count + 1;
        return effectiveness;
    };

    // Sort modules by ID to group them for consistent penalty application
    const sortedModules = [...fittedModules].sort((a, b) => a.id.localeCompare(b.id));

    // --- Apply Module Effects ---
    sortedModules.forEach(module => {
        const attrs = module.attributes;
        const penaltyKey = getStackingPenaltyKey(module);
        const effectiveness = getStackingEffectiveness(penaltyKey);

        // --- Defense Bonuses (Stacking Penalty Applied) ---
        if (attrs.shieldHPBonus) {
            // Differentiate between flat and percentage bonuses, similar to armorHPBonus.
            if (attrs.shieldHPBonus > 1) { // Flat bonus
                stats.defenses.shield.hp += attrs.shieldHPBonus * effectiveness;
            } else { // Percentage bonus
                stats.defenses.shield.hp *= (1 + (attrs.shieldHPBonus * effectiveness));
            }
        }
        if (attrs.shieldBonus) {
            stats.defenses.shield.hp *= (1 + (attrs.shieldBonus * effectiveness));
        }
        if (attrs.armorHPBonus) {
            if (attrs.armorHPBonus > 1) { // Flat HP bonus from plates
                stats.defenses.armor.hp += attrs.armorHPBonus * effectiveness;
            } else { // Percentage bonus from rigs/modules
                stats.defenses.armor.hp *= (1 + (attrs.armorHPBonus * effectiveness));
            }
        }
        if (attrs.armorHPPenalty) {
            stats.defenses.armor.hp *= (1 + (attrs.armorHPPenalty * effectiveness));
        }
        if (attrs.shieldResistanceBonus) {
            Object.keys(attrs.shieldResistanceBonus).forEach(dmgType => {
                const key = dmgType as keyof typeof stats.defenses.shield;
                if (key !== 'hp') {
                    const bonus = attrs.shieldResistanceBonus[dmgType] * effectiveness;
                    stats.defenses.shield[key] = 1 - (1 - stats.defenses.shield[key]) * (1 - bonus);
                }
            });
        }
        if (attrs.armorResistanceBonus) {
            Object.keys(attrs.armorResistanceBonus).forEach(dmgType => {
                const key = dmgType as keyof typeof stats.defenses.armor;
                if (key !== 'hp') {
                    const bonus = attrs.armorResistanceBonus[dmgType] * effectiveness;
                    stats.defenses.armor[key] = 1 - (1 - stats.defenses.armor[key]) * (1 - bonus);
                }
            });
        }
        
        // --- Navigation ---
        if (attrs.velocityPenalty) {
            stats.maxVelocity *= (1 + (attrs.velocityPenalty * effectiveness));
        }
        if (attrs.velocityBonus) {
            // For testing, we assume activatable modules are active
            if (module.subcategory === 'afterburner' || module.subcategory === 'microwarpdrive') {
                stats.maxVelocity *= attrs.velocityBonus;
            } else { // Passive bonuses (e.g., from rigs) are percentages
                stats.maxVelocity *= (1 + (attrs.velocityBonus * effectiveness));
            }
        }
        
        // --- Capacitor (No Stacking Penalty) ---
        if (attrs.capacitorBonus) capacitorCapacityMultiplier += attrs.capacitorBonus;
        if (attrs.capacitorRechargeBonus) capacitorRechargeTimeFactor *= (1 - attrs.capacitorRechargeBonus);
    });

    // --- Final Calculations ---
    stats.capacitor.capacity *= capacitorCapacityMultiplier;
    const baseRechargeTime = ship.attributes.capacitor / ship.attributes.capacitorRechargeRate;
    const modifiedRechargeTime = baseRechargeTime * capacitorRechargeTimeFactor;
    stats.capacitor.rechargeTime = modifiedRechargeTime;
    if (modifiedRechargeTime > 0) {
        stats.capacitor.rechargeRate = stats.capacitor.capacity / modifiedRechargeTime;
    } else {
        stats.capacitor.rechargeRate = Infinity;
    }

    // BUG FIX: Clamp final velocity to be >= 0
    stats.maxVelocity = Math.max(0, stats.maxVelocity);

    return stats;
}