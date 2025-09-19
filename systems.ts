// systems.ts
import type { SolarSystemData } from './types';

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
        station: { name: 'Titan Station', orbitsPlanetIndex: 2, orbitDistance: 400, type: 'standard' },
        asteroidBeltType: 'moderate',
    },
    2: {
        name: 'Jita',
        star: { color: 0xFFF0DD, diameter: 1700000 },
        planets: [
             { name: 'Jita IV', type: 'gas', diameter: 50000, distance: 10000, color: 0xFFA500 },
             { name: 'Jita V', type: 'rocky', diameter: 8000, distance: 15000, color: 0x8B4513 },
        ],
        station: { name: 'Jita IV-4 Trade Hub', orbitsPlanetIndex: 0, orbitDistance: 800, type: 'standard' },
        asteroidBeltType: 'rich',
    },
    3: {
        name: 'Amarr',
        star: { color: 0xFFD700, diameter: 1800000 },
        planets: [
             { name: 'Amarr I', type: 'terran', diameter: 14000, distance: 13000, color: 0xB8860B },
        ],
        station: { name: 'Amarr Imperial Palace', orbitsPlanetIndex: 0, orbitDistance: 600, type: 'standard' },
        asteroidBeltType: 'moderate',
    },
    4: {
        name: 'Dodixie',
        star: { color: 0xADD8E6, diameter: 1600000 },
        planets: [
             { name: 'Dodixie IX', type: 'ice', diameter: 22000, distance: 20000, color: 0xADD8E6 },
        ],
        station: { name: 'Dodixie IX - Moon 20', orbitsPlanetIndex: 0, orbitDistance: 700, type: 'standard' },
        asteroidBeltType: 'moderate',
    },
    5: {
        name: 'Hek',
        star: { color: 0xFF4500, diameter: 1100000 },
        planets: [
            { name: 'Hek IV', type: 'lava', diameter: 11000, distance: 13000, color: 0xCF1020 },
            { name: 'Hek VIII', type: 'barren', diameter: 7000, distance: 19000, color: 0x999999 },
        ],
        station: { name: 'Hek VIII - Moon 12 Trade Hub', orbitsPlanetIndex: 1, orbitDistance: 400, type: 'standard' },
        asteroidBeltType: 'dense',
        piratePresence: 'low',
    },
    6: {
        name: 'Rens',
        star: { color: 0xFF6347, diameter: 1200000 },
        planets: [
             { name: 'Rens VI', type: 'lava', diameter: 9000, distance: 9000, color: 0xDC143C },
        ],
        station: { name: 'Rens VI - Moon 8', orbitsPlanetIndex: 0, orbitDistance: 350, type: 'standard' },
        asteroidBeltType: 'dense',
    },
    7: {
        name: 'Nul',
        star: { color: 0x8A2BE2, diameter: 900000 },
        planets: [
            { name: 'Nul IV', type: 'gas', diameter: 45000, distance: 22000, color: 0x4B0082 },
        ],
        asteroidBeltType: 'exceptional',
        piratePresence: 'medium',
    },
    8: {
        name: 'Rancer',
        star: { color: 0xFF0000, diameter: 800000 },
        planets: [
             { name: 'Rancer I', type: 'barren', diameter: 4000, distance: 4000, color: 0x808080 },
        ],
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    9: {
        name: 'Provi',
        star: { color: 0x00FFFF, diameter: 2100000 },
        planets: [
             { name: 'Providence VII', type: 'gas', diameter: 60000, distance: 25000, color: 0x40E0D0 },
        ],
        station: { name: '9UY4-H Providence Fortress', orbitsPlanetIndex: 0, orbitDistance: 900, type: 'standard' },
        asteroidBeltType: 'rich',
    },
    10: {
        name: 'Delve',
        star: { color: 0xFFFFFF, diameter: 1500000 },
        planets: [
            { name: 'Delve X', type: 'ice', diameter: 18000, distance: 16000, color: 0xE0FFFF },
        ],
        station: { name: '1DQ1-A Keepstar', orbitsPlanetIndex: 0, orbitDistance: 650, type: 'standard' },
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
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
    13: {
        name: 'Obe',
        star: { color: 0xF0F8FF, diameter: 1650000 },
        planets: [
            { name: 'Obe VII', type: 'terran', diameter: 13500, distance: 14000, color: 0x3CB371 },
        ],
        station: { name: 'Obe VII - Moon 3 Refinery', orbitsPlanetIndex: 0, orbitDistance: 450, type: 'standard' },
        asteroidBeltType: 'rich',
    },
    14: {
        name: 'Tama',
        star: { color: 0xFF8C00, diameter: 950000 },
        planets: [
            { name: 'Tama V', type: 'barren', diameter: 9000, distance: 14000, color: 0xA0522D },
        ],
        station: { name: 'Tama V - Moon 1 Smuggler Den', orbitsPlanetIndex: 0, orbitDistance: 300, type: 'standard' },
        asteroidBeltType: 'rich',
        piratePresence: 'medium',
    },
    15: {
        name: 'Iralan',
        star: { color: 0xFF7F50, diameter: 1150000 },
        planets: [
            { name: 'Iralan II', type: 'lava', diameter: 9500, distance: 8000, color: 0xFF4500 },
        ],
        asteroidBeltType: 'rich',
        piratePresence: 'medium',
    },
    16: {
        name: 'PF-346',
        star: { color: 0x483D8B, diameter: 750000 },
        planets: [],
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    17: {
        name: 'Esoteria',
        star: { color: 0x00008B, diameter: 2300000 },
        planets: [
            { name: 'Esoteria VI', type: 'gas', diameter: 80000, distance: 35000, color: 0x191970 },
        ],
        station: { name: 'C-J6MT - Drone Bounteplex', orbitsPlanetIndex: 0, orbitDistance: 1200, type: 'standard' },
        asteroidBeltType: 'exceptional',
    },
    18: {
        name: 'Fountain',
        star: { color: 0x20B2AA, diameter: 1800000 },
        planets: [],
        asteroidBeltType: 'exceptional',
    },
    19: {
        name: 'Stain',
        star: { color: 0x8B0000, diameter: 2200000 },
        planets: [
            { name: 'LGK-VP I', type: 'lava', diameter: 15000, distance: 16000, color: 0xB22222 },
        ],
        station: { name: 'LGK-VP - Sansha\'s Nation Fortress', orbitsPlanetIndex: 0, orbitDistance: 600, type: 'standard' },
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    20: {
        name: 'Venal',
        star: { color: 0x00BFFF, diameter: 1900000 },
        planets: [
            { name: 'Venal I', type: 'ice', diameter: 18000, distance: 10000, color: 0x5F9EA0 },
            { name: '6-CZ49', type: 'gas', diameter: 70000, distance: 30000, color: 0x00CED1 },
        ],
        station: { name: '6-CZ49 - Guristas Assembly Plant', orbitsPlanetIndex: 1, orbitDistance: 500, type: 'standard' },
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    21: {
        name: 'Syndicate',
        star: { color: 0x9370DB, diameter: 1400000 },
        planets: [
            { name: 'X-7OMU II', type: 'rocky', diameter: 11000, distance: 12000, color: 0x778899 },
        ],
        station: { name: 'X-7OMU - Intaki Syndicate Station', orbitsPlanetIndex: 0, orbitDistance: 450, type: 'standard' },
        asteroidBeltType: 'rich',
        piratePresence: 'medium',
    },
    22: {
        name: 'Curse',
        star: { color: 0xFF2400, diameter: 1950000 },
        planets: [
            { name: 'G-G78M V', type: 'barren', diameter: 10000, distance: 20000, color: 0x555555 },
        ],
        station: { name: 'G-G78M - Angel Cartel Logistics', orbitsPlanetIndex: 0, orbitDistance: 500, type: 'standard' },
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    },
    23: {
        name: 'Great Wildlands',
        star: { color: 0xDAA520, diameter: 2000000 },
        planets: [],
        asteroidBeltType: 'exceptional',
    },
    24: {
        name: 'Outer Ring',
        star: { color: 0x4682B4, diameter: 1400000 },
        planets: [
            { name: '4C-B7X III', type: 'ice', diameter: 25000, distance: 17000, color: 0xB0C4DE },
        ],
        station: { name: '4C-B7X - ORE Development Plant', orbitsPlanetIndex: 0, orbitDistance: 700, type: 'standard' },
        asteroidBeltType: 'rich',
    },
    25: {
        name: 'The Citadel',
        star: { color: 0xAFEEEE, diameter: 1750000 },
        planets: [
            { name: 'Onnamon IV', type: 'terran', diameter: 14500, distance: 15500, color: 0x48D1CC },
        ],
        station: { name: 'J211936 - The Citadel', orbitsPlanetIndex: 0, orbitDistance: 550, type: 'standard' },
        asteroidBeltType: 'rich',
        piratePresence: 'low',
    },
    26: {
        name: 'Lonetrek',
        star: { color: 0xB0E0E6, diameter: 1600000 },
        planets: [
            { name: 'Lonetrek IX', type: 'gas', diameter: 55000, distance: 23000, color: 0x87CEEB },
        ],
        station: { name: 'A-64Y2 - Caldari Navy Outpost', orbitsPlanetIndex: 0, orbitDistance: 850, type: 'standard' },
        asteroidBeltType: 'moderate',
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
        station: { name: "Pe3k's Rest", orbitsPlanetIndex: 0, orbitDistance: 500, type: 'standard' },
        asteroidBeltType: 'sparse',
    },
    1000: {
        name: 'DevTools',
        star: { color: 0x00FF00, diameter: 1000000 },
        planets: [
            { name: 'Sandbox I', type: 'rocky', diameter: 10000, distance: 15000, color: 0xcccccc },
        ],
        station: {
            name: 'Testing Grounds',
            orbitsPlanetIndex: 0,
            orbitDistance: 500,
            type: 'testing'
        },
    },
};

// --- Procedurally Generated Systems ---
const newSystems: Record<number, SolarSystemData> = {};
const planetTypes = ['barren', 'ice', 'lava', 'gas', 'rocky'];
const namePrefixes = ['X', 'Z', 'V', 'K', 'N', 'M'];
const nameConnectors = ['-', '7', '9', '2', '4'];
const nameSuffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

for (let i = 0; i < 100; i++) {
    const systemId = 30 + i;
    const name = `${namePrefixes[Math.floor(Math.random() * namePrefixes.length)]}${Math.floor(Math.random() * 90) + 10}${nameConnectors[Math.floor(Math.random() * nameConnectors.length)]}-${nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]}`;

    const numPlanets = Math.floor(Math.random() * 7); // 0 to 6 planets
    const planets = [];
    let lastDistance = 2000 + Math.random() * 3000;
    for (let j = 0; j < numPlanets; j++) {
        const distance = lastDistance + 5000 + Math.random() * 10000;
        lastDistance = distance;
        planets.push({
            name: `${name} ${j + 1}`,
            type: planetTypes[Math.floor(Math.random() * planetTypes.length)],
            diameter: 4000 + Math.random() * (j > 3 ? 60000 : 20000), // Gas giants are further out
            distance: distance,
            color: Number(`0x${Math.floor(Math.random()*16777215).toString(16)}`),
        });
    }

    newSystems[systemId] = {
        name,
        star: {
            color: Number(`0x${Math.floor(Math.random()*16777215).toString(16)}`),
            diameter: 800000 + Math.random() * 1200000,
        },
        planets,
        asteroidBeltType: 'exceptional',
        piratePresence: 'high',
    };
}
// Merge new systems with existing data
Object.assign(SOLAR_SYSTEM_DATA, newSystems);
