

import * as THREE from "three";

export function setupRaycaster(canvas, camera, controls, objects, obj, params, pane, selectedObject) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let isDragging = false;

    canvas.addEventListener("mousedown", (event) => {
        event.preventDefault();

        // Convert mouse coordinates to normalized device coordinates (NDC)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set the raycaster from the camera to the mouse position
        raycaster.setFromCamera(mouse, camera);

        // Intersect with objects in the scene
        const intersects = raycaster.intersectObjects(objects, true);
        controls.enabled = false; // Disable orbit controls while dragging

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            selectedObject = obj.selectObject(clickedObject, selectedObject, params, pane); // Update selectedObject

            // Set up dragging plane (XY plane at selected object's height)
            dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 0, 1), // Normal vector (z-axis to keep movement in XY plane)
                selectedObject.position // Plane passes through the selected object's current position
            );

            isDragging = true;
            console.log(`Object clicked: ${clickedObject.name}`);
        } else {
            console.log("No objects intersected.");
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (!isDragging || !selectedObject) return;

        // Update mouse position in NDC
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Intersect ray with the XY plane
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            selectedObject.position.set(intersection.x, intersection.y, selectedObject.position.z);
        }
    });

    canvas.addEventListener("mouseup", () => {
        isDragging = false;
        controls.enabled = true; // Re-enable orbit controls
    });

    return () => selectedObject; // Return a function that gives the updated selectedObject
}
