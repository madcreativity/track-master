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
    let editorPos = [0, 0];

    DOMeditorPage.addEventListener('mousedown', (e) => {
        e = e || window.event;

        if(e.target === DOMeditorPage) {
            isEditorPageHeld = true;

            editorPageHeldPos = [ e.clientX, e.clientY ];
        }
    });

    // Editor page -- "To Start" button
    let DOMeditorToStart = document.querySelector("#editor-to-start");
    DOMeditorToStart.addEventListener('click', () => {
        editorPos = [0, 0];
        DOMeditorPage.style.backgroundPosition = "0 0";
    });

    // Window event -- Move mouse around
    window.addEventListener('mousemove', (e) => {
        e = e || window.event;

        // Draggable background - Move if left mouse button is held down
        if(isEditorPageHeld) {
            let relativeX, relativeY;

            relativeX = e.clientX - editorPageHeldPos[0] + editorPos[0];
            relativeY = e.clientY - editorPageHeldPos[1] + editorPos[1];

            DOMeditorPage.style.backgroundPosition = relativeX + "px " + relativeY + "px";
        }
    });

    // Window event -- Let go of left mouse button
    window.addEventListener('mouseup', (e) => {
        e = e || window.event;

        // Draggable background
        if(isEditorPageHeld) {
            isEditorPageHeld = false;

            editorPos[0] = e.clientX - editorPageHeldPos[0] + editorPos[0];
            editorPos[1] = e.clientY - editorPageHeldPos[1] + editorPos[1];
        }
    });

    // Loading completed
    ipcRenderer.send('request-mainprocess-action', {
        message: "loading-end"
    });
});