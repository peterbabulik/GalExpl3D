import type { Blueprint, BlueprintResearchData, ManufacturingSkill, ManufacturingFacility } from './types';

// Blueprint Data - Manufacturing Recipes
// Galaxy Explorer Game

export const BlueprintData: Record<string, Blueprint> = {
    // ==================== SHIP BLUEPRINTS ====================
    
    // Frigates
    'bp_rifter': {
        id: 'bp_rifter',
        name: 'Rifter Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_rifter',
        outputQuantity: 1,
        basePrice: 1000000,
        manufacturingTime: 3600, // 1 hour in seconds
        materials: {
            'min_tritanium': 28000,
            'min_pyerite': 7000,
            'min_mexallon': 1750,
            'min_isogen': 350,
            'min_nocxium': 35
        },
        skills: {
            'industrySkill': 1,
            'minmatarStarshipEngineering': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_merlin': {
        id: 'bp_merlin',
        name: 'Merlin Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_merlin',
        outputQuantity: 1,
        basePrice: 1000000,
        manufacturingTime: 3600,
        materials: {
            'min_tritanium': 30000,
            'min_pyerite': 6000,
            'min_mexallon': 2000,
            'min_isogen': 400,
            'min_nocxium': 40
        },
        skills: {
            'industrySkill': 1,
            'caldariStarshipEngineering': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_venture': {
        id: 'bp_venture',
        name: 'Venture Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_venture',
        outputQuantity: 1,
        basePrice: 1500000,
        manufacturingTime: 4500,
        materials: {
            'min_tritanium': 35000,
            'min_pyerite': 8000,
            'min_mexallon': 3000,
            'min_isogen': 500,
            'min_nocxium': 50,
            'min_zydrine': 10
        },
        skills: {
            'industrySkill': 1,
            'oreIndustrialSkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // Cruisers
    'bp_stabber': {
        id: 'bp_stabber',
        name: 'Stabber Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_stabber',
        outputQuantity: 1,
        basePrice: 20000000,
        manufacturingTime: 10800, // 3 hours
        materials: {
            'min_tritanium': 1800000,
            'min_pyerite': 450000,
            'min_mexallon': 112500,
            'min_isogen': 22500,
            'min_nocxium': 5625,
            'min_zydrine': 1125,
            'min_megacyte': 450
        },
        skills: {
            'industrySkill': 3,
            'minmatarStarshipEngineering': 3
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_vexor': {
        id: 'bp_vexor',
        name: 'Vexor Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_vexor',
        outputQuantity: 1,
        basePrice: 22000000,
        manufacturingTime: 10800,
        materials: {
            'min_tritanium': 2000000,
            'min_pyerite': 400000,
            'min_mexallon': 125000,
            'min_isogen': 25000,
            'min_nocxium': 6000,
            'min_zydrine': 1200,
            'min_megacyte': 500
        },
        skills: {
            'industrySkill': 3,
            'gallenteStarshipEngineering': 3
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // Mining Barge
    'bp_retriever': {
        id: 'bp_retriever',
        name: 'Retriever Blueprint',
        category: 'Blueprint',
        outputItem: 'ship_retriever',
        outputQuantity: 1,
        basePrice: 50000000,
        manufacturingTime: 14400, // 4 hours
        materials: {
            'min_tritanium': 3000000,
            'min_pyerite': 600000,
            'min_mexallon': 200000,
            'min_isogen': 40000,
            'min_nocxium': 10000,
            'min_zydrine': 2000,
            'min_megacyte': 800
        },
        skills: {
            'industrySkill': 4,
            'oreIndustrialSkill': 3
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // ==================== MODULE BLUEPRINTS ====================
    
    // Weapons
    'bp_125mm_autocannon': {
        id: 'bp_125mm_autocannon',
        name: '125mm Gatling AutoCannon I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_125mm_autocannon_i',
        outputQuantity: 1,
        basePrice: 100000,
        manufacturingTime: 600, // 10 minutes
        materials: {
            'min_tritanium': 2000,
            'min_pyerite': 500,
            'min_mexallon': 125
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_light_missile_launcher': {
        id: 'bp_light_missile_launcher',
        name: 'Light Missile Launcher I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_light_missile_launcher_i',
        outputQuantity: 1,
        basePrice: 110000,
        manufacturingTime: 600,
        materials: {
            'min_tritanium': 2200,
            'min_pyerite': 550,
            'min_mexallon': 140,
            'min_isogen': 20
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // Mining Equipment
    'bp_miner_i': {
        id: 'bp_miner_i',
        name: 'Miner I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_miner_i',
        outputQuantity: 1,
        basePrice: 60000,
        manufacturingTime: 300,
        materials: {
            'min_tritanium': 1500,
            'min_pyerite': 300,
            'min_mexallon': 75
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_strip_miner': {
        id: 'bp_strip_miner',
        name: 'Strip Miner I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_strip_miner_i',
        outputQuantity: 1,
        basePrice: 10000000,
        manufacturingTime: 1800, // 30 minutes
        materials: {
            'min_tritanium': 100000,
            'min_pyerite': 20000,
            'min_mexallon': 5000,
            'min_isogen': 1000,
            'min_nocxium': 250
        },
        skills: {
            'industrySkill': 3
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // Shield Modules
    'bp_shield_extender': {
        id: 'bp_shield_extender',
        name: 'Small Shield Extender I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_shield_extender_i',
        outputQuantity: 1,
        basePrice: 80000,
        manufacturingTime: 450,
        materials: {
            'min_tritanium': 1800,
            'min_pyerite': 400,
            'min_mexallon': 100,
            'min_isogen': 15
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_shield_booster': {
        id: 'bp_shield_booster',
        name: 'Small Shield Booster I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_shield_booster_i',
        outputQuantity: 1,
        basePrice: 100000,
        manufacturingTime: 450,
        materials: {
            'min_tritanium': 2000,
            'min_pyerite': 450,
            'min_mexallon': 110,
            'min_isogen': 20,
            'min_nocxium': 5
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // Propulsion
    'bp_afterburner': {
        id: 'bp_afterburner',
        name: '1MN Afterburner I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_1mn_afterburner_i',
        outputQuantity: 1,
        basePrice: 70000,
        manufacturingTime: 400,
        materials: {
            'min_tritanium': 1600,
            'min_pyerite': 350,
            'min_mexallon': 90,
            'min_isogen': 10
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    'bp_microwarpdrive': {
        id: 'bp_microwarpdrive',
        name: '1MN Microwarpdrive I Blueprint',
        category: 'Blueprint',
        outputItem: 'mod_1mn_mwd_i',
        outputQuantity: 1,
        basePrice: 300000,
        manufacturingTime: 600,
        materials: {
            'min_tritanium': 5000,
            'min_pyerite': 1000,
            'min_mexallon': 250,
            'min_isogen': 50,
            'min_nocxium': 10
        },
        skills: {
            'industrySkill': 2
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.9,
            'advancedEngineering': 0.85
        }
    },
    
    // ==================== AMMUNITION BLUEPRINTS ====================
    
    'bp_fusion_s': {
        id: 'bp_fusion_s',
        name: 'Fusion S Blueprint',
        category: 'Blueprint',
        outputItem: 'ammo_fusion_s',
        outputQuantity: 100,
        basePrice: 10000,
        manufacturingTime: 60,
        materials: {
            'min_tritanium': 100,
            'min_pyerite': 20
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'ammunitionAssembly': 0.8
        }
    },
    
    'bp_antimatter_s': {
        id: 'bp_antimatter_s',
        name: 'Antimatter Charge S Blueprint',
        category: 'Blueprint',
        outputItem: 'ammo_antimatter_s',
        outputQuantity: 100,
        basePrice: 20000,
        manufacturingTime: 90,
        materials: {
            'min_tritanium': 150,
            'min_pyerite': 30,
            'min_mexallon': 5
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'ammunitionAssembly': 0.8
        }
    },
    
    'bp_scourge_rocket': {
        id: 'bp_scourge_rocket',
        name: 'Scourge Rocket Blueprint',
        category: 'Blueprint',
        outputItem: 'missile_scourge_rocket',
        outputQuantity: 100,
        basePrice: 15000,
        manufacturingTime: 120,
        materials: {
            'min_tritanium': 120,
            'min_pyerite': 25,
            'min_mexallon': 8,
            'min_isogen': 2
        },
        skills: {
            'industrySkill': 1
        },
        facilityBonus: {
            'station': 1.0,
            'ammunitionAssembly': 0.8
        }
    },
    
    // ==================== STRUCTURE BLUEPRINTS ====================
    
    'bp_small_station': {
        id: 'bp_small_station',
        name: 'Small Station Blueprint',
        category: 'Blueprint',
        outputItem: 'structure_small_station',
        outputQuantity: 1,
        basePrice: 100000000,
        manufacturingTime: 86400, // 24 hours
        materials: {
            'min_tritanium': 10000000,
            'min_pyerite': 2000000,
            'min_mexallon': 500000,
            'min_isogen': 100000,
            'min_nocxium': 25000,
            'min_zydrine': 5000,
            'min_megacyte': 2000
        },
        skills: {
            'industrySkill': 5,
            'anchoringSkill': 3
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.85,
            'capitalShipyard': 0.8
        }
    },
    
    'bp_mining_platform': {
        id: 'bp_mining_platform',
        name: 'Mining Platform Blueprint',
        category: 'Blueprint',
        outputItem: 'structure_mining_platform',
        outputQuantity: 1,
        basePrice: 50000000,
        manufacturingTime: 43200, // 12 hours
        materials: {
            'min_tritanium': 5000000,
            'min_pyerite': 1000000,
            'min_mexallon': 250000,
            'min_isogen': 50000,
            'min_nocxium': 12500,
            'min_zydrine': 2500
        },
        skills: {
            'industrySkill': 4,
            'anchoringSkill': 2
        },
        facilityBonus: {
            'station': 1.0,
            'engineeringComplex': 0.85
        }
    },
    
    // ==================== COMPONENT BLUEPRINTS ====================
    
    'bp_construction_blocks': {
        id: 'bp_construction_blocks',
        name: 'Construction Blocks Blueprint',
        category: 'Blueprint',
        outputItem: 'comp_construction_blocks',
        outputQuantity: 10,
        basePrice: 1000000,
        manufacturingTime: 1800,
        materials: {
            'min_tritanium': 50000,
            'min_pyerite': 10000,
            'min_mexallon': 2500
        },
        skills: {
            'industrySkill': 2
        },
        facilityBonus: {
            'station': 1.0,
            'componentAssembly': 0.85
        }
    },
    
    'bp_nanite_repair_paste': {
        id: 'bp_nanite_repair_paste',
        name: 'Nanite Repair Paste Blueprint',
        category: 'Blueprint',
        outputItem: 'cons_nanite_paste',
        outputQuantity: 50,
        basePrice: 500000,
        manufacturingTime: 900,
        materials: {
            'min_tritanium': 5000,
            'min_pyerite': 1000,
            'min_mexallon': 250,
            'min_nocxium': 50
        },
        skills: {
            'industrySkill': 2,
            'naniteEngineering': 1
        },
        facilityBonus: {
            'station': 1.0,
            'laboratoryFacility': 0.9
        }
    }
};

// Blueprint Research Types
export const BlueprintResearch: BlueprintResearchData = {
    materialEfficiency: {
        name: 'Material Efficiency',
        description: 'Reduces material requirements',
        maxLevel: 10,
        costPerLevel: (level: number) => Math.pow(2, level) * 100000,
        timePerLevel: (level: number) => Math.pow(2, level) * 3600, // hours
        bonusPerLevel: 0.01 // 1% reduction per level
    },
    timeEfficiency: {
        name: 'Time Efficiency',
        description: 'Reduces manufacturing time',
        maxLevel: 20,
        costPerLevel: (level: number) => Math.pow(1.5, level) * 50000,
        timePerLevel: (level: number) => Math.pow(1.5, level) * 1800,
        bonusPerLevel: 0.02 // 2% reduction per level
    },
    copying: {
        name: 'Blueprint Copying',
        description: 'Create copies of the blueprint',
        maxRuns: 100,
        costPerRun: 10000,
        timePerRun: 3600
    },
    invention: {
        name: 'Invention',
        description: 'Create T2 blueprint from T1',
        successChance: 0.4, // 40% base chance
        cost: 5000000,
        time: 86400, // 24 hours
        requirements: {
            skills: {
                'science': 5,
                'research': 5
            }
        }
    }
};

// Manufacturing Skills
export const ManufacturingSkills: Record<string, ManufacturingSkill> = {
    'industrySkill': {
        name: 'Industry',
        description: '4% reduction in manufacturing time per level',
        rank: 1,
        bonusPerLevel: 0.04
    },
    'massProduction': {
        name: 'Mass Production',
        description: 'Allows 1 additional manufacturing job per level',
        rank: 2,
        bonusPerLevel: 1
    },
    'advancedMassProduction': {
        name: 'Advanced Mass Production',
        description: 'Allows 1 additional manufacturing job per level',
        rank: 8,
        bonusPerLevel: 1
    },
    'materialEfficiency': {
        name: 'Material Efficiency',
        description: '5% reduction in material waste per level',
        rank: 3,
        bonusPerLevel: 0.05
    },
    'productionEfficiency': {
        name: 'Production Efficiency',
        description: '5% reduction in manufacturing time per level',
        rank: 3,
        bonusPerLevel: 0.05
    }
};

// Manufacturing Facilities
export const ManufacturingFacilities: Record<string, ManufacturingFacility> = {
    'station': {
        name: 'Station Factory',
        materialBonus: 1.0,
        timeBonus: 1.0,
        costMultiplier: 1.0,
        maxJobs: 10
    },
    'engineeringComplex': {
        name: 'Engineering Complex',
        materialBonus: 0.98, // 2% material reduction
        timeBonus: 0.85, // 15% time reduction
        costMultiplier: 0.95,
        maxJobs: 20
    },
    'advancedEngineering': {
        name: 'Advanced Engineering Complex',
        materialBonus: 0.95, // 5% material reduction
        timeBonus: 0.75, // 25% time reduction
        costMultiplier: 0.9,
        maxJobs: 30
    },
    'capitalShipyard': {
        name: 'Capital Shipyard',
        materialBonus: 0.9, // 10% material reduction for capitals
        timeBonus: 0.7, // 30% time reduction for capitals
        costMultiplier: 0.85,
        maxJobs: 5,
        specialization: 'capital'
    }
};
