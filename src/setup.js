// scene setup.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


export function createScene(color="black",fov=75,near=1,far=2000,camx=0,camy=0,camz=15)
{
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(color);
    
    const camera = new THREE.PerspectiveCamera(
        fov,
        window.innerWidth / window.innerHeight,
        near,
        far
    );
    camera.position.set(camx,camy,camz);
    return {scene,camera};
}

export function setUpRenderer()
{
    const canvas =document.querySelector("canvas.threejs");
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    return {renderer,canvas}

}

export function addAmbientLight(scene,color =0x404040,intensity=2000,){
    const ambientLight = new THREE.AmbientLight(color,intensity)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1000);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1000);
    pointLight1.position.set(0, -10, -10);
    scene.add(pointLight1);
}


export function enableOrbitControls(camera,canvas){
    const controls = new OrbitControls(camera, canvas);
    controls.enableOrbitControls=true;
    return controls;
}

