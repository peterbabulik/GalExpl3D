// stat-calculator.ts
import type { Ship, Module, PlayerState } from './types';
import { getItemData } from './constants';
import { SKILL_DATA } from './skills';

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
    offense: {
        dps: number;
        alphaDamage: number;
        damageMultipliers: Record<string, number>;
        rofMultipliers: Record<string, number>;
    };
    activeModules: {
        name: string;
        bonuses: Record<string, string>;
    }[];
}

// Helper to format bonus names for display
const formatBonusName = (key: string): string => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/Bonus|Amount|Penalty|Reduction|RateOfFire|ROF/gi, '')
        .replace(/_/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Helper to format bonus values for display
const formatBonusValue = (key: string, value: any): string => {
    if (typeof value === 'number') {
        if (key.toLowerCase().includes('rofbonus') || key.toLowerCase().includes('duration')) {
             return `${(value * -100).toFixed(0)}% Faster`;
        }
        if (Math.abs(value) < 1 && value !== 0) {
            const prefix = value > 0 ? '+' : '';
            return `${prefix}${(value * 100).toFixed(0)}%`;
        }
        return `+${value.toLocaleString()}`;
    }
    if (typeof value === 'object' && value !== null) {
        const values = Object.values(value) as number[];
        if (values.every(v => v === values[0])) {
            const prefix = values[0] > 0 ? '+' : '';
            return `${prefix}${(values[0] * 100).toFixed(0)}% to All`;
        }
        return 'Complex Bonus';
    }
    return String(value);
};

// Helper to determine if a module provides its bonus passively or requires activation.
export const isModulePassive = (module: Module): boolean => {
    if (module.slot === 'rig') return true;
    if (module.id === 'mod_drone_bay_s') return true;

    // Weapon/Mining upgrades and passive armor/shield modules are passive.
    const passiveSubcategories = [
        'weapon_upgrade', 'mining_upgrade', 'shield_extender', 'plates'
    ];
    if (passiveSubcategories.includes(module.subcategory)) {
        return true;
    }

    // A module is active if it has a cycle time or capacitor usage defined.
    if (module.attributes.cycleTime || module.attributes.capacitorUsage) {
        return false;
    }

    // Fallback: If it affects core stats without activation cost, it's passive.
    const passiveBonusKeys = ['powerGridBonus', 'cpuBonus', 'shieldHPBonus', 'armorHPBonus'];
    if (passiveBonusKeys.some(key => key in module.attributes)) {
        return true;
    }

    return false;
};

const bonusTypeToDamageCategory: Record<string, 'projectile' | 'hybrid' | 'energy' | 'missile'> = {
    projectileDamage: 'projectile',
    projectileRateOfFire: 'projectile',
    hybridDamage: 'hybrid',
    laserDamage: 'energy', // From Punisher
    energyDamage: 'energy', // From Heat Sink
    missileDamage: 'missile',
    projectileDamageBonus: 'projectile',
    projectileROFBonus: 'projectile',
    hybridDamageBonus: 'hybrid',
    hybridROFBonus: 'hybrid',
    energyDamageBonus: 'energy',
    energyROFBonus: 'energy',
    missileDamageBonus: 'missile',
    missileROFBonus: 'missile',
};

export function calculateShipStats(ship: Ship, fitting: PlayerState['currentShipFitting'], skills: PlayerState['skills'], activeModuleSlots: string[] = []): CalculatedStats {
    const fittedModules: Module[] = Object.values(fitting)
        .flat()
        .map(id => id ? getItemData(id) as Module : null)
        .filter((m): m is Module => m !== null);

    // --- Initial State ---
    const stats: any = { // Use 'any' temporarily to build up the object
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
        activeModules: [],
    };

    let capacitorCapacityMultiplier = 1.0;
    let capacitorRechargeTimeFactor = 1.0;
    
    // Weapon multipliers
    const damageMultipliers = { projectile: 1.0, hybrid: 1.0, energy: 1.0, missile: 1.0 };
    const rofMultipliers = { projectile: 1.0, hybrid: 1.0, energy: 1.0, missile: 1.0 };

    // --- Stacking Penalty Setup ---
    const stackingPenaltyModulesApplied: Record<string, number> = {};
    const getStackingPenaltyKey = (module: Module, attribute: string): string => {
        const baseId = module.id.replace(/_[i_v]+$/, '_');
        return `${baseId}_${attribute}`;
    };
    const getStackingEffectiveness = (penaltyKey: string): number => {
        const count = stackingPenaltyModulesApplied[penaltyKey] || 0;
        const effectiveness = [1, 0.869, 0.571, 0.283, 0.106][count] || 0.05;
        stackingPenaltyModulesApplied[penaltyKey] = count + 1;
        return effectiveness;
    };
    
    // --- Apply Ship Bonuses from Skills ---
    const primaryShipSkill = Object.keys(ship.requirements.skills)[0];
    const shipSkillLevel = primaryShipSkill ? (skills[primaryShipSkill]?.level || 0) : 0;
    
    ship.bonuses.forEach(bonus => {
        if (bonus.perLevel) {
            const category = bonusTypeToDamageCategory[bonus.type];
            if (category) {
                if (bonus.type.toLowerCase().includes('damage')) {
                    damageMultipliers[category] += (bonus.value / 100) * shipSkillLevel;
                } else if (bonus.type.toLowerCase().includes('rateoffire')) {
                    rofMultipliers[category] *= (1 + (bonus.value / 100))**shipSkillLevel; // Assuming multiplicative
                }
            }
        }
    });

    // --- Apply Global Skill Effects ---
    Object.entries(skills).forEach(([skillId, playerSkill]) => {
        const skillDef = SKILL_DATA[skillId];
        if (skillDef) {
            skillDef.effects.forEach(effect => {
                if (effect.type.startsWith('weaponDamageBonus_')) {
                    const category = effect.type.split('_')[1] as keyof typeof damageMultipliers;
                    if (damageMultipliers[category]) {
                        damageMultipliers[category] += effect.value * playerSkill.level;
                    }
                }
            });
        }
    });

    const onlineModules = fittedModules.filter(m => isModulePassive(m) || activeModuleSlots.some(s => {
        const [slotType, slotIndexStr] = s.split('-');
        return fitting[slotType as keyof typeof fitting]?.[parseInt(slotIndexStr)] === m.id;
    }));

    // --- Apply Module Effects ---
    onlineModules.forEach(module => {
        const attrs = module.attributes;
        for (const attrKey in attrs) {
            const category = bonusTypeToDamageCategory[attrKey];
            if (category) {
                const penaltyKey = getStackingPenaltyKey(module, attrKey);
                const effectiveness = getStackingEffectiveness(penaltyKey);
                const value = attrs[attrKey];
                
                if (attrKey.toLowerCase().includes('damage')) {
                    damageMultipliers[category] += value * effectiveness;
                } else if (attrKey.toLowerCase().includes('rof')) {
                     rofMultipliers[category] *= (1 + (value * effectiveness));
                }
            }
        }
    });
    
    // Separate loop for non-weapon-offense bonuses to keep logic clean
    const activeStackingMap = { ...stackingPenaltyModulesApplied };
    const getActiveStackingEffectiveness = (penaltyKey: string): number => {
        const count = activeStackingMap[penaltyKey] || 0;
        const effectiveness = [1, 0.869, 0.571, 0.283, 0.106][count] || 0.05;
        activeStackingMap[penaltyKey] = count + 1;
        return effectiveness;
    };
    
    const processedModulesForDisplay = new Set<string>();
    const activeModulesList: { name: string; bonuses: Record<string, string> }[] = [];

    fittedModules.forEach(module => {
        const isPassive = isModulePassive(module);
        const moduleIsActive = !isPassive && activeModuleSlots.some(s => {
            const [slotType, slotIndexStr] = s.split('-');
            return fitting[slotType as keyof typeof fitting]?.[parseInt(slotIndexStr)] === module.id;
        });

        if (!isPassive && !moduleIsActive) return;

        const attrs = module.attributes;

        if (attrs.shieldHPBonus) {
             const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'shieldHPBonus'));
            if (attrs.shieldHPBonus > 1) stats.defenses.shield.hp += attrs.shieldHPBonus * effectiveness;
            else stats.defenses.shield.hp *= (1 + (attrs.shieldHPBonus * effectiveness));
        }
        if (attrs.armorHPBonus) {
            const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'armorHPBonus'));
            if (attrs.armorHPBonus > 1) stats.defenses.armor.hp += attrs.armorHPBonus * effectiveness;
            else stats.defenses.armor.hp *= (1 + (attrs.armorHPBonus * effectiveness));
        }
        if (attrs.velocityBonus) {
            if (module.subcategory === 'afterburner' || module.subcategory === 'microwarpdrive') {
                 if (moduleIsActive) stats.maxVelocity *= attrs.velocityBonus;
            } else {
                 const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'velocityBonus'));
                 stats.maxVelocity *= (1 + (attrs.velocityBonus * effectiveness));
            }
        }
        
        const applyThisModule = isPassive || moduleIsActive;
        if (applyThisModule) {
            if (attrs.shieldBonus) {
                const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'shieldBonus'));
                stats.defenses.shield.hp *= (1 + (attrs.shieldBonus * effectiveness));
            }
            if (attrs.capacitorBonus) {
                const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'capacitorBonus'));
                capacitorCapacityMultiplier += (attrs.capacitorBonus * effectiveness);
            }
            if (attrs.capacitorRechargeBonus) {
                const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'capacitorRechargeBonus'));
                capacitorRechargeTimeFactor *= (1 - (attrs.capacitorRechargeBonus * effectiveness));
            }
            if (attrs.shieldResistanceBonus) {
                 const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'shieldResistanceBonus'));
                Object.keys(attrs.shieldResistanceBonus).forEach(dmgType => {
                    const key = dmgType as keyof typeof stats.defenses.shield;
                    if (key !== 'hp') {
                        const bonus = attrs.shieldResistanceBonus[dmgType] * effectiveness;
                        stats.defenses.shield[key] = 1 - (1 - stats.defenses.shield[key]) * (1 - bonus);
                    }
                });
            }
            if (attrs.armorResistanceBonus) {
                 const effectiveness = getActiveStackingEffectiveness(getStackingPenaltyKey(module, 'armorResistanceBonus'));
                 Object.keys(attrs.armorResistanceBonus).forEach(dmgType => {
                    const key = dmgType as keyof typeof stats.defenses.armor;
                    if (key !== 'hp') {
                        const bonus = attrs.armorResistanceBonus[dmgType] * effectiveness;
                        stats.defenses.armor[key] = 1 - (1 - stats.defenses.armor[key]) * (1 - bonus);
                    }
                });
            }
        }

        // Build display list
        if (moduleIsActive && !processedModulesForDisplay.has(module.name)) {
            const bonuses: Record<string, string> = {};
            for (const attrKey in module.attributes) {
                const keyLower = attrKey.toLowerCase();
                if (keyLower.includes('bonus') || keyLower.includes('amount') || keyLower.includes('penalty') || keyLower.includes('reduction') || keyLower.includes('rof')) {
                     const value = module.attributes[attrKey];
                     if ((typeof value === 'number' && value === 0) || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) continue;
                     bonuses[formatBonusName(attrKey)] = formatBonusValue(attrKey, value);
                }
            }
            if (Object.keys(bonuses).length > 0) {
                activeModulesList.push({ name: module.name, bonuses });
                processedModulesForDisplay.add(module.name);
            }
        }
    });

    stats.activeModules = activeModulesList;

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

    // --- Calculate Offense ---
    const offense = { dps: 0, alphaDamage: 0 };
    fitting.high.forEach(moduleId => {
        if (!moduleId) return;
        const module = getItemData(moduleId) as Module;
        const weaponCategory = module.subcategory as 'projectile' | 'hybrid' | 'energy' | 'missile';
        
        if (['projectile', 'hybrid', 'energy', 'missile'].includes(weaponCategory)) {
            const baseDamage = module.attributes.damage || 0;
            const baseROF = module.attributes.rateOfFire || 1;
            
            const finalDamage = baseDamage * damageMultipliers[weaponCategory];
            const finalROF = baseROF * rofMultipliers[weaponCategory];
            
            if (finalROF > 0) {
                offense.dps += finalDamage / finalROF;
            }
            offense.alphaDamage += finalDamage;
        }
    });

    stats.offense = {
        ...offense,
        damageMultipliers,
        rofMultipliers
    };
    stats.maxVelocity = Math.max(0, stats.maxVelocity);

    return stats as CalculatedStats;
}
