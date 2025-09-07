// Ore and Material Data - EVE Online Inspired
// Galaxy Explorer Game

import type { Ore, Mineral, AsteroidBeltType, MiningModifiers, RefiningEfficiency } from './types';

export const ORE_DATA: Record<string, Ore> = {
    // Basic Ores (High-Sec)
    'ore_veldspar': {
        id: 'ore_veldspar',
        name: 'Veldspar',
        category: 'Ore',
        volume: 0.1,
        basePrice: 10,
        description: 'The most common ore in the galaxy. Contains massive amounts of Tritanium.',
        refineYield: {
            'min_tritanium': 415
        },
        security: 1.0,
        rarity: 'common',
        icon: '⛏️'
    },
    'ore_scordite': {
        id: 'ore_scordite',
        name: 'Scordite',
        category: 'Ore',
        volume: 0.15,
        basePrice: 15,
        description: 'Common ore containing both Tritanium and Pyerite.',
        refineYield: {
            'min_tritanium': 346,
            'min_pyerite': 173
        },
        security: 1.0,
        rarity: 'common',
        icon: '⛏️'
    },
    'ore_pyroxeres': {
        id: 'ore_pyroxeres',
        name: 'Pyroxeres',
        category: 'Ore',
        volume: 0.3,
        basePrice: 25,
        description: 'Complex ore with traces of Nocxium.',
        refineYield: {
            'min_tritanium': 351,
            'min_pyerite': 25,
            'min_mexallon': 50,
            'min_nocxium': 5
        },
        security: 0.9,
        rarity: 'common',
        icon: '⛏️'
    },
    
    // Uncommon Ores (Low-Sec)
    'ore_plagioclase': {
        id: 'ore_plagioclase',
        name: 'Plagioclase',
        category: 'Ore',
        volume: 0.35,
        basePrice: 40,
        description: 'Valuable ore rich in Pyerite and Mexallon.',
        refineYield: {
            'min_tritanium': 107,
            'min_pyerite': 213,
            'min_mexallon': 107
        },
        security: 0.7,
        rarity: 'uncommon',
        icon: '💎'
    },
    'ore_omber': {
        id: 'ore_omber',
        name: 'Omber',
        category: 'Ore',
        volume: 0.6,
        basePrice: 50,
        description: 'Dense ore with good yields of Pyerite and Isogen.',
        refineYield: {
            'min_tritanium': 85,
            'min_pyerite': 34,
            'min_isogen': 85
        },
        security: 0.7,
        rarity: 'uncommon',
        icon: '💎'
    },
    'ore_kernite': {
        id: 'ore_kernite',
        name: 'Kernite',
        category: 'Ore',
        volume: 1.2,
        basePrice: 60,
        description: 'Fairly rare ore with excellent Mexallon content.',
        refineYield: {
            'min_tritanium': 134,
            'min_mexallon': 267,
            'min_isogen': 134
        },
        security: 0.7,
        rarity: 'uncommon',
        icon: '💎'
    },
    
    // Rare Ores (Low-Sec to Null-Sec)
    'ore_jaspet': {
        id: 'ore_jaspet',
        name: 'Jaspet',
        category: 'Ore',
        volume: 2.0,
        basePrice: 100,
        description: 'Valuable ore with diverse mineral content.',
        refineYield: {
            'min_tritanium': 72,
            'min_pyerite': 121,
            'min_mexallon': 144,
            'min_nocxium': 72,
            'min_zydrine': 3
        },
        security: 0.4,
        rarity: 'rare',
        icon: '🔷'
    },
    'ore_hemorphite': {
        id: 'ore_hemorphite',
        name: 'Hemorphite',
        category: 'Ore',
        volume: 3.0,
        basePrice: 120,
        description: 'Rare ore with good Isogen and Nocxium yields.',
        refineYield: {
            'min_tritanium': 180,
            'min_pyerite': 72,
            'min_mexallon': 17,
            'min_isogen': 59,
            'min_nocxium': 118,
            'min_zydrine': 8
        },
        security: 0.2,
        rarity: 'rare',
        icon: '🔷'
    },
    'ore_hedbergite': {
        id: 'ore_hedbergite',
        name: 'Hedbergite',
        category: 'Ore',
        volume: 3.0,
        basePrice: 140,
        description: 'Valuable ore rich in Pyerite and Isogen.',
        refineYield: {
            'min_pyerite': 343,
            'min_isogen': 196,
            'min_nocxium': 98,
            'min_zydrine': 19
        },
        security: 0.2,
        rarity: 'rare',
        icon: '🔷'
    },
    
    // Exceptional Ores (Null-Sec)
    'ore_arkonor': {
        id: 'ore_arkonor',
        name: 'Arkonor',
        category: 'Ore',
        volume: 16.0,
        basePrice: 300,
        description: 'One of the rarest ores, rich in Megacyte.',
        refineYield: {
            'min_tritanium': 6905,
            'min_mexallon': 1278,
            'min_megacyte': 230
        },
        security: 0.0,
        rarity: 'exceptional',
        icon: '⭐'
    },
    'ore_bistot': {
        id: 'ore_bistot',
        name: 'Bistot',
        category: 'Ore',
        volume: 16.0,
        basePrice: 350,
        description: 'Extremely valuable ore with high Zydrine content.',
        refineYield: {
            'min_pyerite': 3200,
            'min_mexallon': 1280,
            'min_zydrine': 256,
            'min_megacyte': 128
        },
        security: 0.0,
        rarity: 'exceptional',
        icon: '⭐'
    },
    'ore_crokite': {
        id: 'ore_crokite',
        name: 'Crokite',
        category: 'Ore',
        volume: 16.0,
        basePrice: 400,
        description: 'The most valuable ore, exceptionally rich in Nocxium.',
        refineYield: {
            'min_tritanium': 10171,
            'min_nocxium': 760,
            'min_zydrine': 127,
            'min_megacyte': 254
        },
        security: 0.0,
        rarity: 'exceptional',
        icon: '⭐'
    },
    
    'ore_blue_ice': {
        id: 'ore_blue_ice',
        name: 'Blue Ice',
        category: 'Ore',
        volume: 1000.0,
        basePrice: 500,
        description: 'Frozen isotope used for capital ship fuel.',
        refineYield: {
            'min_heavy_water': 50,
            'min_liquid_ozone': 25,
            'min_strontium': 1,
            'min_oxygen_isotopes': 300
        },
        security: 0.5,
        rarity: 'rare',
        icon: '🧊'
    },
    
    'ore_spodumain': {
        id: 'ore_spodumain',
        name: 'Spodumain',
        category: 'Ore',
        volume: 16.0,
        basePrice: 250,
        description: 'Moon-mined ore with exceptional Tritanium yields.',
        refineYield: {
            'min_tritanium': 39221,
            'min_pyerite': 4972,
            'min_mexallon': 78,
            'min_isogen': 245
        },
        security: 0.0,
        rarity: 'rare',
        icon: '🌙'
    }
};

export const MINERAL_DATA: Record<string, Mineral> = {
    'min_tritanium': {
        id: 'min_tritanium',
        name: 'Tritanium',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 5,
        description: 'The most common mineral, used in virtually all manufacturing.',
        icon: '▪️'
    },
    'min_pyerite': {
        id: 'min_pyerite',
        name: 'Pyerite',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 10,
        description: 'Common mineral required for most ship construction.',
        icon: '▪️'
    },
    'min_mexallon': {
        id: 'min_mexallon',
        name: 'Mexallon',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 40,
        description: 'Versatile mineral used in advanced alloys.',
        icon: '▫️'
    },
    'min_isogen': {
        id: 'min_isogen',
        name: 'Isogen',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 80,
        description: 'Uncommon mineral essential for shield systems.',
        icon: '▫️'
    },
    'min_nocxium': {
        id: 'min_nocxium',
        name: 'Nocxium',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 400,
        description: 'Rare mineral used in advanced electronics.',
        icon: '◽'
    },
    'min_zydrine': {
        id: 'min_zydrine',
        name: 'Zydrine',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 1000,
        description: 'Rare mineral required for advanced ship systems.',
        icon: '◽'
    },
    'min_megacyte': {
        id: 'min_megacyte',
        name: 'Megacyte',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 2000,
        description: 'Very rare mineral used in capital ship construction.',
        icon: '⬜'
    },
    'min_morphite': {
        id: 'min_morphite',
        name: 'Morphite',
        category: 'Mineral',
        volume: 0.01,
        basePrice: 10000,
        description: 'Extremely rare mineral used in advanced technology.',
        icon: '⬜'
    },
    'min_heavy_water': {
        id: 'min_heavy_water',
        name: 'Heavy Water',
        category: 'Mineral',
        volume: 0.4,
        basePrice: 300,
        description: 'Isotope used in reactor fuel.',
        icon: '💧'
    },
    'min_liquid_ozone': {
        id: 'min_liquid_ozone',
        name: 'Liquid Ozone',
        category: 'Mineral',
        volume: 0.4,
        basePrice: 400,
        description: 'Coolant for jump drives.',
        icon: '💧'
    },
    'min_strontium': {
        id: 'min_strontium',
        name: 'Strontium Clathrates',
        category: 'Mineral',
        volume: 3.0,
        basePrice: 2500,
        description: 'Used in siege and triage modules.',
        icon: '🔹'
    },
    'min_oxygen_isotopes': {
        id: 'min_oxygen_isotopes',
        name: 'Oxygen Isotopes',
        category: 'Mineral',
        volume: 0.15,
        basePrice: 150,
        description: 'Fuel for Gallente capital ships.',
        icon: '⚪'
    }
};

export const ASTEROID_BELT_TYPES: Record<string, AsteroidBeltType> = {
    sparse: {
        name: 'Sparse Belt',
        asteroidCount: [5, 10],
        oreDistribution: {
            'ore_veldspar': 0.5,
            'ore_scordite': 0.3,
            'ore_pyroxeres': 0.2
        },
        respawnTime: 3600 // 1 hour in seconds
    },
    moderate: {
        name: 'Moderate Belt',
        asteroidCount: [10, 20],
        oreDistribution: {
            'ore_veldspar': 0.3,
            'ore_scordite': 0.3,
            'ore_pyroxeres': 0.2,
            'ore_plagioclase': 0.1,
            'ore_omber': 0.1
        },
        respawnTime: 7200 // 2 hours
    },
    dense: {
        name: 'Dense Belt',
        asteroidCount: [20, 40],
        oreDistribution: {
            'ore_veldspar': 0.2,
            'ore_scordite': 0.2,
            'ore_pyroxeres': 0.2,
            'ore_plagioclase': 0.15,
            'ore_omber': 0.15,
            'ore_kernite': 0.1
        },
        respawnTime: 14400 // 4 hours
    },
    rich: {
        name: 'Rich Belt',
        asteroidCount: [30, 50],
        oreDistribution: {
            'ore_plagioclase': 0.2,
            'ore_omber': 0.2,
            'ore_kernite': 0.2,
            'ore_jaspet': 0.15,
            'ore_hemorphite': 0.15,
            'ore_hedbergite': 0.1
        },
        respawnTime: 21600 // 6 hours
    },
    exceptional: {
        name: 'Exceptional Belt',
        asteroidCount: [40, 60],
        oreDistribution: {
            'ore_jaspet': 0.2,
            'ore_hemorphite': 0.2,
            'ore_hedbergite': 0.2,
            'ore_arkonor': 0.15,
            'ore_bistot': 0.15,
            'ore_crokite': 0.1
        },
        respawnTime: 43200 // 12 hours
    }
};

export const MINING_MODIFIERS: MiningModifiers = {
    shipBonus: {
        'ship_venture': 2.0,
        'ship_retriever': 3.0,
        'ship_orca': 5.0,
    },
    moduleBonus: {
        'mod_miner_i': 1.0,
        'mod_miner_ii': 1.25,
        'mod_strip_miner_i': 3.0,
    },
    skillBonus: {
        mining: 0.05,
        astrogeology: 0.05,
        miningFrigate: 0.05,
    }
};

export const REFINING_EFFICIENCY: RefiningEfficiency = {
    base: 0.5,
    stationBonus: {
        basic: 0.0,
        advanced: 0.1,
        expert: 0.2
    },
    skillBonus: {
        refining: 0.02,
        refineryEfficiency: 0.03,
        oreProcessing: 0.02
    },
    maxEfficiency: 0.9
};
