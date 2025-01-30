// CornerViewport.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class CornerViewport {
    constructor(mainCamera, mainControls) {
        this.size = 150;
        
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

        // Position the viewport
        const element = this.renderer.domElement;
        element.style.position = 'fixed';
        element.style.top = '20px';
        element.style.left = '20px';
        element.style.border = '1px solid #666';
        element.style.borderRadius = '4px';
        element.style.zIndex = '100';

        // Create the cube
        this.createCube();

        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light for shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Store references to main scene objects
        this.mainCamera = mainCamera;
        this.mainControls = mainControls;

        // Add viewport controls
        this.controls = new OrbitControls(this.camera, element);
        this.controls.enablePan = false;
        this.controls.enableZoom = false;

        // Add click interaction
        element.addEventListener('mousedown', () => this.active = true);
        document.addEventListener('mouseup', () => this.active = false);
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Add to DOM
        document.body.appendChild(element);
    }

    createCube() {
        // Create a cube with different colored faces
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0xff0000 }), // right - red
            new THREE.MeshPhongMaterial({ color: 0xff8c00 }), // left - orange
            new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // top - green
            new THREE.MeshPhongMaterial({ color: 0x0000ff }), // bottom - blue
            new THREE.MeshPhongMaterial({ color: 0xffff00 }), // front - yellow
            new THREE.MeshPhongMaterial({ color: 0xff00ff }), // back - purple
        ];
        
        this.cube = new THREE.Mesh(geometry, materials);
        
        // Add wireframe to make edges visible
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.cube.add(edges);

        this.scene.add(this.cube);

        // Add axes helper for additional reference
        const axesHelper = new THREE.AxesHelper(1.5);
        axesHelper.material.transparent = true;
        axesHelper.material.opacity = 0.5;
        this.scene.add(axesHelper);
    }

    handleMouseMove(event) {
        if (!this.active) return;

        // Sync main camera rotation with viewport camera
        if (this.mainControls) {
            const quaternion = this.camera.quaternion.clone();
            this.mainCamera.position.copy(
                this.mainCamera.position.clone()
                    .normalize()
                    .multiplyScalar(this.mainCamera.position.length())
                    .applyQuaternion(quaternion)
            );
            this.mainCamera.up.set(0, 1, 0);
            this.mainCamera.lookAt(0, 0, 0);
            this.mainControls.update();
        }
    }

    update() {
        // Update only if we're not actively controlling
        if (!this.active && this.mainCamera) {
            // Match main camera's orientation
            const distance = this.camera.position.length();
            this.camera.position.copy(
                this.mainCamera.position.clone()
                    .normalize()
                    .multiplyScalar(distance)
            );
            this.camera.up.copy(this.mainCamera.up);
            this.camera.lookAt(0, 0, 0);
        }

        // Render viewport
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.controls.dispose();
        this.renderer.domElement.remove();
        this.renderer.dispose();
    }
}

export function createCornerViewport(mainCamera, mainControls) {
    return new CornerViewport(mainCamera, mainControls);
}