// constants.ts
import type { PlayerState, GalaxyData, ItemData, CorporationData } from './types';
import { ShipData } from './ships';
import { BlueprintData } from './blueprints';
import { ORE_DATA, MINERAL_DATA } from './ores';
import { MODULE_DATA, OTHER_ITEM_DATA } from './modules';
import { SOLAR_SYSTEM_DATA } from './systems';

// Re-exporting for App.tsx with the expected names
export const SHIP_DATA = ShipData;
export const BLUEPRINT_DATA = BlueprintData;
export { SOLAR_SYSTEM_DATA };

// --- Procedurally Generated Galaxy Data ---
const newGalaxySystems = [];
for (let i = 0; i < 100; i++) {
    const systemId = 30 + i;
    // Get the name from SOLAR_SYSTEM_DATA to ensure consistency
    const name = SOLAR_SYSTEM_DATA[systemId]?.name || `NS-${i}`;
    newGalaxySystems.push({
        id: systemId,
        name: name,
        security: 0.0,
        // Place them in a new, distant cluster
        x: (Math.random() - 0.5) * 1000 + 1200, // Cluster far to the right
        y: (Math.random() - 0.5) * 1000,
    });
}

const newJumps: { from: number; to: number }[] = [];
// Connect existing nullsec to the new cluster
const entryPoints = [8, 10, 16, 17, 19, 20, 22, 23, 29]; // Rancer, Delve, Stain, etc.
const newSystemIds = newGalaxySystems.map(s => s.id);

// Create a few gateways from the old world to the new
for(let i=0; i<5; i++) {
    const fromSystem = entryPoints[Math.floor(Math.random() * entryPoints.length)];
    const toSystem = newSystemIds[Math.floor(Math.random() * newSystemIds.length)];
    // Ensure no duplicate jumps are created
    if (!newJumps.some(j => (j.from === fromSystem && j.to === toSystem) || (j.from === toSystem && j.to === fromSystem))) {
        newJumps.push({ from: fromSystem, to: toSystem });
    }
}

// Create internal connections within the new cluster to make it navigable
for (let i = 0; i < 150; i++) { // More jumps than systems for connectivity
    const fromIndex = Math.floor(Math.random() * newSystemIds.length);
    let toIndex = Math.floor(Math.random() * newSystemIds.length);
    // Ensure it's not a jump to itself
    while (fromIndex === toIndex) {
        toIndex = Math.floor(Math.random() * newSystemIds.length);
    }
    const fromSystem = newSystemIds[fromIndex];
    const toSystem = newSystemIds[toIndex];
    // Avoid duplicate jumps
    if (!newJumps.some(j => (j.from === fromSystem && j.to === toSystem) || (j.from === toSystem && j.to === fromSystem))) {
        newJumps.push({ from: fromSystem, to: toSystem });
    }
}


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
        // Dev Tool System
        { id: 1000, name: 'DevTools', security: 1.0, x: 500, y: 500 },
        { id: 1001, name: 'DevToolsNPC', security: 1.0, x: 500, y: -500 },
        // Generated Nullsec Systems
        ...newGalaxySystems,
    ],
    jumps: [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 27 },
        { from: 1, to: 1000 }, // Jump to DevTools
        { from: 1, to: 1001 }, // Jump to NPC DevTools
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
        // Generated Nullsec Jumps
        ...newJumps,
    ]
};

export const DOCKED_BACKGROUND_IMAGES: string[] = [
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/c68cb4239c8d4f6a7a28d93e94e2eccc634a435c/Pictures/Fly.gif',
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/2aee28e697a6268b028c318a2ffb4ef128a3a10d/Pictures/Skills.png',
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/c555be3672cc6d0e19ebcc129e521a806795c2c3/Pictures/FirstBlood.png',
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/main/Pictures/WeWantYou9.png',
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/ee256151fe73f508b8f6cb8a86a842858156adc3/Pictures/MonkiesVsPirates2.png',
    'https://raw.githubusercontent.com/peterbabulik/GalExpl3D/main/Pictures/WeWantYou9.gif',
];

const CLAIM_TIMER_SECONDS = 600; // 10 minutes

export const CORPORATION_DATA: Record<string, CorporationData> = {
    'corp_ore': { 
        id: 'corp_ore', 
        name: 'ORE', 
        isk: 1000000, 
        homeStationId: 'station_1_Titan_Station', // Sol
        claimedSystemId: null,
        assetHangar: { items: [], materials: {} },
        shipsInSpace: [],
        claimTimer: CLAIM_TIMER_SECONDS,
        buyOrders: {},
        buildQueue: [],
    },
    'corp_pirates': { 
        id: 'corp_pirates', 
        name: 'Pirates', 
        isk: 1000000,
        homeStationId: 'station_4_Dodixie_IX_-_Moon_20', // Dodixie
        claimedSystemId: null,
        assetHangar: { items: [], materials: {} },
        shipsInSpace: [],
        claimTimer: CLAIM_TIMER_SECONDS,
        buyOrders: {},
        buildQueue: [],
    },
    'corp_independent': { 
        id: 'corp_independent', 
        name: 'Independent', 
        isk: 1000000,
        homeStationId: 'station_3_Amarr_Imperial_Palace', // Amarr
        claimedSystemId: null,
        assetHangar: { items: [], materials: {} },
        shipsInSpace: [],
        claimTimer: CLAIM_TIMER_SECONDS,
        buyOrders: {},
        buildQueue: [],
    },
    'corp_republic': { 
        id: 'corp_republic', 
        name: 'Republic', 
        isk: 1000000,
        homeStationId: 'station_2_Jita_IV-4_Trade_Hub', // Jita
        claimedSystemId: null,
        assetHangar: { items: [], materials: {} },
        shipsInSpace: [],
        claimTimer: CLAIM_TIMER_SECONDS,
        buyOrders: {},
        buildQueue: [],
    },
    'corp_mining_services': {
        id: 'corp_mining_services',
        name: 'Mining Services',
        isk: 1000000,
        homeStationId: 'station_1_Titan_Station', // Sol
        claimedSystemId: null,
        assetHangar: { items: [], materials: {} },
        shipsInSpace: [],
        claimTimer: CLAIM_TIMER_SECONDS,
        buyOrders: {},
        buildQueue: [],
    },
};

export const FLEET_GOALS: Record<string, Record<string, number>> = {
    'corp_ore': { 'ship_venture': 5, 'ship_retriever': 2, 'ship_merlin': 1 },
    'corp_pirates': { 'ship_rifter': 4, 'ship_stabber': 2, 'ship_tempest': 1, 'ship_venture': 2 },
    'corp_independent': { 'ship_venture': 3, 'ship_rifter': 2, 'ship_vexor': 1 },
    'corp_republic': { 'ship_punisher': 4, 'ship_incursus': 2, 'ship_hurricane': 1, 'ship_venture': 3 },
    'corp_mining_services': { 'ship_venture': 10, 'ship_retriever': 5 },
};

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
    capacitor: initialShip.attributes.capacitor,
    maxCapacitor: initialShip.attributes.capacitor,
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