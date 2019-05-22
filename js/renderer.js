document.addEventListener('DOMContentLoaded', () => {
    // Acquire dependencies
    const remote = require('electron').remote;
    const app = remote.app;
    const {ipcRenderer} = require('electron');
    const fs = require('fs');
    const bezier = require('bezier-js');

    // Connect windows
    let win = remote.getGlobal('win');
    let winLoading = remote.getGlobal('winLoading');

    // Node functionality
    let nodeAmount = 0;

    function Node(title, content, connections, transform) {
        this.id = nodeAmount;
        this.title = title;
        this.content = content;
        this.connections = connections; // Array of ID's
        this.transform = transform; // [Xpos, Ypos, Width]

        nodeAmount++;
    }

    let nodesExample = [
        new Node("Epic example node", "This sample node right here is super freaking epic. Honestly, I don't know if any other example node can beat THIS example node.", [1], [-50, 20, 400]),
        new Node("Even epic-cer node", "WOW. I can't believe it!!! This example node is even more the epic-cer than the previous one. Hence the name.", [], [250, 400, 600])
    ];

    // Create nodes
    let DOMeditorNodeContainer = document.querySelector("#editor-node-container");
    nodesExample.forEach((nodeObj) => {
        // Create elements
        let nodeContainerElement = document.createElement("div");
        let nodeTitleElement = document.createElement("p");
        let nodeContentElement = document.createElement("p");

        // Apply classes & id's
        nodeContainerElement.className = "nodeContainer";
        nodeTitleElement.className = "nodeTitle";
        nodeContentElement.className = "nodeContent";

        // Other attributes
        nodeTitleElement.textContent = nodeObj.title;
        nodeContentElement.textContent = nodeObj.content;

        // Add correct node transforms
        nodeContainerElement.style.left = nodeObj.transform[0] + "px";
        nodeContainerElement.style.top = nodeObj.transform[1] + "px";
        nodeContainerElement.style.width = nodeObj.transform[2] + "px";

        // DOM structure
        nodeContainerElement.appendChild(nodeTitleElement);
        nodeContainerElement.appendChild(nodeContentElement);

        DOMeditorNodeContainer.appendChild(nodeContainerElement);
    });

    // Force node canvas to fill entire screen
    let DOMnodeCanvas = document.querySelector("#editor-node-canvas");
    DOMnodeCanvas.width = window.innerWidth;
    DOMnodeCanvas.height = window.innerHeight;

    window.addEventListener('resize', (e) => {
        DOMnodeCanvas.width = window.innerWidth;
        DOMnodeCanvas.height = window.innerHeight;
    });

    // Window buttons
    let DOMwinBtnContainer = document.querySelector("#windowButtons");
    DOMwinBtnContainer.addEventListener('click', (e) => {
        if(e.target.id === "windowCloseBtn") {
            win.close(); // Close
        } else if(e.target.id === "windowMinimizeBtn") {
            win.minimize(); // Minimize
        }
    });

    // Navigation bar
    DOMnavSystem = document.querySelector(".navSystem");
    DOMnavSystem.addEventListener('click', (e) => {
        if(e.target.id === "navBtn-about") {
            // About button


        } else if(e.target.id === "navBtn-file-newFile") {
            // New file button
            

        } else if(e.target.id === "navBtn-file-loadFile") {
            // Load file button


        } else if(e.target.id === "navBtn-file-saveAs") {
            // Save as button


        } else if(e.target.className.indexOf("subNavOuterBtn") !== -1) {
            let visibleItems = Array.prototype.slice.call(DOMnavSystem.querySelectorAll(".subNav.visible"));
            
            // Buttons to open subnavigations
            let thisParent = e.target.parentNode.querySelector(".subNav");
            
            if(thisParent.className.indexOf("hidden") !== -1) {
                thisParent.className = thisParent.className.replace("hidden", "visible");
            }
            
            // Hide visible subnavigations
            if(visibleItems.indexOf(e.target) !== -1) {
                visibleItems.splice(visibleItems.indexOf(e.target), 1);
            }

            for(let i = 0; i < visibleItems.length; i++) {
                visibleItems[i].className = visibleItems[i].className.replace("visible", "hidden");
            }
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

        DOMeditorNodeContainer.style.left = "0";
        DOMeditorNodeContainer.style.top = "0";
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
            DOMeditorNodeContainer.style.left = relativeX + "px";
            DOMeditorNodeContainer.style.top = relativeY + "px";
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