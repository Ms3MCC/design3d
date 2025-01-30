// event listerner
    
    
export function handleKeyDown(event, keysPressed) {
    const devToolsKeys = [
        "F12", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11",
        "Control", "Shift", "I", "i", 
        "Meta", // Command key on macOS
        "Option", // Option key on macOS
        "C", "c", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "Delete", "Enter", "Backspace"
    ];

    if (!devToolsKeys.includes(event.key) && !(event.metaKey || event.altKey)) {
        event.preventDefault();
    }

    keysPressed[event.key] = true;
    console.log("Keydown event detected:", event.key);
}

export function handleKeyUp(event, keysPressed) {
    keysPressed[event.key] = false;
}




export function handleKeyboardMovement(selectedObject,keysPressed,params,pane,mygroup,moveSpeed,rotationSpeed){
    if (selectedObject) {
        // console.log(selectedObject)
        // Move along the XZ plane
        if (keysPressed["ArrowUp"]) selectedObject.position.z -= moveSpeed;
        if (keysPressed["ArrowDown"]) selectedObject.position.z += moveSpeed;
        if (keysPressed["ArrowLeft"]) selectedObject.position.x -= moveSpeed;
        if (keysPressed["ArrowRight"]) selectedObject.position.x += moveSpeed;

        // Move along the Y-axis
        if (keysPressed[" "]) selectedObject.position.y += moveSpeed; // Space key
        if (keysPressed["Shift"]) selectedObject.position.y -= moveSpeed;

        // Rotate
        if (keysPressed["w"]) selectedObject.rotation.x -= rotationSpeed;
        if (keysPressed["s"]) selectedObject.rotation.x += rotationSpeed;
        if (keysPressed["a"]) selectedObject.rotation.y -= rotationSpeed;
        if (keysPressed["d"]) selectedObject.rotation.y += rotationSpeed;
        if (keysPressed["q"]) selectedObject.rotation.z -= rotationSpeed;
        if (keysPressed["e"]) selectedObject.rotation.z += rotationSpeed;
    }

       //rotate group
       if (keysPressed["g"]) mygroup.rotation.y -= rotationSpeed;
       if (keysPressed["b"]) mygroup.rotation.y += rotationSpeed;
       if (keysPressed["h"]) mygroup.rotation.x -= rotationSpeed;
       if (keysPressed["f"]) mygroup.rotation.x += rotationSpeed;
       if (keysPressed["n"]) mygroup.rotation.z -= rotationSpeed;
       if (keysPressed["v"]) mygroup.rotation.z += rotationSpeed;
       mygroup.updateMatrixWorld(true); 
    

}