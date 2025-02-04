import * as THREE from "three";

export function setupRaycaster(canvas, camera, controls, objects, obj, params, pane, selectedObject) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let isDragging = false;

    function createCustomAxes(size = 1.5) {
        const axesGroup = new THREE.Group();
        axesGroup.userData.isAxesHelper = true;

        // Line material with increased thickness
        const materials = {
            x: new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }), // Red for X
            y: new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }), // Green for Y
            z: new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 })  // Blue for Z
        };

        // Create arrows at the end of each axis
        function createArrow(direction, material) {
            const arrowLength = size * 0.2;
            const arrowWidth = size * 0.05;

            const points = [];
            if (direction === 'x') {
                points.push(
                    new THREE.Vector3(size - arrowLength, arrowWidth, 0),
                    new THREE.Vector3(size, 0, 0),
                    new THREE.Vector3(size - arrowLength, -arrowWidth, 0)
                );
            } else if (direction === 'y') {
                points.push(
                    new THREE.Vector3(arrowWidth, size - arrowLength, 0),
                    new THREE.Vector3(0, size, 0),
                    new THREE.Vector3(-arrowWidth, size - arrowLength, 0)
                );
            } else {
                points.push(
                    new THREE.Vector3(arrowWidth, 0, size - arrowLength),
                    new THREE.Vector3(0, 0, size),
                    new THREE.Vector3(-arrowWidth, 0, size - arrowLength)
                );
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            return new THREE.Line(geometry, material);
        }

        // Create axes lines
        const axes = {
            x: new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(size, 0, 0)
            ]),
            y: new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, size, 0)
            ]),
            z: new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, size)
            ])
        };

        // Add lines and arrows
        Object.entries(axes).forEach(([axis, geometry]) => {
            const line = new THREE.Line(geometry, materials[axis]);
            line.userData.isAxesHelper = true;
            axesGroup.add(line);

            const arrow = createArrow(axis, materials[axis]);
            arrow.userData.isAxesHelper = true;
            axesGroup.add(arrow);
        });

        // Create text labels using HTML elements for better control
        function createTextSprite(text, backgroundColor) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            
            // Draw text
            context.fillStyle = backgroundColor;
            context.font = 'bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            // Create a plane geometry for the label
            const geometry = new THREE.PlaneGeometry(0.3, 0.3);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData.isAxesHelper = true;
            
            return mesh;
        }

        // Create and position labels
        const xLabel = createTextSprite('X', '#ff0000');
        xLabel.position.set(size + 0.3, 0, 0);
        xLabel.lookAt(new THREE.Vector3(size + 1, 0, 0)); // Make X label face along X axis
        
        const yLabel = createTextSprite('Y', '#00ff00');
        yLabel.position.set(0, size + 0.3, 0);
        yLabel.lookAt(new THREE.Vector3(0, size + 1, 0)); // Make Y label face along Y axis
        
        const zLabel = createTextSprite('Z', '#0000ff');
        zLabel.position.set(0, 0, size + 0.3);
        zLabel.lookAt(new THREE.Vector3(0, 0, size + 1)); // Make Z label face along Z axis

        // Add labels to group
        axesGroup.add(xLabel, yLabel, zLabel);

        return axesGroup;
    }

    canvas.addEventListener("mousedown", (event) => {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const isAxesHelper = (object) => {
            let current = object;
            while (current) {
                if (current.userData.isAxesHelper) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        };

        const intersects = raycaster.intersectObjects(objects, true)
            .filter(intersect => !isAxesHelper(intersect.object));

        controls.enabled = false;

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;

            if (selectedObject && selectedObject.userData.axesHelper) {
                selectedObject.remove(selectedObject.userData.axesHelper);
                selectedObject.userData.axesHelper = null;
            }

            selectedObject = obj.selectObject(clickedObject, selectedObject, params, pane);

            if (selectedObject) {
                const customAxes = createCustomAxes(1.5);
                selectedObject.add(customAxes);
                selectedObject.userData.axesHelper = customAxes;
            }

            dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 0, 1),
                selectedObject.position
            );

            isDragging = true;
            console.log(`Object clicked: ${clickedObject.name}`);
        } else {
            if (selectedObject && selectedObject.userData.axesHelper) {
                selectedObject.remove(selectedObject.userData.axesHelper);
                selectedObject.userData.axesHelper = null;
            }
            selectedObject = obj.selectObject(null, selectedObject, params, pane);
            console.log("No objects intersected.");
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (!isDragging || !selectedObject) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            selectedObject.position.set(intersection.x, intersection.y, selectedObject.position.z);
        }
    });

    canvas.addEventListener("mouseup", () => {
        isDragging = false;
        controls.enabled = true;
    });

    return () => {
        return selectedObject;
    };
}