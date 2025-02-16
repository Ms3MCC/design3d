// object management.js and tweakpane

import * as THREE from "three";
import { Pane } from "tweakpane";



   export function selectObject(object,selectedObject,params,pane) {
    selectedObject = object;
    if (selectedObject) {
        params.selectedObject = selectedObject.name;
        params.selectedObjectName = selectedObject.name;
        
        params.color = `#${selectedObject.material.color.getHexString()}`;

    } else {
        params.selectedObject = "None";
        params.selectedObjectName = "None";

    }
    pane.refresh();
    return selectedObject;
}

export function updateObjectSelector(objects,pane,selectedObject,params){

    const existingFolder = pane.children.find(child => child.title === 'Object Selection');
    if (existingFolder) {
        pane.remove(existingFolder);
    }

    const folder = pane.addFolder({
        title: 'Object Selection',
    });

    const options = {
        "None": "None"
    };

    objects.forEach((obj, idx) => {
        options[obj.name] = obj.name;
    });
    

    folder.addBinding(params, "selectedObject", {
        options: options,
    }).on("change", (ev) => {
        if (ev.value === "None") {
            selectObject(null,selectObject,params,pane);
        } else {
            const selectedObj = objects.find(obj => obj.name === ev.value);
            selectObject(selectedObj,selectObject,params,pane);
        }
    });

}



export function addObject(geometryType,mygroup,objects,pane,params,selectedObject,material=new THREE.MeshPhysicalMaterial({ clearcoatRoughness: 0.1, clearcoat:0.7, roughness: 0.9, metalness: 1, color: 0x0088ff }))
{
        let geometry;
        switch (geometryType) {
            case "Sphere":
                geometry = new THREE.SphereGeometry(2, 128, 128);
                break;
            case "Box":
                geometry = new THREE.BoxGeometry(3, 3, 3, 10, 10, 10);
                break;
            case "Cone":
                geometry = new THREE.ConeGeometry(2, 6, 128, 128);
                break;
            case "Cylinder":
                geometry = new THREE.CylinderGeometry(2, 2, 4, 64, 64);
                break;
            default:
                geometry = new THREE.SphereGeometry(2, 128, 128);
        }
        const obValue=objects.length;
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.position.set(0, 0, 0);
        mesh.name = `Object ${obValue+1}`;

        mygroup.add(mesh)
        objects.push(mesh)
        updateObjectSelector(objects,pane,selectedObject,params);
        
        return mesh;

}








export function createTweakPaneDefault(pane,params,mygroup,selectedObject,objects){
    
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
        addObject(params.geometry,mygroup,objects,pane,params,selectedObject);
    });
    
    pane.addBinding(params, "color").on("change", (ev) => {
        if (selectedObject) selectedObject.material.color.set(ev.value);
    });


}