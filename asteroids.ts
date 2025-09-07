import * as THREE from 'three';
import type { SolarSystemData, AsteroidBeltType } from './types';
import { ORE_DATA } from './ores';

function getWeightedRandomOre(distribution: Record<string, number>): string {
    const total = Object.values(distribution).reduce((sum, weight) => sum + weight, 0);
    let rand = Math.random() * total;
    for (const ore in distribution) {
        rand -= distribution[ore];
        if (rand <= 0) return ore;
    }
    return Object.keys(distribution)[0]; // Fallback
}

export function createAsteroidBelt(
    systemData: SolarSystemData,
    asteroidBeltTypes: Record<string, AsteroidBeltType>
): THREE.Mesh[] {
    const beltData = systemData.asteroidBeltType ? asteroidBeltTypes[systemData.asteroidBeltType] : undefined;
    if (!beltData) return [];

    const asteroids: THREE.Mesh[] = [];
    const [minCount, maxCount] = beltData.asteroidCount;
    const asteroidCount = THREE.MathUtils.randInt(minCount, maxCount);
    
    // Determine belt radius based on planets
    const lastPlanetDistance = systemData.planets.length > 0 
        ? systemData.planets[systemData.planets.length - 1]!.distance 
        : 8000; // Default distance if no planets
    const innerRadius = lastPlanetDistance + 2000;
    const outerRadius = innerRadius + 5000;


    const baseAsteroidGeom = new THREE.IcosahedronGeometry(1, 1);
    const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });

    for (let i = 0; i < asteroidCount; i++) {
        const asteroidGeom = baseAsteroidGeom.clone();
        const positionAttribute = asteroidGeom.getAttribute('position');
        
        // Deform geometry to make it look like an asteroid
        for (let j = 0; j < positionAttribute.count; j++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, j);
            vertex.multiplyScalar(1 + Math.random() * 0.4);
            positionAttribute.setXYZ(j, vertex.x, vertex.y, vertex.z);
        }
        
        const asteroid = new THREE.Mesh(asteroidGeom, asteroidMaterial);
        
        // Position asteroid in the belt
        const angle = Math.random() * Math.PI * 2;
        const radius = THREE.MathUtils.randFloat(innerRadius, outerRadius);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = THREE.MathUtils.randFloatSpread(200);
        asteroid.position.set(x, y, z);
        
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        asteroid.scale.setScalar(THREE.MathUtils.randFloat(15, 40));
        
        const oreType = getWeightedRandomOre(beltData.oreDistribution);
        const oreData = ORE_DATA[oreType];
        
        if (oreData) {
            const oreQuantity = THREE.MathUtils.randInt(5000, 25000);
            asteroid.userData = { 
                type: 'asteroid', 
                ore: oreData, 
                oreQuantity: oreQuantity 
            };
        }
        
        asteroids.push(asteroid);
    }
    
    return asteroids;
}