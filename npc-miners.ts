// npc-miners.ts
import * as THREE from 'three';
import type { NpcMiner, Ship, SolarSystemData, Ore, Module, StorageLocation } from './types';
import { SHIP_DATA, getItemData } from './constants';

const MINER_SPEED = 100;
const MINER_WARP_SPEED = 5000; // Much faster speed to simulate warping
const MINING_RANGE = 1500;
const DOCKING_RANGE = 500;
const UNDOCK_DISTANCE = 800;
const IDLE_COOLDOWN = 30; // seconds

export function updateNpcMiners(
    miners: NpcMiner[],
    asteroids: THREE.Mesh[],
    delta: number,
    systemId: number
): { stationId: string; soldCargo: StorageLocation }[] {
    const soldPayloads: { stationId: string; soldCargo: StorageLocation }[] = [];

    miners.forEach(miner => {
        const position = miner.object3D.position;
        const cargoCapacity = miner.shipData.attributes.cargoCapacity + (miner.shipData.attributes.oreHold || 0);
        
        switch (miner.state) {
            case 'IDLE':
                miner.idleTimer -= delta;
                if (miner.idleTimer <= 0) {
                    miner.state = 'UNDOCKING';
                    miner.homeStation.getWorldPosition(miner.object3D.position);
                    miner.object3D.visible = true;
                }
                break;
            case 'UNDOCKING':
                const targetWorldPos = new THREE.Vector3();
                if (miner.homeStation.parent) {
                    targetWorldPos.copy(miner.undockPosition);
                    miner.homeStation.parent.localToWorld(targetWorldPos);
                } else {
                    targetWorldPos.copy(miner.undockPosition);
                }

                if (position.distanceTo(targetWorldPos) < 50) {
                    miner.state = 'TRAVELING_TO_BELT';
                } else {
                    const direction = new THREE.Vector3().subVectors(targetWorldPos, position).normalize();
                    miner.object3D.position.add(direction.multiplyScalar(MINER_SPEED * delta));
                    miner.object3D.lookAt(targetWorldPos);
                }
                break;
            case 'TRAVELING_TO_BELT':
                if (!miner.miningTarget || !miner.miningTarget.visible || miner.miningTarget.userData.oreQuantity <= 0) {
                    if (miner.miningTarget) {
                        miner.miningTarget.userData.isTargetedByMiner = false;
                    }

                    const availableAsteroids = asteroids.filter(a => a.visible && !a.userData.isTargetedByMiner && a.userData.oreQuantity > 0);
                    if (availableAsteroids.length > 0) {
                        miner.miningTarget = availableAsteroids.sort((a, b) => a.position.distanceTo(position) - b.position.distanceTo(position))[0];
                        miner.miningTarget.userData.isTargetedByMiner = true;
                    } else {
                        miner.state = 'RETURNING_TO_STATION';
                        break;
                    }
                }
                
                const targetPos = miner.miningTarget.position;
                if (position.distanceTo(targetPos) < MINING_RANGE) {
                    miner.state = 'MINING';
                    const firstMiner = miner.fitting.high.map(id => id ? getItemData(id) as Module : null).find(m => m !== null);
                    miner.miningCycleTimer = firstMiner?.attributes.cycleTime || 60;
                } else {
                    const direction = new THREE.Vector3().subVectors(targetPos, position).normalize();
                    miner.object3D.position.add(direction.multiplyScalar(MINER_WARP_SPEED * delta));
                    miner.object3D.lookAt(targetPos);
                }
                break;
            case 'MINING':
                let currentCargoVolume = 0;
                Object.entries(miner.cargo.materials).forEach(([oreId, qty]) => {
                    currentCargoVolume += (getItemData(oreId)?.volume || 0.1) * qty;
                });

                // --- PRE-MINING CHECKS (EVERY FRAME) ---
                // Condition 1: Cargo is full. Go home immediately.
                if (currentCargoVolume >= cargoCapacity) {
                    if (miner.miningTarget) miner.miningTarget.userData.isTargetedByMiner = false;
                    miner.miningTarget = null;
                    miner.state = 'RETURNING_TO_STATION';
                    break;
                }

                // Condition 2: Target is invalid/depleted. Find a new one.
                if (!miner.miningTarget || !miner.miningTarget.visible || miner.miningTarget.userData.oreQuantity <= 0) {
                    if (miner.miningTarget) miner.miningTarget.userData.isTargetedByMiner = false;
                    miner.miningTarget = null;
                    miner.state = 'TRAVELING_TO_BELT';
                    break;
                }

                // --- If checks pass, proceed with mining cycle ---
                miner.miningCycleTimer -= delta;

                if (miner.miningCycleTimer <= 0) {
                    // A cycle is complete.
                    const firstMinerModule = miner.fitting.high.map(id => id ? getItemData(id) as Module : null).find(m => m !== null);
                    miner.miningCycleTimer += firstMinerModule?.attributes.cycleTime || 60;

                    const oreData = miner.miningTarget.userData.ore as Ore;
                    const oreVolumePerUnit = oreData.volume || 0.1;
                    
                    const availableSpace = Math.max(0, cargoCapacity - currentCargoVolume);
                    const maxUnitsThatCanFit = Math.floor(availableSpace / oreVolumePerUnit);
                    
                    const amountToMine = Math.min(
                        miner.yieldPerCycle,
                        miner.miningTarget.userData.oreQuantity,
                        maxUnitsThatCanFit
                    );

                    if (amountToMine > 0) {
                        miner.cargo.materials[oreData.id] = (miner.cargo.materials[oreData.id] || 0) + amountToMine;
                        miner.miningTarget.userData.oreQuantity -= amountToMine;
                    }
                }
                break;
            case 'RETURNING_TO_STATION':
                 if (miner.miningTarget) {
                    miner.miningTarget.userData.isTargetedByMiner = false;
                    miner.miningTarget = null;
                }
                const stationPos = new THREE.Vector3();
                miner.homeStation.getWorldPosition(stationPos);
                if (position.distanceTo(stationPos) < DOCKING_RANGE) {
                    miner.state = 'DOCKING';
                } else {
                    const direction = new THREE.Vector3().subVectors(stationPos, position).normalize();
                    miner.object3D.position.add(direction.multiplyScalar(MINER_WARP_SPEED * delta));
                    miner.object3D.lookAt(stationPos);
                }
                break;
            case 'DOCKING':
                miner.object3D.visible = false;
                
                if (Object.keys(miner.cargo.materials).length > 0) {
                    const stationId = `station_${systemId}_${miner.homeStation.userData.name.replace(/ /g, '_')}`;
                    // Create a deep copy of the cargo. This prevents any potential race conditions or
                    // reference issues where the cargo object might be cleared before the main
                    // game state processes the sold payload.
                    const soldCargoCopy = JSON.parse(JSON.stringify(miner.cargo));
                    soldPayloads.push({ stationId, soldCargo: soldCargoCopy });
                }

                // Clear the miner's cargo for its next trip and reset its state.
                miner.cargo = { items: [], materials: {} }; 
                miner.idleTimer = IDLE_COOLDOWN;
                miner.state = 'IDLE';
                break;
        }
    });

    return soldPayloads;
}