import * as THREE from 'three';
import type { Ship, AnyItem, Module } from './types';
import { SHIP_DATA, getItemData } from './constants';

export interface Enemy {
    object3D: THREE.Object3D;
    shipData: Ship;
    fitting: {
        high: (string | null)[];
    };
    cargo: {
        items: string[];
        materials: Record<string, number>;
    };
    aiState: 'approaching' | 'orbiting' | 'attacking';
    hp: {
        shield: number; maxShield: number;
        armor: number; maxArmor: number;
        hull: number; maxHull: number;
    };
    bounty: number;
}

const ORBIT_DISTANCE = 500;
const APPROACH_DISTANCE = 1000;
const ENEMY_SPEED = 150; // Slower than player base speed
const ENEMY_AGILITY = 4.0; // Worse than rookie ship

export function spawnEnemies(scene: THREE.Scene, systemId: number): Enemy[] {
    const enemies: Enemy[] = [];
    const systemPirateConfig = {
        27: { type: 'small', count: 3 },  // Test
        28: { type: 'medium', count: 2 }, // Test2
        29: { type: 'large', count: 1 },  // Test3
    };

    const config = systemPirateConfig[systemId];
    if (!config) {
        return [];
    }

    const pirateGeometry = new THREE.ConeGeometry(15, 40, 4);
    const pirateMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.6 });

    for (let i = 0; i < config.count; i++) {
        let shipId: string, fitting: Enemy['fitting'], cargo: Enemy['cargo'], bounty: number, name: string, scale: number;

        switch (config.type) {
            case 'medium':
                shipId = 'ship_hurricane';
                fitting = { high: Array(8).fill('mod_125mm_autocannon_i') };
                cargo = { items: [], materials: { 'ammo_fusion_s': 100 } };
                bounty = 20000;
                name = `Medium Test Pirate ${i + 1}`;
                scale = 2.5;
                break;
            case 'large':
                shipId = 'ship_tempest';
                fitting = { high: Array(8).fill('mod_125mm_autocannon_i') };
                cargo = { items: [], materials: { 'ammo_fusion_s': 100 } };
                bounty = 50000;
                name = `Large Test Pirate ${i + 1}`;
                scale = 4.0;
                break;
            case 'small':
            default:
                shipId = 'ship_rookie';
                fitting = { high: ['mod_125mm_autocannon_i', 'mod_125mm_autocannon_i'] };
                cargo = { items: [], materials: { 'ammo_fusion_s': 1000 } };
                bounty = 5000;
                name = `Small Test Pirate ${i + 1}`;
                scale = 1.0;
                break;
        }
        
        const shipData = SHIP_DATA[shipId];
        if (!shipData) continue;

        const enemyMesh = new THREE.Mesh(pirateGeometry, pirateMaterial);
        enemyMesh.scale.set(scale, scale, scale);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = THREE.MathUtils.randFloat(15000, 20000);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = THREE.MathUtils.randFloatSpread(400);
        enemyMesh.position.set(x, y, z);
        
        const hp = {
            shield: shipData.attributes.shield, maxShield: shipData.attributes.shield,
            armor: shipData.attributes.armor, maxArmor: shipData.attributes.armor,
            hull: shipData.attributes.hull, maxHull: shipData.attributes.hull,
        };

        enemyMesh.userData = {
            type: 'pirate',
            name: name,
            shipName: shipData.name,
            hp: hp,
        };

        scene.add(enemyMesh);

        enemies.push({
            object3D: enemyMesh,
            shipData: shipData,
            fitting: fitting,
            cargo: cargo,
            aiState: 'approaching',
            hp: hp,
            bounty: bounty,
        });
    }

    return enemies;
}

export function updateEnemies(enemies: Enemy[], player: THREE.Object3D, delta: number) {
    if (!player) return;
    
    const playerPosition = player.position;

    enemies.forEach(enemy => {
        const enemyPosition = enemy.object3D.position;
        const distanceToPlayer = enemyPosition.distanceTo(playerPosition);

        // AI State transitions
        if (distanceToPlayer <= APPROACH_DISTANCE) {
            enemy.aiState = 'orbiting';
        } else {
            enemy.aiState = 'approaching';
        }
        
        // --- MOVEMENT ---
        if (enemy.aiState === 'approaching') {
            const vectorToPlayer = new THREE.Vector3().subVectors(playerPosition, enemyPosition).normalize();
            enemy.object3D.position.add(vectorToPlayer.multiplyScalar(ENEMY_SPEED * delta));
        } else { // Orbiting
            const vectorToPlayer = new THREE.Vector3().subVectors(playerPosition, enemy.object3D.position);
            const distance = vectorToPlayer.length();
            vectorToPlayer.normalize();

            const orbitDirection = new THREE.Vector3().crossVectors(vectorToPlayer, new THREE.Vector3(0, 1, 0)).normalize();
            const radialVelocity = (distance - ORBIT_DISTANCE) * 0.1;
            const radialMovement = vectorToPlayer.multiplyScalar(radialVelocity * ENEMY_SPEED * delta);
            const tangentialMovement = orbitDirection.multiplyScalar(ENEMY_SPEED * delta);
            enemy.object3D.position.add(radialMovement).add(tangentialMovement);
        }

        // --- ORIENTATION ---
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(enemy.object3D.position, playerPosition, enemy.object3D.up)
        );
        enemy.object3D.quaternion.slerp(targetQuaternion, (1 / ENEMY_AGILITY) * 3 * delta);
    });
}


export function updateEnemyAttacks(enemies: Enemy[], player: THREE.Object3D): number {
    let totalDamage = 0;
    if (!player) return 0;

    const playerPosition = player.position;

    enemies.forEach(enemy => {
        const distanceToPlayer = enemy.object3D.position.distanceTo(playerPosition);
        
        enemy.fitting.high.forEach(moduleId => {
            if (!moduleId) return;
            const weaponData = getItemData(moduleId) as Module;
            if (!weaponData || !weaponData.attributes.damage) return;
            
            const optimalRange = weaponData.attributes.optimalRange || 0;
            if (distanceToPlayer <= optimalRange) {
                totalDamage += weaponData.attributes.damage;
            }
        });
    });

    return totalDamage;
}


export function createEnemyLoot(scene: THREE.Scene, enemy: Enemy, lastPosition: THREE.Vector3): THREE.Object3D | null {
    const loot: (AnyItem & { quantity?: number })[] = [];

    // 50% chance to drop each fitted module
    enemy.fitting.high.forEach(moduleId => {
        if (moduleId && Math.random() < 0.5) {
            const itemData = getItemData(moduleId);
            if (itemData) loot.push(itemData);
        }
    });

    // 25% chance to drop the ammo stack
    const ammoId = Object.keys(enemy.cargo.materials)[0];
    if (ammoId && Math.random() < 0.25) {
        const itemData = getItemData(ammoId);
        if (itemData) {
            loot.push({ ...itemData, quantity: enemy.cargo.materials[ammoId] });
        }
    }
    
    // If no loot dropped, don't create a wreck.
    if (loot.length === 0) {
        return null;
    }
    
    const wreckGeometry = new THREE.BoxGeometry(20, 20, 20);
    const wreckMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const wreckMesh = new THREE.Mesh(wreckGeometry, wreckMaterial);
    wreckMesh.position.copy(lastPosition);

    wreckMesh.userData = {
        type: 'wreck',
        name: 'Wreck',
        loot: loot,
    };
    
    scene.add(wreckMesh);
    return wreckMesh;
}