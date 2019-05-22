document.addEventListener('DOMContentLoaded', () => {
    // Acquire dependencies
    const remote = require('electron').remote;
    const {dialog} = require('electron').remote;
    const app = remote.app;
    const {ipcRenderer} = require('electron');
    const fs = require('fs');
    const bezier = require('bezier-js');

    // Connect windows
    let win = remote.getGlobal('win');
    let winLoading = remote.getGlobal('winLoading');
    
    // Node functionality
    let filePath = "";

    function NodeObj(nodeJSON) {
        this.nodes = nodeJSON;
    }
    
    let nodes = [
        
    ];
    

    // Create nodes
    let DOMeditorNodeContainer = document.querySelector("#editor-node-container");
    let createNodes = () => {
        nodes.forEach((nodeObj) => {
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
    }

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

    // Reset editor
    let resetEditor = () => {
        // Reset standard properties
        editorPos = [0, 0];
        nodes = [];
        nodeAmount = 0;

        DOMeditorPage.style.backgroundPosition = "0 0";

        DOMeditorNodeContainer.style.left = "0";
        DOMeditorNodeContainer.style.top = "0";

        filePath = "";

        // Clear children
        while(DOMeditorNodeContainer.firstChild) {
            DOMeditorNodeContainer.removeChild(DOMeditorNodeContainer.firstChild);
        }
    }

    // Navigation bar
    DOMnavSystem = document.querySelector(".navSystem");

    let closeSubNavs = () => {
        let visibleItems = Array.prototype.slice.call(DOMnavSystem.querySelectorAll(".subNav.visible"));

        // Hide visible subnavigations
        for(let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].className = visibleItems[i].className.replace("visible", "hidden");
        }
    }

    let fileSave = () => {
        // TODO: Save file
        let fileDataOut = "";
        
        fileDataOut = JSON.stringify(new NodeObj(nodes));
        
        fs.writeFile(filePath, fileDataOut, (err) => {
            if(err) {
                console.error(err);
                return;
            }
        });
    }

    let fileSaveAs = () => {
        dialog.showSaveDialog({
            filters: [{
                name: "Branching Writers System",
                extensions: ["bws"]
            }]
        }, (file) => {
            if (file !== undefined) {
                filePath = file;

                fileSave();
            }
        });
    }

    DOMnavSystem.addEventListener('click', (e) => {
        if(e.target.id === "navBtn-about") {
            closeSubNavs();

            // About button

        } else if(e.target.id === "subNav-file-newFile") {
            // New file button
            closeSubNavs();
        
            resetEditor();
        } else if(e.target.id === "subNav-file-openFile") {
            // Open file button
            closeSubNavs();

            dialog.showOpenDialog({
                properties: ["openFile"],
                filters: [{
                    name: "Branching Writers System",
                    extensions: ["bws"]
                }]
            }, (file) => {
                if (file !== undefined) {
                    
                    file = file[0];
                    
                    if(file.slice(file.lastIndexOf(".")) === ".bws") {
                        fs.readFile(file, 'utf-8', (err, data) => {
                            if(err) {
                                console.error("Failed to read file " + file);
                                return;
                            }
                            
                            let parsedData = JSON.parse(data);
                            
                            resetEditor();

                            filePath = file;

                            nodes = parsedData.nodes;

                            createNodes();
                        });
                    }
                }
            });
        } else if(e.target.id === "subNav-file-saveAs") {
            // Save as button
            closeSubNavs();

            fileSaveAs();
        } else if(e.target.id === "subNav-file-save") {
            // Save as button
            closeSubNavs();

            if(filePath !== "") {
                fileSave();
            } else {
                fileSaveAs();
            }
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

        if(e.target === DOMeditorPage || e.target == DOMnodeCanvas) {
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