import * as THREE from 'three';

export function createGridHelpers(size, divisions) {

    const gridXZ = new THREE.GridHelper(size, divisions, 0x888888, 0x444444); // XZ plane
    const gridXY = new THREE.GridHelper(size, divisions, 0x888888, 0x444444); // XY plane
    const gridYZ = new THREE.GridHelper(size, divisions, 0x888888, 0x444444); // YZ plane

    // Rotate grids to align with respective planes
    gridXY.rotation.x = Math.PI / 2; // Align with the XY plane
    gridYZ.rotation.z = Math.PI / 2; // Align with the YZ plane

    return [gridXZ, gridXY, gridYZ];
}