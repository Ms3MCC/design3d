import * as THREE from "three";
import * as setUp from './setup.js';
import * as obj from './obj.js';
import * as et from './events.js';
import * as rc from './myRayCaster.js';
import { Pane } from "tweakpane";
import { createGridHelpers } from './gridHelper.js';
import { createCornerViewport } from './viewportHelper.js';


// some variable that are send in functions implemented in other files
const moveSpeed = 0.1;
const rotationSpeed = 0.05;
const keysPressed = {};
const objects = [];
let selectedObject = null; // Currently selected object


// Create a scene
const {scene,camera}=setUp.createScene();
const {renderer,canvas}=setUp.setUpRenderer();
setUp.addAmbientLight(scene);
const controls = setUp.enableOrbitControls(camera, canvas);
const mygroup = new THREE.Group();
scene.add(mygroup)

const [gridXZ, gridXY, gridYZ] = createGridHelpers(100, 100); //size, divisions
// scene.add(gridXZ);
scene.add(gridXY);
//scene.add(gridYZ);

const cornerViewport = createCornerViewport(camera, controls);

//  tweakpane construction 
const pane = new Pane();
const params = {
    selectedObject: "None", 
    selectedObjectName: "None",
    geometry: "Sphere",
    color: "#ff0000",
};
pane.addBinding(params,"geometry",{
        options:{
            Sphere: "Sphere",
            Box: "Box",
            Cone: "Cone",
            Cylinder: "Cylinder",
        },
}
)
pane.addButton({ title: "Add Geometry" }).on("click", () => {
    obj.addObject(params.geometry,mygroup,objects,pane,params,selectedObject);
});   
pane.addBinding(params, "color").on("change", (ev) => {
        if (selectedObject) selectedObject.material.color.set(ev.value);
});


// adding eventlisteners for  keys 
document.addEventListener("keydown", (event) => et.handleKeyDown(event, keysPressed));
document.addEventListener("keyup", (event) => et.handleKeyUp(event, keysPressed));


//Seting up raycaster
const getUpdatedSelectedObject=rc.setupRaycaster(canvas,camera,controls,objects,obj,params,pane,selectedObject);


// just some initialization
function initScene() {
 const sphere = obj.addObject("Sphere",mygroup,objects,pane,params,selectedObject)
 selectedObject= obj.selectObject(sphere,selectedObject,params,pane);
}
initScene()

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    et.handleKeyboardMovement(selectedObject,keysPressed,params,pane,mygroup,moveSpeed,rotationSpeed);
    selectedObject = getUpdatedSelectedObject();
    cornerViewport.update()
    controls.update();
    renderer.render(scene, camera);
}
animate();


// Handle window resizing
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});
