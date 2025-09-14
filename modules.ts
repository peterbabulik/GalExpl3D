// modules.ts
import type { Module, Ammunition, ItemData, Drone } from './types';

export const MODULE_DATA: Record<string, Module> = {
    // ==================== HIGH SLOT MODULES ====================
    
    'mod_125mm_autocannon_i': {
        id: 'mod_125mm_autocannon_i',
        name: '125mm Gatling AutoCannon I',
        category: 'Module',
        subcategory: 'projectile',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 50000,
        description: 'Small projectile turret with high rate of fire.',
        attributes: {
            damage: 8,
            rateOfFire: 2.25,
            optimalRange: 1000,
            falloff: 5000,
            tracking: 0.5,
            powerGridUsage: 4,
            cpuUsage: 8,
            capacitorUsage: 0
        },
        damageType: {
            kinetic: 0.5,
            explosive: 0.5
        },
        requirements: {
            skills: {
                'smallProjectileTurret': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 200,
            'min_mexallon': 50
        }
    },
    'mod_280mm_artillery_i': {
        id: 'mod_280mm_artillery_i',
        name: '280mm Howitzer Artillery I',
        category: 'Module',
        subcategory: 'projectile',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 75000,
        description: 'Small artillery cannon with long range.',
        attributes: {
            damage: 25,
            rateOfFire: 7.5,
            optimalRange: 12000,
            falloff: 9000,
            tracking: 0.12,
            powerGridUsage: 8,
            cpuUsage: 12,
            capacitorUsage: 0
        },
        damageType: {
            kinetic: 0.5,
            explosive: 0.5
        },
        requirements: {
            skills: {
                'smallProjectileTurret': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 1000,
            'min_pyerite': 240,
            'min_mexallon': 60,
            'min_isogen': 8
        }
    },
    'mod_125mm_railgun_i': {
        id: 'mod_125mm_railgun_i',
        name: '125mm Railgun I',
        category: 'Module',
        subcategory: 'hybrid',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 60000,
        description: 'Small railgun for long-range engagements.',
        attributes: {
            damage: 20,
            rateOfFire: 5.0,
            optimalRange: 18000,
            falloff: 6000,
            tracking: 0.08,
            powerGridUsage: 6,
            cpuUsage: 15,
            capacitorUsage: 2
        },
        damageType: {
            kinetic: 0.5,
            thermal: 0.5
        },
        requirements: {
            skills: {
                'smallHybridTurret': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 880,
            'min_pyerite': 220,
            'min_mexallon': 56,
            'min_isogen': 10
        }
    },
    'mod_electron_blaster_i': {
        id: 'mod_electron_blaster_i',
        name: 'Light Electron Blaster I',
        category: 'Module',
        subcategory: 'hybrid',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 55000,
        description: 'Short-range blaster with high damage.',
        attributes: {
            damage: 12,
            rateOfFire: 3.0,
            optimalRange: 1500,
            falloff: 2000,
            tracking: 0.4,
            powerGridUsage: 5,
            cpuUsage: 10,
            capacitorUsage: 1.5
        },
        damageType: {
            kinetic: 0.5,
            thermal: 0.5
        },
        requirements: {
            skills: {
                'smallHybridTurret': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 840,
            'min_pyerite': 208,
            'min_mexallon': 52,
            'min_isogen': 8
        }
    },
    'mod_pulse_laser_i': {
        id: 'mod_pulse_laser_i',
        name: 'Small Focused Pulse Laser I',
        category: 'Module',
        subcategory: 'energy',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 65000,
        description: 'Pulse laser with good damage and tracking.',
        attributes: {
            damage: 10,
            rateOfFire: 3.5,
            optimalRange: 4500,
            falloff: 2000,
            tracking: 0.3,
            powerGridUsage: 7,
            cpuUsage: 8,
            capacitorUsage: 3
        },
        damageType: {
            em: 0.5,
            thermal: 0.5
        },
        requirements: {
            skills: {
                'smallEnergyTurret': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 920,
            'min_pyerite': 232,
            'min_mexallon': 60,
            'min_nocxium': 4
        }
    },
    'mod_rocket_launcher_i': {
        id: 'mod_rocket_launcher_i',
        name: 'Rocket Launcher I',
        category: 'Module',
        subcategory: 'missile',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 45000,
        description: 'Launches unguided rockets at close range.',
        attributes: {
            damage: 15,
            rateOfFire: 4.0,
            missileVelocity: 2250,
            explosionRadius: 20,
            explosionVelocity: 150,
            powerGridUsage: 3,
            cpuUsage: 20,
            capacitorUsage: 0
        },
        damageType: {
            kinetic: 0.25,
            thermal: 0.25,
            explosive: 0.25,
            em: 0.25
        },
        requirements: {
            skills: {
                'rocketLaunchers': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 720,
            'min_pyerite': 180,
            'min_mexallon': 44
        }
    },
    'mod_light_missile_launcher_i': {
        id: 'mod_light_missile_launcher_i',
        name: 'Light Missile Launcher I',
        category: 'Module',
        subcategory: 'missile',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 55000,
        description: 'Launches guided light missiles.',
        attributes: {
            damage: 25,
            rateOfFire: 6.0,
            missileVelocity: 3750,
            explosionRadius: 40,
            explosionVelocity: 170,
            powerGridUsage: 4,
            cpuUsage: 25,
            capacitorUsage: 0
        },
        damageType: {
            kinetic: 0.25,
            thermal: 0.25,
            explosive: 0.25,
            em: 0.25
        },
        requirements: {
            skills: {
                'lightMissiles': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 880,
            'min_pyerite': 220,
            'min_mexallon': 56,
            'min_isogen': 8
        }
    },
    'mod_miner_i': {
        id: 'mod_miner_i',
        name: 'Miner I',
        category: 'Module',
        subcategory: 'mining_laser',
        slot: 'high',
        size: 'small',
        meta: 0,
        basePrice: 30000,
        description: 'Basic mining laser for asteroid mining.',
        attributes: {
            miningYield: 40,
            cycleTime: 60,
            optimalRange: 10000,
            powerGridUsage: 2,
            cpuUsage: 60,
            capacitorUsage: 10
        },
        requirements: {
            skills: {
                'mining': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 600,
            'min_pyerite': 120,
            'min_mexallon': 30
        }
    },
    'mod_miner_ii': {
        id: 'mod_miner_ii',
        name: 'Miner II',
        category: 'Module',
        subcategory: 'mining_laser',
        slot: 'high',
        size: 'small',
        meta: 5,
        basePrice: 500000,
        description: 'Advanced mining laser with improved yield.',
        attributes: {
            miningYield: 60,
            cycleTime: 60,
            optimalRange: 12000,
            powerGridUsage: 4,
            cpuUsage: 80,
            capacitorUsage: 15
        },
        requirements: {
            skills: {
                'mining': 4
            }
        },
        reprocessingYield: {
            'min_tritanium': 4000,
            'min_pyerite': 1000,
            'min_mexallon': 240,
            'min_isogen': 48,
            'min_nocxium': 12
        }
    },
    'mod_strip_miner_i': {
        id: 'mod_strip_miner_i',
        name: 'Strip Miner I',
        category: 'Module',
        subcategory: 'strip_miner',
        slot: 'high',
        size: 'medium',
        meta: 0,
        basePrice: 5000000,
        description: 'Industrial-scale mining laser for barges.',
        attributes: {
            miningYield: 540,
            cycleTime: 180,
            optimalRange: 15000,
            powerGridUsage: 12,
            cpuUsage: 90,
            capacitorUsage: 70
        },
        requirements: {
            skills: {
                'mining': 5,
                'miningBarge': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 40000,
            'min_pyerite': 8000,
            'min_mexallon': 2000,
            'min_isogen': 400,
            'min_nocxium': 100
        }
    },
    
    // ==================== MEDIUM SLOT MODULES ====================
    
    'mod_shield_extender_i': {
        id: 'mod_shield_extender_i',
        name: 'Small Shield Extender I',
        category: 'Module',
        subcategory: 'shield',
        slot: 'medium',
        size: 'small',
        meta: 0,
        basePrice: 40000,
        description: 'Increases maximum shield capacity.',
        attributes: {
            shieldHPBonus: 200,
            signatureRadiusBonus: 3,
            powerGridUsage: 15,
            cpuUsage: 20
        },
        requirements: {
            skills: {
                'shieldUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 720,
            'min_pyerite': 160,
            'min_mexallon': 40,
            'min_isogen': 6
        }
    },
    'mod_shield_booster_i': {
        id: 'mod_shield_booster_i',
        name: 'Small Shield Booster I',
        category: 'Module',
        subcategory: 'shield',
        slot: 'medium',
        size: 'small',
        meta: 0,
        basePrice: 50000,
        description: 'Active shield repair module.',
        attributes: {
            shieldBoostAmount: 25,
            cycleTime: 3,
            capacitorUsage: 10,
            powerGridUsage: 8,
            cpuUsage: 15
        },
        requirements: {
            skills: {
                'shieldOperation': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 180,
            'min_mexallon': 44,
            'min_isogen': 8,
            'min_nocxium': 2
        }
    },
    'mod_invuln_field_i': {
        id: 'mod_invuln_field_i',
        name: 'Adaptive Invulnerability Field I',
        category: 'Module',
        subcategory: 'shield',
        slot: 'medium',
        size: 'all',
        meta: 0,
        basePrice: 100000,
        description: 'Increases shield resistances across all damage types.',
        attributes: {
            shieldResistanceBonus: {
                em: 0.25,
                thermal: 0.25,
                kinetic: 0.25,
                explosive: 0.25
            },
            capacitorUsage: 1,
            powerGridUsage: 1,
            cpuUsage: 30
        },
        requirements: {
            skills: {
                'tacticalShieldManipulation': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 1200,
            'min_pyerite': 300,
            'min_mexallon': 80,
            'min_isogen': 16,
            'min_nocxium': 4
        }
    },
    'mod_1mn_afterburner_i': {
        id: 'mod_1mn_afterburner_i',
        name: '1MN Afterburner I',
        category: 'Module',
        subcategory: 'afterburner',
        slot: 'medium',
        size: 'small',
        meta: 0,
        basePrice: 35000,
        description: 'Increases ship velocity.',
        attributes: {
            velocityBonus: 1.5,
            capacitorUsage: 10,
            cycleTime: 10,
            powerGridUsage: 10,
            cpuUsage: 15
        },
        requirements: {
            skills: {
                'afterburner': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 640,
            'min_pyerite': 140,
            'min_mexallon': 36,
            'min_isogen': 4
        }
    },
    'mod_1mn_mwd_i': {
        id: 'mod_1mn_mwd_i',
        name: '1MN Microwarpdrive I',
        category: 'Module',
        subcategory: 'microwarpdrive',
        slot: 'medium',
        size: 'small',
        meta: 0,
        basePrice: 150000,
        description: 'Greatly increases velocity but increases signature.',
        attributes: {
            velocityBonus: 5.0,
            signatureRadiusBonus: 5.0,
            capacitorUsage: 30,
            cycleTime: 10,
            powerGridUsage: 25,
            cpuUsage: 20
        },
        requirements: {
            skills: {
                'highSpeedManeuvering': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 2000,
            'min_pyerite': 400,
            'min_mexallon': 100,
            'min_isogen': 20,
            'min_nocxium': 4
        }
    },
    'mod_warp_scrambler_i': {
        id: 'mod_warp_scrambler_i',
        name: 'Warp Scrambler I',
        category: 'Module',
        subcategory: 'tackle',
        slot: 'medium',
        size: 'all',
        meta: 0,
        basePrice: 80000,
        description: 'Prevents target from warping.',
        attributes: {
            warpScramblerStrength: 2,
            optimalRange: 7500,
            capacitorUsage: 5,
            powerGridUsage: 1,
            cpuUsage: 35
        },
        requirements: {
            skills: {
                'propulsionJamming': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 1000,
            'min_pyerite': 240,
            'min_mexallon': 60,
            'min_isogen': 12,
            'min_nocxium': 2
        }
    },
    'mod_stasis_web_i': {
        id: 'mod_stasis_web_i',
        name: 'Stasis Webifier I',
        category: 'Module',
        subcategory: 'tackle',
        slot: 'medium',
        size: 'all',
        meta: 0,
        basePrice: 60000,
        description: 'Reduces target velocity.',
        attributes: {
            velocityReduction: 0.5,
            optimalRange: 10000,
            capacitorUsage: 5,
            powerGridUsage: 1,
            cpuUsage: 30
        },
        requirements: {
            skills: {
                'propulsionJamming': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 880,
            'min_pyerite': 220,
            'min_mexallon': 56,
            'min_isogen': 10
        }
    },
    
    // ==================== LOW SLOT MODULES ====================
    'mod_drone_bay_s': {
        id: 'mod_drone_bay_s',
        name: 'Small Drone Launching Bay',
        category: 'Module',
        subcategory: 'drone_bay',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 250000,
        description: 'A bay that allows for the deployment and control of small drones.',
        attributes: {
            powerGridUsage: 10,
            cpuUsage: 25,
        },
        requirements: {
            skills: {}
        },
        reprocessingYield: {
            'min_tritanium': 3200,
            'min_pyerite': 800,
            'min_mexallon': 200,
            'min_isogen': 40
        }
    },
    'mod_200mm_plates_i': {
        id: 'mod_200mm_plates_i',
        name: '200mm Steel Plates I',
        category: 'Module',
        subcategory: 'armor',
        slot: 'low',
        size: 'small',
        meta: 0,
        basePrice: 30000,
        description: 'Increases armor hit points.',
        attributes: {
            armorHPBonus: 300,
            massAddition: 50000,
            powerGridUsage: 10,
            cpuUsage: 10
        },
        requirements: {
            skills: {
                'hullUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 600,
            'min_pyerite': 140,
            'min_mexallon': 32
        }
    },
    'mod_armor_repairer_i': {
        id: 'mod_armor_repairer_i',
        name: 'Small Armor Repairer I',
        category: 'Module',
        subcategory: 'armor',
        slot: 'low',
        size: 'small',
        meta: 0,
        basePrice: 45000,
        description: 'Repairs armor damage.',
        attributes: {
            armorRepairAmount: 30,
            cycleTime: 5,
            capacitorUsage: 20,
            powerGridUsage: 3,
            cpuUsage: 5
        },
        requirements: {
            skills: {
                'repairSystems': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 720,
            'min_pyerite': 180,
            'min_mexallon': 44,
            'min_isogen': 4
        }
    },
    'mod_adaptive_plating_i': {
        id: 'mod_adaptive_plating_i',
        name: 'Adaptive Nano Plating I',
        category: 'Module',
        subcategory: 'armor',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 70000,
        description: 'Increases armor resistances.',
        attributes: {
            armorResistanceBonus: {
                em: 0.15,
                thermal: 0.15,
                kinetic: 0.15,
                explosive: 0.15
            },
            powerGridUsage: 1,
            cpuUsage: 20
        },
        requirements: {
            skills: {
                'hullUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 880,
            'min_pyerite': 220,
            'min_mexallon': 56,
            'min_isogen': 12,
            'min_nocxium': 2
        }
    },
    'mod_gyrostabilizer_i': {
        id: 'mod_gyrostabilizer_i',
        name: 'Gyrostabilizer I',
        category: 'Module',
        subcategory: 'weapon_upgrade',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 50000,
        description: 'Increases projectile weapon damage and rate of fire.',
        attributes: {
            projectileDamageBonus: 0.1,
            projectileROFBonus: -0.05,
            powerGridUsage: 1,
            cpuUsage: 15
        },
        requirements: {
            skills: {
                'weaponUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 200,
            'min_mexallon': 50
        }
    },
    'mod_magstab_i': {
        id: 'mod_magstab_i',
        name: 'Magnetic Field Stabilizer I',
        category: 'Module',
        subcategory: 'weapon_upgrade',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 50000,
        description: 'Increases hybrid weapon damage and rate of fire.',
        attributes: {
            hybridDamageBonus: 0.1,
            hybridROFBonus: -0.05,
            powerGridUsage: 1,
            cpuUsage: 20
        },
        requirements: {
            skills: {
                'weaponUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 200,
            'min_mexallon': 50,
            'min_isogen': 4
        }
    },
    'mod_heat_sink_i': {
        id: 'mod_heat_sink_i',
        name: 'Heat Sink I',
        category: 'Module',
        subcategory: 'weapon_upgrade',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 50000,
        description: 'Increases energy weapon damage and rate of fire.',
        attributes: {
            energyDamageBonus: 0.1,
            energyROFBonus: -0.05,
            powerGridUsage: 1,
            cpuUsage: 18
        },
        requirements: {
            skills: {
                'weaponUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 200,
            'min_mexallon': 50,
            'min_nocxium': 2
        }
    },
    'mod_bcs_i': {
        id: 'mod_bcs_i',
        name: 'Ballistic Control System I',
        category: 'Module',
        subcategory: 'weapon_upgrade',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 55000,
        description: 'Increases missile damage and rate of fire.',
        attributes: {
            missileDamageBonus: 0.1,
            missileROFBonus: -0.05,
            powerGridUsage: 1,
            cpuUsage: 25
        },
        requirements: {
            skills: {
                'weaponUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 840,
            'min_pyerite': 208,
            'min_mexallon': 52,
            'min_isogen': 6
        }
    },
    'mod_pds_i': {
        id: 'mod_pds_i',
        name: 'Power Diagnostic System I',
        category: 'Module',
        subcategory: 'capacitor',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 40000,
        description: 'Increases powergrid, CPU, capacitor, and shields.',
        attributes: {
            powerGridBonus: 0.05,
            cpuBonus: 0.05,
            capacitorBonus: 0.05,
            shieldBonus: 0.05,
            powerGridUsage: 1,
            cpuUsage: 15
        },
        requirements: {
            skills: {
                'engineering': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 680,
            'min_pyerite': 160,
            'min_mexallon': 40,
            'min_isogen': 4
        }
    },
    'mod_cap_relay_i': {
        id: 'mod_cap_relay_i',
        name: 'Capacitor Power Relay I',
        category: 'Module',
        subcategory: 'capacitor',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 35000,
        description: 'Increases capacitor recharge rate.',
        attributes: {
            capacitorRechargeBonus: 0.2,
            shieldBoostAmountPenalty: -0.1,
            powerGridUsage: 1,
            cpuUsage: 10
        },
        requirements: {
            skills: {
                'energyGridUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 640,
            'min_pyerite': 152,
            'min_mexallon': 36
        }
    },
    'mod_mlu_i': {
        id: 'mod_mlu_i',
        name: 'Mining Laser Upgrade I',
        category: 'Module',
        subcategory: 'mining_upgrade',
        slot: 'low',
        size: 'all',
        meta: 0,
        basePrice: 100000,
        description: 'Increases mining laser yield.',
        attributes: {
            miningYieldBonus: 0.05,
            cpuPenalty: 0.1,
            powerGridUsage: 1,
            cpuUsage: 30
        },
        requirements: {
            skills: {
                'miningUpgrades': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 1200,
            'min_pyerite': 300,
            'min_mexallon': 80,
            'min_isogen': 8,
            'min_nocxium': 2
        }
    },
    
    // ==================== RIG SLOT MODULES ====================
    
    'mod_cdfe_rig_i': {
        id: 'mod_cdfe_rig_i',
        name: 'Small Core Defense Field Extender I',
        category: 'Module',
        subcategory: 'shield_rig',
        slot: 'rig',
        size: 'small',
        meta: 0,
        basePrice: 500000,
        description: 'Increases shield hit points.',
        attributes: {
            shieldHPBonus: 0.15,
            signatureRadiusPenalty: 0.1,
            calibrationCost: 50
        },
        requirements: {
            skills: {
                'shieldRigging': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 10000,
            'min_pyerite': 2400,
            'min_mexallon': 600,
            'min_isogen': 120,
            'min_nocxium': 30
        }
    },
    'mod_trimark_rig_i': {
        id: 'mod_trimark_rig_i',
        name: 'Small Trimark Armor Pump I',
        category: 'Module',
        subcategory: 'armor_rig',
        slot: 'rig',
        size: 'small',
        meta: 0,
        basePrice: 500000,
        description: 'Increases armor hit points.',
        attributes: {
            armorHPBonus: 0.15,
            velocityPenalty: -0.1,
            calibrationCost: 50
        },
        requirements: {
            skills: {
                'armorRigging': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 11200,
            'min_pyerite': 2800,
            'min_mexallon': 720,
            'min_isogen': 20
        }
    },
    'mod_aux_thrusters_rig_i': {
        id: 'mod_aux_thrusters_rig_i',
        name: 'Small Auxiliary Thrusters I',
        category: 'Module',
        subcategory: 'navigation_rig',
        slot: 'rig',
        size: 'small',
        meta: 0,
        basePrice: 400000,
        description: 'Increases ship velocity.',
        attributes: {
            velocityBonus: 0.1,
            armorHPPenalty: -0.1,
            calibrationCost: 50
        },
        requirements: {
            skills: {
                'astronauticsRigging': 1
            }
        },
        reprocessingYield: {
            'min_tritanium': 8800,
            'min_pyerite': 2200,
            'min_mexallon': 560,
            'min_isogen': 100
        }
    }
};

const AMMUNITION_DATA: Record<string, Ammunition> = {
    'ammo_fusion_s': {
        id: 'ammo_fusion_s',
        name: 'Fusion S',
        category: 'Ammunition',
        type: 'projectile',
        size: 'small',
        basePrice: 10,
        damageModifier: 1.0,
        rangeModifier: 0.5,
        damageType: {
            explosive: 0.9,
            kinetic: 0.1
        },
        reprocessingYield: {
            'min_tritanium': 0.4,
            'min_pyerite': 0.08
        }
    },
    'ammo_phased_plasma_s': {
        id: 'ammo_phased_plasma_s',
        name: 'Phased Plasma S',
        category: 'Ammunition',
        type: 'projectile',
        size: 'small',
        basePrice: 15,
        damageModifier: 1.1,
        rangeModifier: 0.375,
        damageType: {
            thermal: 0.8,
            kinetic: 0.2
        },
        reprocessingYield: {
            'min_tritanium': 0.4,
            'min_pyerite': 0.08
        }
    },
    'ammo_antimatter_s': {
        id: 'ammo_antimatter_s',
        name: 'Antimatter Charge S',
        category: 'Ammunition',
        type: 'hybrid',
        size: 'small',
        basePrice: 20,
        damageModifier: 1.5,
        rangeModifier: 0.5,
        damageType: {
            kinetic: 0.5,
            thermal: 0.5
        },
        reprocessingYield: {
            'min_tritanium': 0.6,
            'min_pyerite': 0.12,
            'min_mexallon': 0.02
        }
    },
    'ammo_iron_s': {
        id: 'ammo_iron_s',
        name: 'Iron Charge S',
        category: 'Ammunition',
        type: 'hybrid',
        size: 'small',
        basePrice: 10,
        damageModifier: 0.8,
        rangeModifier: 1.6,
        damageType: {
            kinetic: 0.5,
            thermal: 0.5
        },
        reprocessingYield: {
            'min_tritanium': 0.6,
            'min_pyerite': 0.12,
            'min_mexallon': 0.02
        }
    },
    'crystal_multifrequency_s': {
        id: 'crystal_multifrequency_s',
        name: 'Multifrequency S',
        category: 'Ammunition',
        type: 'frequency_crystal',
        size: 'small',
        basePrice: 1000,
        damageModifier: 1.5,
        rangeModifier: 0.5,
        damageType: {
            em: 0.5,
            thermal: 0.5
        },
        durability: 1000
        // No reprocessing yield for crystals
    },
    'missile_scourge_rocket': {
        id: 'missile_scourge_rocket',
        name: 'Scourge Rocket',
        category: 'Ammunition',
        type: 'rocket',
        size: 'small',
        basePrice: 15,
        damage: 25,
        damageType: {
            kinetic: 1.0
        },
        reprocessingYield: {
            'min_tritanium': 0.48,
            'min_pyerite': 0.1,
            'min_mexallon': 0.032,
            'min_isogen': 0.008
        }
    },
    'missile_inferno_light': {
        id: 'missile_inferno_light',
        name: 'Inferno Light Missile',
        category: 'Ammunition',
        type: 'light_missile',
        size: 'small',
        basePrice: 25,
        damage: 40,
        damageType: {
            thermal: 1.0
        },
        reprocessingYield: {
            'min_tritanium': 0.48,
            'min_pyerite': 0.1,
            'min_mexallon': 0.032,
            'min_isogen': 0.008
        }
    }
};

const DRONE_DATA: Record<string, Drone> = {
    'drone_combat_s_i': {
        id: 'drone_combat_s_i',
        name: 'Small Combat Drone I',
        category: 'Drone',
        size: 'small',
        basePrice: 15000,
        volume: 5,
        description: 'A basic small combat drone.',
        attributes: {
            hp: 50,
            damage: 5, // DPS
            speed: 500,
            orbitDistance: 1000,
            bandwidthUsage: 5,
        },
        reprocessingYield: {
            'min_tritanium': 800,
            'min_pyerite': 200,
            'min_mexallon': 48,
            'min_isogen': 9,
            'min_nocxium': 2
        }
    },
    'drone_mining_s_i': {
        id: 'drone_mining_s_i',
        name: 'Mining Drone I',
        category: 'Drone',
        size: 'small',
        basePrice: 20000,
        volume: 5,
        description: 'A basic small drone equipped with a mining laser.',
        attributes: {
            hp: 40,
            damage: 0,
            miningYield: 15, // m3 per cycle
            cycleTime: 5,
            speed: 400,
            orbitDistance: 1000,
            bandwidthUsage: 5,
        },
        reprocessingYield: {
            'min_tritanium': 960,
            'min_pyerite': 240,
            'min_mexallon': 40,
            'min_isogen': 12,
            'min_nocxium': 2
        }
    },
};

// FIX: Combine and export AMMUNITION_DATA and DRONE_DATA as OTHER_ITEM_DATA to be used in constants.ts.
export const OTHER_ITEM_DATA: Record<string, Ammunition | Drone> = {
    ...AMMUNITION_DATA,
    ...DRONE_DATA,
};