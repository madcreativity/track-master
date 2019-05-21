document.addEventListener('DOMContentLoaded', () => {
    // Acquire dependencies
    const remote = require('electron').remote;
    const app = remote.app;
    const {ipcRenderer} = require('electron');
    const fs = require('fs');

    // Connect windows
    let win = remote.getGlobal('win');
    let winLoading = remote.getGlobal('winLoading');

    // Window buttons
    let DOMwinBtnContainer = document.querySelector("#windowButtons");
    DOMwinBtnContainer.addEventListener('click', (e) => {
        if(e.target.id === "windowCloseBtn") {
            win.close(); // Close
        } else if(e.target.id === "windowMinimizeBtn") {
            win.minimize(); // Minimize
        }
    });

    // Draggable editor page
    let DOMeditorPage = document.querySelector("#page-editor");
    let isEditorPageHeld = false;
    let editorPageHeldPos = [0, 0];

    DOMeditorPage.addEventListener('mousedown', (e) => {
        e = e || window.event;

        isEditorPageHeld = true;

        editorPageHeldPos = [ e.clientX, e.clientY ];
    });

    DOMeditorPage.addEventListener('mousemove', (e) => {
        e = e || window.event;

        
        if(isEditorPageHeld) {
            let relativeX, relativeY;
            
            relativeX = e.clientX - editorPageHeldPos[0];
            relativeY = e.clientY - editorPageHeldPos[1];

            DOMeditorPage.style.backgroundPosition = relativeX + "px " + relativeY + "px";
        }
    });

    DOMeditorPage.addEventListener('mouseup', () => {
        isEditorPageHeld = false;
    });

    // Loading completed
    ipcRenderer.send('request-mainprocess-action', {
        message: "loading-end"
    });
});