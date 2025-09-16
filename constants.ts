// constants.ts
import type { PlayerState, GalaxyData, SolarSystemData, ItemData } from './types';
import { ShipData } from './ships';
import { BlueprintData } from './blueprints';
import { ORE_DATA, MINERAL_DATA } from './ores';
import { MODULE_DATA, OTHER_ITEM_DATA } from './modules';

// Re-exporting for App.tsx with the expected names
export const SHIP_DATA = ShipData;
export const BLUEPRINT_DATA = BlueprintData;

export const GALAXY_DATA: GalaxyData = {
    systems: [
        { id: 1, name: 'Sol', security: 1.0, x: 0, y: 0 },
        { id: 2, name: 'Jita', security: 1.0, x: 50, y: 80 },
        { id: 3, name: 'Amarr', security: 1.0, x: -80, y: 60 },
        { id: 4, name: 'Dodixie', security: 0.9, x: -120, y: -40 },
        { id: 5, name: 'Hek', security: 0.5, x: 150, y: 120 },
        { id: 6, name: 'Rens', security: 0.8, x: -180, y: 150 },
        { id: 7, name: 'Nul', security: 0.5, x: 250, y: -100 },
        { id: 8, name: 'Rancer', security: 0.0, x: 220, y: 220 },
        { id: 9, name: 'Provi', security: 0.1, x: -250, y: -180 },
        { id: 10, name: 'Delve', security: 0.0, x: -350, y: 0 },
        { id: 11, name: 'Querious', security: 0.0, x: -300, y: -100 },
        { id: 12, name: 'Aridia', security: 0.2, x: 100, y: -200 },
        // New Systems
        { id: 13, name: 'Obe', security: 0.6, x: 60, y: 150 },
        { id: 14, name: 'Tama', security: 0.4, x: 80, y: 110 },
        { id: 15, name: 'Iralan', security: 0.4, x: -200, y: 180 },
        { id: 16, name: 'PF-346', security: 0.0, x: -400, y: 250 },
        { id: 17, name: 'Esoteria', security: 0.0, x: -500, y: -200 },
        { id: 18, name: 'Fountain', security: 0.0, x: -450, y: 100 },
        { id: 19, name: 'Stain', security: 0.0, x: 150, y: -300 },
        { id: 20, name: 'Venal', security: 0.0, x: 300, y: 300 },
        { id: 21, name: 'Syndicate', security: 0.1, x: -180, y: -250 },
        { id: 22, name: 'Curse', security: 0.0, x: 0, y: -350 },
        { id: 23, name: 'Great Wildlands', security: 0.0, x: 400, y: 0 },
        { id: 24, name: 'Outer Ring', security: 0.3, x: -50, y: -200 },
        { id: 25, name: 'The Citadel', security: 0.3, x: 200, y: 50 },
        { id: 26, name: 'Lonetrek', security: 0.6, x: 120, y: 90 },
        { id: 27, name: 'Test', security: 0.4, x: 10, y: -50 },
        { id: 28, name: 'Test2', security: 0.2, x: 10, y: -100 },
        { id: 29, name: 'Test3', security: 0.0, x: 10, y: -150 },
    ],
    jumps: [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 27 },
        { from: 2, to: 3 },
        { from: 2, to: 5 },
        { from: 3, to: 4 },
        { from: 3, to: 6 },
        { from: 4, to: 6 },
        { from: 4, to: 9 },
        { from: 5, to: 8 },
        { from: 5, to: 7 },
        { from: 7, to: 12 },
        { from: 9, to: 10 },
        { from: 10, to: 11 },
        { from: 11, to: 9 },
        // New Jumps
        { from: 2, to: 13 },
        { from: 13, to: 14 },
        { from: 2, to: 26 },
        { from: 26, to: 25 },
        { from: 25, to: 7 },
        { from: 6, to: 15 },
        { from: 15, to: 16 },
        { from: 16, to: 18 },
        { from: 10, to: 18 },
        { from: 11, to: 17 },
        { from: 12, to: 19 },
        { from: 22, to: 19 },
        { from: 12, to: 22 },
        { from: 9, to: 21 },
        { from: 4, to: 21 },
        { from: 24, to: 21 },
        { from: 24, to: 3 },
        { from: 8, to: 20 },
        { from: 5, to: 23 },
        { from: 27, to: 28 },
        { from: 28, to: 29 },
    ]
};

export const SOLAR_SYSTEM_DATA: Record<number, SolarSystemData> = {
    1: {
        name: 'Sol',
        star: { color: 0xFFFF00, diameter: 1392700 },
        planets: [
            { name: 'Mercury', type: 'rocky', diameter: 4879, distance: 5000, color: 0x9d9d9d },
            { name: 'Venus', type: 'rocky', diameter: 12104, distance: 8000, color: 0xdaa520 },
            { name: 'Earth', type: 'terran', diameter: 12742, distance: 12000, color: 0x4682b4 },
            { name: 'Mars', type: 'rocky', diameter: 6779, distance: 18000, color: 0xff4500 },
        ],
        station: { name: 'Titan Station', orbitsPlanetIndex: 2, orbitDistance: 400 },
        asteroidBeltType: 'moderate',
    },
    2: {
        name: 'Jita',
        star: { color: 0xFFF0DD, diameter: 1700000 },
        planets: [
            { name: 'Jita IV', type: 'gas', diameter: 50000, distance: 10000, color: 0xFFA500 },
            { name: 'Jita V', type: 'rocky', diameter: 8000, distance: 15000, color: 0x8B4513 },
        ],
        station: { name: 'Jita IV-4 Trade Hub', orbitsPlanetIndex: 0, orbitDistance: 800 },
        asteroidBeltType: 'rich',
    },
    3: {
        name: 'Amarr',
        star: { color: 0xFFD700, diameter: 1800000 },
        planets: [
            { name: 'Amarr I', type: 'terran', diameter: 14000, distance: 13000, color: 0xB8860B },
        ],
        station: { name: 'Amarr Imperial Palace', orbitsPlanetIndex: 0, orbitDistance: 600 },
        asteroidBeltType: 'moderate',
    },
    4: {
        name: 'Dodixie',
        star: { color: 0xADD8E6, diameter: 1600000 },
        planets: [
            { name: 'Dodixie IX', type: 'ice', diameter: 22000, distance: 20000, color: 0xADD8E6 },
        ],
        station: { name: 'Dodixie IX - Moon 20', orbitsPlanetIndex: 0, orbitDistance: 700 },
        asteroidBeltType: 'moderate',
    },
    5: {
        name: 'Hek',
        star: { color: 0xFF4500, diameter: 1100000 },
        planets: [],
        asteroidBeltType: 'dense',
    },
    6: {
        name: 'Rens',
        star: { color: 0xFF6347, diameter: 1200000 },
        planets: [
            { name: 'Rens VI', type: 'lava', diameter: 9000, distance: 9000, color: 0xDC143C },
        ],
        asteroidBeltType: 'dense',
    },
    7: {
        name: 'Nul',
        star: { color: 0x8A2BE2, diameter: 900000 },
        planets: [],
        asteroidBeltType: 'exceptional',
    },
    8: {
        name: 'Rancer',
        star: { color: 0xFF0000, diameter: 800000 },
        planets: [
            { name: 'Rancer I', type: 'barren', diameter: 4000, distance: 4000, color: 0x808080 },
        ],
        asteroidBeltType: 'exceptional',
    },
    9: {
        name: 'Provi',
        star: { color: 0x00FFFF, diameter: 2100000 },
        planets: [
            { name: 'Providence VII', type: 'gas', diameter: 60000, distance: 25000, color: 0x40E0D0 },
        ],
        asteroidBeltType: 'rich',
    },
    10: {
        name: 'Delve',
        star: { color: 0xFFFFFF, diameter: 1500000 },
        planets: [],
        asteroidBeltType: 'exceptional',
    },
    11: {
        name: 'Querious',
        star: { color: 0xF0E68C, diameter: 1400000 },
        planets: [
            { name: 'Querious V', type: 'rocky', diameter: 11000, distance: 11000, color: 0xCD853F },
        ],
        asteroidBeltType: 'exceptional',
    },
    12: {
        name: 'Aridia',
        star: { color: 0xFFE4B5, diameter: 1300000 },
        planets: [
            { name: 'Aridia III', type: 'desert', diameter: 7500, distance: 7500, color: 0xF5DEB3 },
        ],
        asteroidBeltType: 'rich',
    },
    // New Low-Sec/Null-Sec stations
    14: {
        name: 'Tama',
        star: { color: 0xFF8C00, diameter: 950000 },
        planets: [
            { name: 'Tama V', type: 'barren', diameter: 9000, distance: 14000, color: 0xA0522D },
        ],
        station: { name: 'Tama V - Moon 1 Smuggler Den', orbitsPlanetIndex: 0, orbitDistance: 300 },
        asteroidBeltType: 'rich',
    },
    19: {
        name: 'Stain',
        star: { color: 0x8B0000, diameter: 2200000 },
        planets: [
            { name: 'LGK-VP I', type: 'lava', diameter: 15000, distance: 16000, color: 0xB22222 },
        ],
        station: { name: 'LGK-VP - Sansha\'s Nation Fortress', orbitsPlanetIndex: 0, orbitDistance: 600 },
        asteroidBeltType: 'exceptional',
    },
    20: {
        name: 'Venal',
        star: { color: 0x00BFFF, diameter: 1900000 },
        planets: [
            { name: 'Venal I', type: 'ice', diameter: 18000, distance: 10000, color: 0x5F9EA0 },
            { name: '6-CZ49', type: 'gas', diameter: 70000, distance: 30000, color: 0x00CED1 },
        ],
        station: { name: '6-CZ49 - Guristas Assembly Plant', orbitsPlanetIndex: 1, orbitDistance: 500 },
        asteroidBeltType: 'exceptional',
    },
    21: {
        name: 'Syndicate',
        star: { color: 0x9370DB, diameter: 1400000 },
        planets: [
            { name: 'X-7OMU II', type: 'rocky', diameter: 11000, distance: 12000, color: 0x778899 },
        ],
        station: { name: 'X-7OMU - Intaki Syndicate Station', orbitsPlanetIndex: 0, orbitDistance: 450 },
        asteroidBeltType: 'rich',
    },
    27: {
        name: 'Test',
        star: { color: 0xFF4500, diameter: 800000 },
        planets: [],
        asteroidBeltType: 'dense',
        piratePresence: 'low',
    },
    28: {
        name: 'Test2',
        star: { color: 0xFF6347, diameter: 900000 },
        planets: [],
        asteroidBeltType: 'rich',
        piratePresence: 'medium',
    },
    29: {
        name: 'Test3',
        star: { color: 0xDC143C, diameter: 1000000 },
        planets: [],
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    // Easter Egg System
    999: {
        name: 'bzzc',
        star: { color: 0x00ff00, diameter: 500000 },
        planets: [
            { name: 'Pe3k Prime', type: 'terran', diameter: 15000, distance: 10000, color: 0x663399 },
        ],
        station: { name: "Pe3k's Rest", orbitsPlanetIndex: 0, orbitDistance: 500 },
        asteroidBeltType: 'sparse',
    },
};

export const DOCKED_BACKGROUND_IMAGES: string[] = [
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/c68cb4239c8d4f6a7a28d93e94e2eccc634a435c/Pictures/Fly.gif',
'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/2aee28e697a6268b028c318a2ffb4ef128a3a10d/Pictures/Skills.png',
'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/c555be3672cc6d0e19ebcc129e521a806795c2c3/Pictures/FirstBlood.png',
'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/main/Pictures/WeWantYou9.png',
'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/ee256151fe73f508b8f6cb8a86a842858156adc3/Pictures/MonkiesVsPirates2.png',
'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/main/Pictures/WeWantYou9.gif',
];


// FIX: `INITIAL_PLAYER_STATE` was used before it was defined.
// To resolve this, `initialPlayerShipId` is declared first and used
// to derive `initialShip` and `initialHP`, which are then used to
// construct the full `INITIAL_PLAYER_STATE` object.
const initialPlayerShipId = 'ship_rookie';
const initialShip = SHIP_DATA[initialPlayerShipId];
const initialHP = {
    shield: initialShip.attributes.shield,
    maxShield: initialShip.attributes.shield,
    armor: initialShip.attributes.armor,
    maxArmor: initialShip.attributes.armor,
    hull: initialShip.attributes.hull,
    maxHull: initialShip.attributes.hull,
};

export const INITIAL_PLAYER_STATE: PlayerState = {
    playerName: '',
    isk: 10000000000,
    homeStationId: 'station_1_Titan_Station',
    currentShipId: initialPlayerShipId,
    shipHP: initialHP,
    currentShipFitting: {
        high: ['mod_miner_i', null],
        medium: [null, null],
        low: [null],
        rig: [],
    },
    shipCargo: {
        items: [],
        materials: {},
    },
    droneBayCargo: [],
    assetHangar: {
        items: [],
        materials: {}
    },
    stationHangars: {
        'station_1_Titan_Station': {
            items: [
                'bp_rifter',
                'bp_venture',
                'bp_miner_i',
                'bp_shield_extender',
                'bp_microwarpdrive',
                'bp_fusion_s',
                'bp_drone_bay_s',
                'bp_drone_combat_s_i',
                'bp_drone_mining_s_i',
            ],
            materials: {}
        }
    },
    skills: {},
    activeMissions: [],
};

const ALL_ITEM_DATA = {
    ...SHIP_DATA,
    ...BLUEPRINT_DATA,
    ...ORE_DATA,
    ...MINERAL_DATA,
    ...MODULE_DATA,
    ...OTHER_ITEM_DATA,
};

export function getItemData(itemId: string): ItemData | undefined {
    if (!itemId) return undefined;
    // This lookup requires all data files to use the item's ID as its key.
    return ALL_ITEM_DATA[itemId] as ItemData | undefined;
}
