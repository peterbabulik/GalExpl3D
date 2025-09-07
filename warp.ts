// warp.ts
import * as THREE from 'three';

const WARP_STOP_DISTANCE = 1000; // m

interface WarpState {
    isWarping: boolean;
    targetObject: THREE.Object3D | null;
    warpSpeed: number;
    onCompleteCallback: (() => void) | null;
}

const warpState: WarpState = {
    isWarping: false,
    targetObject: null,
    warpSpeed: 0,
    onCompleteCallback: null,
};

/**
 * Cleanly stops the warp, fires the callback, and resets the state.
 */
function stopWarp() {
    if (warpState.onCompleteCallback) {
        warpState.onCompleteCallback();
    }
    // Reset state for the next warp
    warpState.isWarping = false;
    warpState.targetObject = null;
    warpState.onCompleteCallback = null;
    warpState.warpSpeed = 0;
}

export function startWarp(player: THREE.Object3D, target: THREE.Object3D, shipSpeed: number, onComplete: () => void) {
    if (warpState.isWarping) return;

    warpState.isWarping = true;
    warpState.targetObject = target;
    warpState.warpSpeed = shipSpeed * 20; // Increased speed for a better warp feel
    warpState.onCompleteCallback = onComplete;

    // Initial orientation snap to face the target
    const targetPosition = target.getWorldPosition(new THREE.Vector3());
    const lookAtPosition = new THREE.Vector3().subVectors(player.position, targetPosition).add(player.position);
    player.lookAt(lookAtPosition);
}

export function updateWarp(player: THREE.Object3D, delta: number): void {
    if (!warpState.isWarping || !warpState.targetObject) {
        return;
    }

    const playerPosition = player.position;
    const targetPosition = warpState.targetObject.getWorldPosition(new THREE.Vector3());

    const vectorToTarget = new THREE.Vector3().subVectors(targetPosition, playerPosition);
    const distanceToTarget = vectorToTarget.length();

    const moveDistance = warpState.warpSpeed * delta;

    // Predictive check: If the next move will reach or pass the stop distance, then stop.
    if (distanceToTarget <= moveDistance + WARP_STOP_DISTANCE) {
        // Arrived. Position player exactly at the stop distance.
        const finalPosition = targetPosition.clone().add(vectorToTarget.normalize().multiplyScalar(-WARP_STOP_DISTANCE));
        player.position.copy(finalPosition);
        
        // Perform a final orientation correction.
        const lookAtPoint = new THREE.Vector3().subVectors(player.position, targetPosition).add(player.position);
        player.lookAt(lookAtPoint);
        
        stopWarp();
        return;
    }

    // --- MOVEMENT ---
    // Move towards the target. vectorToTarget is not normalized yet, so we normalize it here.
    player.position.add(vectorToTarget.normalize().multiplyScalar(moveDistance));

    // --- ORIENTATION ---
    // Continuously update orientation to face the target (handles moving targets).
    // This orients the ship's front (-Z axis) towards the target.
    const lookAtPoint = new THREE.Vector3().subVectors(player.position, targetPosition).add(player.position);
    player.lookAt(lookAtPoint);
}


export function isWarping(): boolean {
    return warpState.isWarping;
}
