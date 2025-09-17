// types.ts

import type * as THREE from 'three';

// --- ENUMS & LITERALS ---

export enum GameState {
    GALAX_MAP = 'GALAXY_MAP',
    SOLAR_SYSTEM = 'SOLAR_SYSTEM',
    DOCKED = 'DOCKED',
    TRANSITIONING = 'TRANSITIONING',
}

export type ItemCategory = 'Ship' | 'Module' | 'Material' | 'Blueprint' | 'Ore' | 'Mineral' | 'Component' | 'Consumable' | 'Ammunition' | 'Structure' | 'Drone';

export type ConsoleMessageType = 'damage_in' | 'damage_out' | 'mining' | 'loot' | 'repair' | 'system' | 'bounty';

// --- UI & SCENE DATA ---

export interface ConsoleMessage {
    timestamp: string;
    text: string;
    type: ConsoleMessageType;
}

export interface TooltipData {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

export interface Target {
    uuid: string;
    object3D: THREE.Object3D;
    name: string;
    type: 'star' | 'planet' | 'station' | 'asteroid' | 'pirate' | 'wreck';
    distance: number;
    oreQuantity?: number;
    shipName?: string;
    hp?: {
        shield: number;
        maxShield: number;
        armor: number;
        maxArmor: number;
        hull: number;
        maxHull: number;
    };
    loot?: AnyItem[];
}

export interface TargetData {
    object: THREE.Object3D | null; // This is for the reticle (hover target)
    screenX: number;
    screenY: number;
    selectedTarget: Target | null; // This is for the clicked/locked target
}

export interface DockingData {
    visible: boolean;
    distance: number;
}

export interface NavObject {
    name: string;
    type: 'star' | 'planet' | 'station' | 'asteroid' | 'pirate' | 'wreck';
    object3D: THREE.Object3D;
    parent?: THREE.Object3D;
}

export interface NavPanelItem {
    uuid: string;
    name: string;
    type: 'star' | 'planet' | 'station' | 'asteroid' | 'pirate' | 'wreck';
    distance: number;
    distanceStr: string;
    parentUUID?: string;
}


// --- SKILLS ---

export interface SkillEffect {
    type: string; // e.g., 'miningYieldBonus', 'reprocessingEfficiencyBonus', 'weaponDamageBonus'
    value: number; // e.g., 0.05 for a 5% bonus
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    rank: number;
    effects: SkillEffect[];
}

export interface PlayerSkill {
    level: number;
    xp: number;
}


// --- PLAYER & INVENTORY ---

export interface ShipFitting {
    high: (string | null)[];
    medium: (string | null)[];
    low: (string | null)[];
    rig: (string | null)[];
}

export interface StorageLocation {
    items: string[];
    materials: Record<string, number>;
}

export interface PlayerState {
    playerName: string;
    isk: number;
    homeStationId: string;
    currentShipId: string;
    shipHP: {
        shield: number;
        maxShield: number;
        armor: number;
        maxArmor: number;
        hull: number;
        maxHull: number;
        capacitor: number;
        maxCapacitor: number;
    };
    currentShipFitting: ShipFitting;
    shipCargo: StorageLocation;
    droneBayCargo: string[];
    assetHangar: StorageLocation;
    stationHangars: Record<string, StorageLocation>;
    skills: Record<string, PlayerSkill>;
    activeMissions: MissionData[];
}


// --- AGENTS & MISSIONS ---

export interface AgentData {
    id: string; // stationId
    name: string;
    corporation: string;
    backstory: string;
}

export interface MissionData {
    id: string; // e.g., stationId-agentName-missionTitle-timestamp
    agent: AgentData;
    stationId: string;
    type: 'mining' | 'combat';
    title: string;
    description: string;
    objectives: Record<string, number>; // e.g., { 'ore_veldspar': 5000 } or { 'destroy_pirate_small': 3 }
    progress?: Record<string, number>;
    rewards: {
        isk?: number;
        items?: { id: string; quantity: number }[];
    };
    status: 'offered' | 'accepted';
}


// --- WORLD & CELESTIALS ---

export interface GalaxySystemData {
    id: number;
    name: string;
    security: number;
    x: number;
    y: number;
}

export interface GalaxyJumpData {
    from: number;
    to: number;
}

export interface GalaxyData {
    systems: GalaxySystemData[];
    jumps: GalaxyJumpData[];
}

export interface PlanetData {
    name:string;
    type: string;
    diameter: number;
    distance: number;
    color: number;
    rings?: {
        inner: number;
        outer: number;
    };
}

export interface StationData {
    name: string;
    orbitsPlanetIndex: number;
    orbitDistance: number;
    orbitHeight?: number;
    type?: 'standard' | 'testing';
}

export interface SolarSystemData {
    name: string;
    star: {
        color: number;
        diameter: number;
    };
    planets: PlanetData[];
    station?: StationData;
    asteroidBeltType?: string;
    piratePresence?: 'low' | 'medium' | 'high';
}

// --- ITEMS ---

export interface BaseItem {
    id: string;
    name: string;
    category: ItemCategory;
    description?: string;
    basePrice?: number;
    volume?: number;
    icon?: string;
}

export interface Ore extends BaseItem {
    category: 'Ore';
    refineYield: Record<string, number>;
    security: number;
    rarity: string;
}

export interface Mineral extends BaseItem {
    category: 'Mineral';
}

export interface Module extends BaseItem {
    category: 'Module';
    subcategory: string;
    slot: 'high' | 'medium' | 'low' | 'rig';
    size: 'small' | 'medium' | 'large' | 'all' | 'capital';
    meta: number;
    attributes: Record<string, any>;
    damageType?: Record<string, number>;
    requirements: {
        skills: Record<string, number>;
    };
    reprocessingYield?: Record<string, number>;
}

export interface Ammunition extends BaseItem {
    category: 'Ammunition';
    type: string;
    size: string;
    damageModifier?: number;
    rangeModifier?: number;
    damage?: number;
    damageType: Record<string, number>;
    durability?: number;
    reprocessingYield?: Record<string, number>;
}

export interface Drone extends BaseItem {
    category: 'Drone';
    size: 'small' | 'medium' | 'large';
    attributes: {
        hp: number;
        damage?: number; // DPS
        miningYield?: number; // m3 per cycle
        cycleTime?: number; // in seconds
        speed: number;
        orbitDistance: number;
        bandwidthUsage: number;
    };
    reprocessingYield?: Record<string, number>;
}


export type AnyItem = BaseItem | Ore | Mineral | Ship | Blueprint | Module | Ammunition | Drone;

export interface ItemData extends BaseItem {
    // This is a generic type for lookup, specific types are used in data files
    [key: string]: any;
}


// --- MINING & REFINING ---

export interface AsteroidBeltType {
    name: string;
    asteroidCount: [number, number];
    oreDistribution: Record<string, number>;
    respawnTime: number;
}

export interface MiningModifiers {
    shipBonus: Record<string, number>;
    moduleBonus: Record<string, number>;
    skillBonus: Record<string, number>;
}

export interface RefiningEfficiency {
    base: number;
    stationBonus: Record<string, number>;
    skillBonus: Record<string, number>;
    maxEfficiency: number;
}


// --- SHIPS ---

export interface ShipBonus {
    type: string;
    value: number;
    perLevel?: boolean;
    flat?: boolean;
}

export interface Ship extends BaseItem {
    category: 'Ship';
    class: string;
    race: string;
    tier: string;
    attributes: {
        hull: number;
        armor: number;
        shield: number;
        capacitor: number;
        capacitorRechargeRate: number; // in GJ/sec
        powerGrid: number;
        cpu: number;
        speed: number;
        agility: number;
        warpSpeed: number;
        cargoCapacity: number;
        oreHold?: number;
        fleetHangar?: number;
        shipMaintenanceBay?: number;
        droneBandwidth: number;
        droneBay: number;
    };
    slots: {
        high: number;
        medium: number;
        low: number;
        rig: number;
    };
    bonuses: ShipBonus[];
    requirements: {
        skills: Record<string, number>;
    };
}

export interface ShipClass {
    size: string;
    massMultiplier: number;
    signatureRadius: number;
    maxRigSize: string;
}

export interface ShipSkill {
    name: string;
    description: string;
    rank: number;
    primaryAttribute: string;
    secondaryAttribute: string;
}

// --- MANUFACTURING & BLUEPRINTS ---

export interface Blueprint extends BaseItem {
    category: 'Blueprint';
    outputItem: string;
    outputQuantity: number;
    manufacturingTime: number; // in seconds
    materials: Record<string, number>;
    skills: Record<string, number>;
    facilityBonus: Record<string, number>;
}

export interface BlueprintResearchData {
    [key: string]: {
        name: string;
        description: string;
        maxLevel?: number;
        costPerLevel?: (level: number) => number;
        timePerLevel?: (level: number) => number;
        bonusPerLevel?: number;
        maxRuns?: number;
        costPerRun?: number;
        timePerRun?: number;
        successChance?: number;
        cost?: number;
        time?: number;
        requirements?: {
            skills: Record<string, number>;
        };
    };
}

export interface ManufacturingSkill {
    name: string;
    description: string;
    rank: number;
    bonusPerLevel: number;
}

export interface ManufacturingFacility {
    name: string;
    materialBonus: number;
    timeBonus: number;
    costMultiplier: number;
    maxJobs: number;
    specialization?: string;
}