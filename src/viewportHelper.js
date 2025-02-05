import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

class CornerViewport {
    constructor(mainCamera, mainControls) {
        this.size = 200;
        this.animationDuration = 100;
        this.isAnimating = false;
        this.isDragging = false;
        this.previousMousePosition = new THREE.Vector2();
        
        // Create viewport scene
        this.scene = new THREE.Scene();
        
        // Create viewport camera
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        this.camera.position.set(3, 3, 3);
        this.camera.lookAt(0, 0, 0);

        // Create viewport renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0x000000, 0.0);

        // Create container div
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '30px';
        this.container.style.left = '30px';
        this.container.style.width = `${this.size}px`;
        this.container.style.height = `${this.size}px`;

        // Style renderer element
        const element = this.renderer.domElement;
        element.style.border = '2px solid #666';
        element.style.borderRadius = '4px';
        element.style.zIndex = '100';
        
        // Add renderer to container
        this.container.appendChild(element);

        // Create the cube
        this.createCube();

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, directionalLight);
        
        this.createRing();
        
        // Store references
        this.mainCamera = mainCamera;
        this.mainControls = mainControls;

        // Add CSS styles for buttons
        this.addStyles();

        // Create arrow controls
        this.createArrowControls();

        // Add container to DOM
        document.body.appendChild(this.container);

        // Initialize rotation quaternion
        this.currentRotation = new THREE.Quaternion();

        // Initialize raycaster and mouse
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Bind event listeners
        this.onMouseDownBound = this.onMouseDown.bind(this);
        this.onMouseMoveBound = this.onMouseMove.bind(this);
        this.onMouseUpBound = this.onMouseUp.bind(this);

        // Setup mouse event listeners
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDownBound);
        document.addEventListener('mousemove', this.onMouseMoveBound);
        document.addEventListener('mouseup', this.onMouseUpBound);
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0xff0000 }), // right
            new THREE.MeshPhongMaterial({ color: 0xff8c00 }), // left
            new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // top
            new THREE.MeshPhongMaterial({ color: 0x0000ff }), // bottom
            new THREE.MeshPhongMaterial({ color: 0xffff00 }), // front
            new THREE.MeshPhongMaterial({ color: 0xff00ff })  // back
        ];
    
        this.cube = new THREE.Mesh(geometry, materials);
    
        // Add edges
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.cube.add(edges);

        // Add face labels with their positions and rotations
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
            const faceLabels = [
                { text: "RIGHT", position: [0.5, 0, 0], rotation: [0, Math.PI/2, 0] },
                { text: "LEFT", position: [-0.5, 0, 0], rotation: [0, -Math.PI/2, 0] },
                { text: "TOP", position: [0, 0.5, 0], rotation: [-Math.PI/2, 0, 0] },
                { text: "BOTTOM", position: [0, -0.5, 0], rotation: [Math.PI/2, 0, 0] },
                { text: "FRONT", position: [0, 0, 0.5], rotation: [0, 0, 0] },
                { text: "BACK", position: [0, 0, -0.5], rotation: [0, Math.PI, 0] }
            ];

            faceLabels.forEach(label => {
                const textGeometry = new TextGeometry(label.text, {
                    font: font,
                    size: 0.18,
                    height: 0.03,
                });
                textGeometry.center();
                
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(...label.position);
                textMesh.rotation.set(...label.rotation);
                this.cube.add(textMesh);
            });
        });

        this.scene.add(this.cube);
        this.addAxesAndLabels();
    }

    createFaceLabel(text) {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        
        ctx.fillStyle = "rgba(255, 255, 255, 1)";  // Changed background to white with some transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 24px Arial";  // Made text bold
        ctx.fillStyle = "#000000";
        ctx.fillText(text, canvas.width/2, canvas.height/2);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.6, 0.6, 0.6);  // Increased scale to make labels bigger
        
        return sprite;
    }

    rotateToFace(faceIndex) {
        const rotations = [
            new THREE.Euler(0, -Math.PI/2, 0),  // right
            new THREE.Euler(0, Math.PI/2, 0),   // left
            new THREE.Euler(Math.PI/2, 0, 0),   // top
            new THREE.Euler(-Math.PI/2, 0, 0),  // bottom
            new THREE.Euler(0, 0, 0),           // front
            new THREE.Euler(0, Math.PI, 0)      // back
        ];
    
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromEuler(rotations[faceIndex]);
        
        // Calculate rotation needed
        const currentRotation = this.cube.quaternion.clone();
        const rotationNeeded = targetQuaternion.multiply(currentRotation.invert());
        
        this.animateToRotation(rotationNeeded);
    }

    onMouseDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const cubeIntersects = this.raycaster.intersectObject(this.cube);
        if (cubeIntersects.length > 0 && !this.isAnimating) {
            const faceIndex = Math.floor(cubeIntersects[0].faceIndex / 2);
            this.rotateToFace(faceIndex);
            return;
        }
        
        // Check for intersections with the control point
        const controlPointIntersects = this.raycaster.intersectObject(this.controlPoint);
        if (controlPointIntersects.length > 0) {
            this.isDragging = true;
            this.previousMousePosition.set(event.clientX, event.clientY);
            this.renderer.domElement.style.cursor = 'grabbing';
            return;
        }

        // Check for intersections with face labels
        const labelIntersects = this.raycaster.intersectObjects(
            this.cube.children.filter(child => child instanceof THREE.Sprite)
        );

        if (labelIntersects.length > 0 && !this.isAnimating) {
            const label = labelIntersects[0].object;
            const targetRotation = label.userData.targetRotation;
            
            // Convert Euler rotation to Quaternion for animation
            const targetQuaternion = new THREE.Quaternion();
            targetQuaternion.setFromEuler(targetRotation);

            // Calculate the rotation needed
            const currentRotation = this.cube.quaternion.clone();
            const rotationNeeded = targetQuaternion.multiply(currentRotation.invert());

            // Animate to the target rotation
            this.animateToRotation(rotationNeeded);
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        const deltaMove = {
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };

        const rotationAngle = (deltaMove.x * Math.PI) / 180;

        const currentAngle = Math.atan2(
            this.controlPoint.position.z,
            this.controlPoint.position.x
        );
        const newAngle = currentAngle + rotationAngle;
        
        this.controlPoint.position.x = 1.5 * Math.cos(newAngle);
        this.controlPoint.position.z = 1.5 * Math.sin(newAngle);

        const rotationAxis = new THREE.Vector3(0, 1, 0);
        const rotationQuaternion = new THREE.Quaternion();
        rotationQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);
        
        this.cube.quaternion.multiply(rotationQuaternion);

        if (this.mainCamera) {
            const rotatedPosition = this.mainCamera.position.clone().applyQuaternion(rotationQuaternion);
            const rotatedUp = this.mainCamera.up.clone().applyQuaternion(rotationQuaternion);
            
            this.mainCamera.position.copy(rotatedPosition);
            this.mainCamera.up.copy(rotatedUp);
            this.mainCamera.lookAt(0, 0, 0);
            
            if (this.mainControls) {
                this.mainControls.update();
            }
        }

        this.previousMousePosition.set(event.clientX, event.clientY);
    }

    onMouseUp() {
        this.isDragging = false;
        this.renderer.domElement.style.cursor = 'default';
    }

    addAxesAndLabels() {
        const axisLength = 1.5;
        const arrowSize = 0.2;
        
        const xArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            axisLength,
            0xff0000,
            arrowSize,
            0.2
        );
        const yArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            axisLength,
            0x00ff00,
            arrowSize,
            0.2
        );
        const zArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            axisLength,
            0x0000ff,
            arrowSize,
            0.2
        );
        
        this.scene.add(xArrow, yArrow, zArrow);

        // Add axis labels
        const labelOffset = 0.3;
        this.addAxisLabel("X", new THREE.Vector3(axisLength + labelOffset, 0, 0), "#ff0000");
        this.addAxisLabel("Y", new THREE.Vector3(0, axisLength + labelOffset, 0), "#00ff00");
        this.addAxisLabel("Z", new THREE.Vector3(0, 0, axisLength + labelOffset), "#0000ff");
    }

    addAxisLabel(text, position, color) {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "32px Arial";
        ctx.fillStyle = color;
        ctx.fillText(text, canvas.width/2, canvas.height/2);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.5, 1);
        sprite.position.copy(position);
    
        this.scene.add(sprite);
    }

    createRing() {
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.03, 64, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.7
        });

        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.rotation.x = Math.PI / 2;
        this.scene.add(this.ring);
        
        const sphereGeometry = new THREE.SphereGeometry(0.13, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x61dafb,
            emissive: 0x61dafb,
            emissiveIntensity: 0.8
        });
        this.controlPoint = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.controlPoint.position.set(1.5, 0, 0);
        this.scene.add(this.controlPoint);
    }

    animateToRotation(rotationQuaternion) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const startTime = Date.now();
        const startQuaternion = this.cube.quaternion.clone();
        const endQuaternion = startQuaternion.clone().multiply(rotationQuaternion);

        const startCameraPosition = this.camera.position.clone();
        const startCameraUp = this.camera.up.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentQuaternion = new THREE.Quaternion();
            currentQuaternion.slerpQuaternions(startQuaternion, endQuaternion, eased);

            this.cube.quaternion.copy(currentQuaternion);

            const rotatedPosition = startCameraPosition.clone().applyQuaternion(rotationQuaternion);
            const rotatedUp = startCameraUp.clone().applyQuaternion(rotationQuaternion);

            this.camera.position.copy(rotatedPosition);
            this.camera.up.copy(rotatedUp);
            this.camera.lookAt(0, 0, 0);

            if (this.mainCamera) {
                this.mainCamera.position.copy(rotatedPosition);
                this.mainCamera.up.copy(rotatedUp);
                this.mainCamera.lookAt(0, 0, 0);
                if (this.mainControls) {
                    this.mainControls.update();
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        animate();
    }

    addStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .viewport-arrow {
                position: absolute;
                background: rgba(40, 44, 52, 0.9);
                border: 2px solid #61dafb;
                border-radius: 80%;
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #61dafb;
                font-size: 18px;
                font-family: Arial, sans-serif;
                transition: all 0.2s ease;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }

            .viewport-arrow:hover {
                background: rgba(97, 218, 251, 0.8);
                color: #282c34;
                transform: scale(1.1);
            }

            .viewport-arrow:active {
                transform: scale(1);
            }

            .viewport-arrow:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: scale(1);
            }
        `;
        document.head.appendChild(styleSheet);
    }

    createArrowControls() {
        const arrows = [
            { position: 'top: 5px; left: 89px;', symbol: '↑', axis: new THREE.Vector3(1, 0, 0), angle: -45 },
            { position: 'bottom: 1px; left: 89px;', symbol: '↓', axis: new THREE.Vector3(1, 0, 0), angle: 45 },
            { position: 'top: 90px; left: 3px;', symbol: '←', axis: new THREE.Vector3(0, 1, 0), angle: -45 },
            { position: 'top: 90px; right: 1px;', symbol: '→', axis: new THREE.Vector3(0, 1, 0), angle: 45 },
            { position: 'top: 40px; left: 40px;', symbol: '⟲', axis: new THREE.Vector3(0, 0, 1), angle: -45 },
            { position: 'top: 40px; right: 40px;', symbol: '⟳', axis: new THREE.Vector3(0, 0, 1), angle: 45 }
        ];

        arrows.forEach(({ position, symbol, axis, angle }) => {
            const arrow = document.createElement('button');
            arrow.className = 'viewport-arrow';
            arrow.style.cssText = position;
            arrow.innerHTML = symbol;
            arrow.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.animateRotation(axis, angle);
                }
            });
            this.container.appendChild(arrow);
        });
    }

    animateRotation(axis, angle) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        const startTime = Date.now();
        const startQuaternion = this.currentRotation.clone();
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
            axis,
            THREE.MathUtils.degToRad(angle)
        );
        const endQuaternion = startQuaternion.clone().multiply(rotationQuaternion);

        const startCameraPosition = this.camera.position.clone();
        const startCameraUp = this.camera.up.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentQuaternion = new THREE.Quaternion();
            currentQuaternion.slerpQuaternions(startQuaternion, endQuaternion, eased);

            this.cube.quaternion.copy(currentQuaternion);

            const rotatedPosition = startCameraPosition.clone().applyQuaternion(rotationQuaternion);
            const rotatedUp = startCameraUp.clone().applyQuaternion(rotationQuaternion);

            this.camera.position.copy(rotatedPosition);
            this.camera.up.copy(rotatedUp);
            this.camera.lookAt(0, 0, 0);

            if (this.mainCamera) {
                this.mainCamera.position.copy(rotatedPosition);
                this.mainCamera.up.copy(rotatedUp);
                this.mainCamera.lookAt(0, 0, 0);
                if (this.mainControls) {
                    this.mainControls.update();
                }
            }

            this.currentRotation.copy(currentQuaternion);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        animate();
    }

    update() {
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        // Remove event listeners
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownBound);
        document.removeEventListener('mousemove', this.onMouseMoveBound);
        document.removeEventListener('mouseup', this.onMouseUpBound);
        
        // Remove from DOM and dispose resources
        this.container.remove();
        this.renderer.dispose();
    }
}

export function createCornerViewport(mainCamera, mainControls) {
    return new CornerViewport(mainCamera, mainControls);
}