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
    ],
    jumps: [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
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
    }
};

export const INITIAL_PLAYER_STATE: PlayerState = {
    currentShipId: 'ship_rookie',
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
    blueprints: [
        'bp_rifter', 
        'bp_venture',
        'bp_miner_i', 
        'bp_shield_extender', 
        'bp_microwarpdrive',
        'bp_fusion_s'
    ],
    assetHangar: {
        items: [],
        materials: {}
    },
    stationHangars: {},
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