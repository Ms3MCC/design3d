import * as THREE from 'three';

class CornerViewport {
    constructor(mainCamera, mainControls) {
        this.size = 170;
        this.isAnimating = false;
        this.animationDuration = 100; // milliseconds
        
        // Create viewport scene
        this.scene = new THREE.Scene();
        
        // Create scene pivot point for rotation
        this.scenePivot = new THREE.Object3D();
        this.scene.add(this.scenePivot);
        
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
        this.container.style.bottom = '10px';
        this.container.style.left = '10px';
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
    }

    addStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .viewport-arrow {
                position: absolute;
                background: rgba(40, 44, 52, 0.8);
                border: 2px solid #61dafb;
                border-radius: 50%;
                width: 36px;
                height: 36px;
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
                transform: scale(0.95);
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
            { position: 'top: -5px; left: 57px;', symbol: '↑', axis: new THREE.Vector3(1, 0, 0), angle: -45 },
            { position: 'bottom: -5px; left: 57px;', symbol: '↓', axis: new THREE.Vector3(1, 0, 0), angle: 45 },
            { position: 'top: 57px; left: -5px;', symbol: '←', axis: new THREE.Vector3(0, 1, 0), angle: -45 },
            { position: 'top: 57px; right: -5px;', symbol: '→', axis: new THREE.Vector3(0, 1, 0), angle: 45 }
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

        // Calculate camera start and end positions
        const startCameraPosition = this.camera.position.clone();
        const startCameraUp = this.camera.up.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Smooth easing
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate rotation
            const currentQuaternion = new THREE.Quaternion();
            currentQuaternion.slerpQuaternions(startQuaternion, endQuaternion, eased);

            // Apply rotation to cube and scene
            this.cube.quaternion.copy(currentQuaternion);
            
            // Rotate camera around the scene
            const rotatedPosition = startCameraPosition.clone().applyQuaternion(rotationQuaternion);
            const rotatedUp = startCameraUp.clone().applyQuaternion(rotationQuaternion);
            
            this.camera.position.copy(rotatedPosition);
            this.camera.up.copy(rotatedUp);
            this.camera.lookAt(0, 0, 0);

            // Update main camera if it exists
            if (this.mainCamera) {
                this.mainCamera.position.copy(rotatedPosition);
                this.mainCamera.up.copy(rotatedUp);
                this.mainCamera.lookAt(0, 0, 0);
                if (this.mainControls) {
                    this.mainControls.update();
                }
            }

            // Store current rotation
            this.currentRotation.copy(currentQuaternion);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        animate();
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0xff0000 }), // right
            new THREE.MeshPhongMaterial({ color: 0xff8c00 }), // left
            new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // top
            new THREE.MeshPhongMaterial({ color: 0x0000ff }), // bottom
            new THREE.MeshPhongMaterial({ color: 0xffff00 }), // front
            new THREE.MeshPhongMaterial({ color: 0xff00ff }), // back
        ];
        
        this.cube = new THREE.Mesh(geometry, materials);
        
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.cube.add(edges);

        // Add cube to scene
        this.scene.add(this.cube);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
    }

    update() {
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.container.remove();
        this.renderer.dispose();
    }
}

export function createCornerViewport(mainCamera, mainControls) {
    return new CornerViewport(mainCamera, mainControls);
}