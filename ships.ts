


import type { Ship, ShipClass, ShipSkill } from './types';

// Ship Data - EVE Online Inspired
// Galaxy Explorer Game

export const ShipData: Record<string, Ship> = {
    // ==================== FRIGATES ====================
    // Small, fast, agile ships - good for beginners
    
    // Civilian
    'ship_rookie': {
        id: 'ship_rookie',
        name: 'Rookie Ship',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Frigate',
        race: 'Civilian',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 0, // Free starter ship
        description: 'Basic civilian vessel provided free by insurance.',
        attributes: {
            hull: 350,
            armor: 350,
            shield: 350,
            capacitor: 250,
            powerGrid: 37,
            cpu: 125,
            speed: 300,
            agility: 3.5,
            warpSpeed: 5.0,
            cargoCapacity: 100,
            droneBandwidth: 0,
            droneBay: 5
        },
        slots: {
            high: 2,
            medium: 2,
            low: 1,
            rig: 0
        },
        bonuses: [],
        requirements: {
            skills: {}
        }
    },
    
    // Combat Frigates
    'ship_rifter': {
        id: 'ship_rifter',
        name: 'Rifter',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Frigate',
        race: 'Minmatar',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 500000,
        description: 'Fast attack frigate with excellent speed and agility.',
        attributes: {
            hull: 450,
            armor: 400,
            shield: 450,
            capacitor: 275,
            powerGrid: 45,
            cpu: 150,
            speed: 365,
            agility: 3.19,
            warpSpeed: 5.0,
            cargoCapacity: 140,
            droneBandwidth: 0,
            droneBay: 0
        },
        slots: {
            high: 4,
            medium: 3,
            low: 3,
            rig: 3
        },
        bonuses: [
            { type: 'projectileDamage', value: 5, perLevel: true },
            { type: 'projectileTracking', value: 7.5, perLevel: true }
        ],
        requirements: {
            skills: {
                'minmatarFrigate': 1
            }
        }
    },
    
    'ship_merlin': {
        id: 'ship_merlin',
        name: 'Merlin',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Frigate',
        race: 'Caldari',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 500000,
        description: 'Shield-tanked frigate with strong defensive capabilities.',
        attributes: {
            hull: 400,
            armor: 350,
            shield: 600,
            capacitor: 300,
            powerGrid: 42,
            cpu: 160,
            speed: 310,
            agility: 3.35,
            warpSpeed: 5.0,
            cargoCapacity: 150,
            droneBandwidth: 0,
            droneBay: 0
        },
        slots: {
            high: 3,
            medium: 4,
            low: 2,
            rig: 3
        },
        bonuses: [
            { type: 'hybridDamage', value: 5, perLevel: true },
            { type: 'shieldResistance', value: 4, perLevel: true }
        ],
        requirements: {
            skills: {
                'caldariFrigate': 1
            }
        }
    },
    
    'ship_incursus': {
        id: 'ship_incursus',
        name: 'Incursus',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Frigate',
        race: 'Gallente',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 500000,
        description: 'Armor-tanked brawler with drone capabilities.',
        attributes: {
            hull: 450,
            armor: 550,
            shield: 400,
            capacitor: 275,
            powerGrid: 40,
            cpu: 145,
            speed: 335,
            agility: 3.13,
            warpSpeed: 5.0,
            cargoCapacity: 135,
            droneBandwidth: 15,
            droneBay: 15
        },
        slots: {
            high: 3,
            medium: 3,
            low: 4,
            rig: 3
        },
        bonuses: [
            { type: 'hybridDamage', value: 5, perLevel: true },
            { type: 'armorRepairAmount', value: 7.5, perLevel: true }
        ],
        requirements: {
            skills: {
                'gallenteFrigate': 1
            }
        }
    },
    
    'ship_punisher': {
        id: 'ship_punisher',
        name: 'Punisher',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Frigate',
        race: 'Amarr',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 500000,
        description: 'Heavy armor tank frigate with laser weapons.',
        attributes: {
            hull: 500,
            armor: 600,
            shield: 350,
            capacitor: 325,
            powerGrid: 48,
            cpu: 135,
            speed: 295,
            agility: 3.48,
            warpSpeed: 5.0,
            cargoCapacity: 125,
            droneBandwidth: 0,
            droneBay: 0
        },
        slots: {
            high: 4,
            medium: 2,
            low: 4,
            rig: 3
        },
        bonuses: [
            { type: 'laserDamage', value: 5, perLevel: true },
            { type: 'laserCapacitorUse', value: -10, perLevel: true }
        ],
        requirements: {
            skills: {
                'amarrFrigate': 1
            }
        }
    },
    
    // Mining Frigate
    'ship_venture': {
        id: 'ship_venture',
        name: 'Venture',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Mining Frigate',
        race: 'ORE',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 750000,
        description: 'Specialized mining frigate with ore hold.',
        attributes: {
            hull: 500,
            armor: 400,
            shield: 500,
            capacitor: 300,
            powerGrid: 45,
            cpu: 170,
            speed: 280,
            agility: 3.8,
            warpSpeed: 5.0,
            cargoCapacity: 50,
            oreHold: 5000,
            droneBandwidth: 10,
            droneBay: 15
        },
        slots: {
            high: 3, // 2 turret hardpoints for mining lasers
            medium: 3,
            low: 1,
            rig: 3
        },
        bonuses: [
            { type: 'miningYield', value: 100, flat: true }, // 100% role bonus
            { type: 'gasHarvestingYield', value: 100, flat: true }
        ],
        requirements: {
            skills: {
                'miningFrigate': 1
            }
        }
    },
    
    // ==================== DESTROYERS ====================
    
    'ship_thrasher': {
        id: 'ship_thrasher',
        name: 'Thrasher',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Destroyer',
        race: 'Minmatar',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 1500000,
        description: 'Glass cannon destroyer with high damage output.',
        attributes: {
            hull: 750,
            armor: 700,
            shield: 800,
            capacitor: 450,
            powerGrid: 85,
            cpu: 220,
            speed: 245,
            agility: 3.7,
            warpSpeed: 4.5,
            cargoCapacity: 400,
            droneBandwidth: 0,
            droneBay: 0
        },
        slots: {
            high: 8,
            medium: 3,
            low: 3,
            rig: 3
        },
        bonuses: [
            { type: 'projectileDamage', value: 10, perLevel: true },
            { type: 'projectileTracking', value: 10, perLevel: true }
        ],
        requirements: {
            skills: {
                'minmatarDestroyer': 1
            }
        }
    },
    
    // ==================== CRUISERS ====================
    
    'ship_stabber': {
        id: 'ship_stabber',
        name: 'Stabber',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Cruiser',
        race: 'Minmatar',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 10000000,
        description: 'Fast attack cruiser, excellent for hit-and-run tactics.',
        attributes: {
            hull: 2000,
            armor: 1800,
            shield: 2200,
            capacitor: 1100,
            powerGrid: 780,
            cpu: 340,
            speed: 195,
            agility: 2.52, // Corrected from EVE data, original was typo-prone for game balance
            warpSpeed: 3.0,
            cargoCapacity: 450,
            droneBandwidth: 25,
            droneBay: 25
        },
        slots: {
            high: 6,
            medium: 4,
            low: 4,
            rig: 3
        },
        bonuses: [
            { type: 'projectileDamage', value: 5, perLevel: true },
            { type: 'shipVelocity', value: 5, perLevel: true }
        ],
        requirements: {
            skills: {
                'minmatarCruiser': 1
            }
        }
    },
    
    'ship_vexor': {
        id: 'ship_vexor',
        name: 'Vexor',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Cruiser',
        race: 'Gallente',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 11000000,
        description: 'Drone-focused cruiser with strong versatility.',
        attributes: {
            hull: 2200,
            armor: 2400,
            shield: 2000,
            capacitor: 1200,
            powerGrid: 700,
            cpu: 350,
            speed: 170,
            agility: 2.56, // Corrected from EVE data
            warpSpeed: 3.0,
            cargoCapacity: 480,
            droneBandwidth: 75,
            droneBay: 125
        },
        slots: {
            high: 4,
            medium: 4,
            low: 5,
            rig: 3
        },
        bonuses: [
            { type: 'droneDamage', value: 10, perLevel: true },
            { type: 'droneHitpoints', value: 10, perLevel: true }
        ],
        requirements: {
            skills: {
                'gallenteCruiser': 1
            }
        }
    },
    
    // Mining Cruiser
    'ship_retriever': {
        id: 'ship_retriever',
        name: 'Retriever',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Mining Barge',
        race: 'ORE',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 25000000,
        description: 'Specialized mining barge with large ore hold.',
        attributes: {
            hull: 3500,
            armor: 2000,
            shield: 3000,
            capacitor: 1400,
            powerGrid: 45,
            cpu: 275,
            speed: 90,
            agility: 5.28, // Corrected from EVE data
            warpSpeed: 2.0,
            cargoCapacity: 450,
            oreHold: 22000,
            droneBandwidth: 25,
            droneBay: 50
        },
        slots: {
            high: 2, // Strip miners
            medium: 4,
            low: 2,
            rig: 3
        },
        bonuses: [
            { type: 'miningYield', value: 200, flat: true }, // Role bonus
            { type: 'stripMinerDuration', value: -2, perLevel: true }
        ],
        requirements: {
            skills: {
                'miningBarge': 1
            }
        }
    },
    
    // ==================== BATTLECRUISERS ====================
    
    'ship_hurricane': {
        id: 'ship_hurricane',
        name: 'Hurricane',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Battlecruiser',
        race: 'Minmatar',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 45000000,
        description: 'Versatile battlecruiser with balanced offense and defense.',
        attributes: {
            hull: 5500,
            armor: 5000,
            shield: 6000,
            capacitor: 2400,
            powerGrid: 1425,
            cpu: 450,
            speed: 145,
            agility: 3.68, // Corrected from EVE data
            warpSpeed: 2.7,
            cargoCapacity: 600,
            droneBandwidth: 50,
            droneBay: 100
        },
        slots: {
            high: 8,
            medium: 4,
            low: 6,
            rig: 3
        },
        bonuses: [
            { type: 'projectileDamage', value: 5, perLevel: true },
            { type: 'projectileRateOfFire', value: 5, perLevel: true }
        ],
        requirements: {
            skills: {
                'minmatarBattlecruiser': 1
            }
        }
    },
    
    // ==================== BATTLESHIPS ====================
    
    'ship_tempest': {
        id: 'ship_tempest',
        name: 'Tempest',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Battleship',
        race: 'Minmatar',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 150000000,
        description: 'Fast battleship with powerful artillery capabilities.',
        attributes: {
            hull: 8000,
            armor: 7500,
            shield: 9000,
            capacitor: 4600,
            powerGrid: 17000,
            cpu: 600,
            speed: 105,
            agility: 5.11, // Corrected from EVE data
            warpSpeed: 2.0,
            cargoCapacity: 800,
            droneBandwidth: 75,
            droneBay: 175
        },
        slots: {
            high: 8,
            medium: 5,
            low: 6,
            rig: 3
        },
        bonuses: [
            { type: 'projectileDamage', value: 5, perLevel: true },
            { type: 'projectileRateOfFire', value: 7.5, perLevel: true }
        ],
        requirements: {
            skills: {
                'minmatarBattleship': 1
            }
        }
    },
    
    'ship_dominix': {
        id: 'ship_dominix',
        name: 'Dominix',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Battleship',
        race: 'Gallente',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 160000000,
        description: 'Drone-focused battleship with massive drone bay.',
        attributes: {
            hull: 9000,
            armor: 10000,
            shield: 7500,
            capacitor: 5000,
            powerGrid: 14000,
            cpu: 575,
            speed: 95,
            agility: 5.13, // Corrected from EVE data
            warpSpeed: 2.0,
            cargoCapacity: 675,
            droneBandwidth: 125,
            droneBay: 375
        },
        slots: {
            high: 6,
            medium: 5,
            low: 7,
            rig: 3
        },
        bonuses: [
            { type: 'droneDamage', value: 10, perLevel: true },
            { type: 'droneHitpoints', value: 10, perLevel: true }
        ],
        requirements: {
            skills: {
                'gallenteBattleship': 1
            }
        }
    },
    
    // ==================== INDUSTRIAL SHIPS ====================
    
    'ship_badger': {
        id: 'ship_badger',
        name: 'Badger',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Industrial',
        race: 'Caldari',
        tier: 'T1',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 1000000,
        description: 'Basic cargo hauler for transporting goods.',
        attributes: {
            hull: 2500,
            armor: 1500,
            shield: 3000,
            capacitor: 800,
            powerGrid: 250,
            cpu: 300,
            speed: 100,
            agility: 6.65, // Corrected from EVE data
            warpSpeed: 3.0,
            cargoCapacity: 18000, // EVE accurate value
            droneBandwidth: 0,
            droneBay: 0
        },
        slots: {
            high: 2,
            medium: 4,
            low: 3,
            rig: 3
        },
        bonuses: [
            { type: 'cargoCapacity', value: 5, perLevel: true }
        ],
        requirements: {
            skills: {
                'caldariIndustrial': 1
            }
        }
    },
    
    // ==================== CAPITAL SHIPS ====================
    
    'ship_orca': {
        id: 'ship_orca',
        name: 'Orca',
        // FIX: Added missing 'category' property required by the 'Ship' type.
        category: 'Ship',
        class: 'Industrial Command Ship',
        race: 'ORE',
        tier: 'T2',
        // FIX: Replaced 'price' with 'basePrice' to match the Ship type definition.
        basePrice: 800000000,
        description: 'Mining command ship with fleet support capabilities.',
        attributes: {
            hull: 150000,
            armor: 10000, // EVE accurate
            shield: 15000, // EVE accurate
            capacitor: 8000,
            powerGrid: 50000,
            cpu: 850,
            speed: 60,
            agility: 10.08, // Corrected from EVE data
            warpSpeed: 1.5,
            cargoCapacity: 30000,
            oreHold: 150000,
            fleetHangar: 40000,
            shipMaintenanceBay: 400000,
            droneBandwidth: 50,
            droneBay: 200
        },
        slots: {
            high: 3, // EVE accurate
            medium: 5,
            low: 3,
            rig: 3
        },
        bonuses: [
            { type: 'miningForeman', value: 3, perLevel: true },
            { type: 'cargoCapacity', value: 5, perLevel: true },
            { type: 'tractorBeamRange', value: 250, flat: true }
        ],
        requirements: {
            skills: {
                'industrialCommandShips': 1,
                'miningDirector': 1
            }
        }
    }
};

// Ship Classes Definition
export const ShipClasses: Record<string, ShipClass> = {
    'Frigate': {
        size: 'Small',
        massMultiplier: 1,
        signatureRadius: 35,
        maxRigSize: 'Small'
    },
    'Destroyer': {
        size: 'Small',
        massMultiplier: 1.5,
        signatureRadius: 65,
        maxRigSize: 'Small'
    },
    'Cruiser': {
        size: 'Medium',
        massMultiplier: 3,
        signatureRadius: 125,
        maxRigSize: 'Medium'
    },
    'Battlecruiser': {
        size: 'Large', // Corrected classification
        massMultiplier: 5,
        signatureRadius: 270,
        maxRigSize: 'Medium'
    },
    'Battleship': {
        size: 'Large',
        massMultiplier: 10,
        signatureRadius: 400,
        maxRigSize: 'Large'
    },
    'Industrial': {
        size: 'Medium',
        massMultiplier: 4,
        signatureRadius: 150,
        maxRigSize: 'Medium'
    },
    'Mining Frigate': {
        size: 'Small',
        massMultiplier: 1.2,
        signatureRadius: 40,
        maxRigSize: 'Small'
    },
    'Mining Barge': {
        size: 'Medium',
        massMultiplier: 4,
        signatureRadius: 200,
        maxRigSize: 'Medium'
    },
    'Industrial Command Ship': {
        size: 'Capital',
        massMultiplier: 50,
        signatureRadius: 1000,
        maxRigSize: 'Capital'
    }
};

// Ship Skills
export const ShipSkills: Record<string, ShipSkill> = {
    // Spaceship Command
    'spaceshipCommand': {
        name: 'Spaceship Command',
        description: 'Basic piloting skill. 2% agility bonus per level.',
        rank: 1,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    
    // Race-specific Frigate Skills
    'minmatarFrigate': {
        name: 'Minmatar Frigate',
        description: 'Skill for piloting Minmatar frigates.',
        rank: 2,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'caldariFrigate': {
        name: 'Caldari Frigate',
        description: 'Skill for piloting Caldari frigates.',
        rank: 2,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'gallenteFrigate': {
        name: 'Gallente Frigate',
        description: 'Skill for piloting Gallente frigates.',
        rank: 2,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'amarrFrigate': {
        name: 'Amarr Frigate',
        description: 'Skill for piloting Amarr frigates.',
        rank: 2,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    
    // Specialized Skills
    'miningFrigate': {
        name: 'Mining Frigate',
        description: 'Skill for piloting ORE mining frigates.',
        rank: 2,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'miningBarge': {
        name: 'Mining Barge',
        description: 'Skill for piloting mining barges.',
        rank: 4,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'industrialCommandShips': {
        name: 'Industrial Command Ships',
        description: 'Skill for piloting industrial command ships.',
        rank: 8,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'minmatarDestroyer': {
        name: 'Minmatar Destroyer',
        description: 'Skill for piloting Minmatar destroyers.',
        rank: 3,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'minmatarCruiser': {
        name: 'Minmatar Cruiser',
        description: 'Skill for piloting Minmatar cruisers.',
        rank: 5,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'gallenteCruiser': {
        name: 'Gallente Cruiser',
        description: 'Skill for piloting Gallente cruisers.',
        rank: 5,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'minmatarBattlecruiser': {
        name: 'Minmatar Battlecruiser',
        description: 'Skill for piloting Minmatar battlecruisers.',
        rank: 7,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'minmatarBattleship': {
        name: 'Minmatar Battleship',
        description: 'Skill for piloting Minmatar battleships.',
        rank: 8,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'gallenteBattleship': {
        name: 'Gallente Battleship',
        description: 'Skill for piloting Gallente battleships.',
        rank: 8,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'caldariIndustrial': {
        name: 'Caldari Industrial',
        description: 'Skill for piloting Caldari industrial ships.',
        rank: 4,
        primaryAttribute: 'perception',
        secondaryAttribute: 'willpower'
    },
    'miningDirector': {
        name: 'Mining Director',
        description: 'Advanced skill for coordinating mining fleets.',
        rank: 6,
        primaryAttribute: 'charisma',
        secondaryAttribute: 'willpower'
    }
};