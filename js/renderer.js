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

    // Editor page -- tools
    // Hold down left mouse button on connection dot and drag to another connection dot to connect two nodes
    
    let curTool = 0; // Edit, Grab

    let DOMeditorPage = document.querySelector("#page-editor");

    window.addEventListener('keydown', (e) => {
        e = e || window.event;

        if(curTool === 0) {
            if(e.keyCode === 32) {
                curTool = 1;
                document.body.classList.replace("tool-edit", "tool-grab");
            } else if(e.keyCode === 46 && heldNode.parentNode !== null) {
                nodes.splice(heldNode.getAttribute("data-node-id"), 1);
                heldNode.parentNode.removeChild(heldNode);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        e = e || window.event;

        if(e.keyCode === 32) {
            if(curTool === 1) {
                curTool = 0;
                document.body.classList.replace("tool-grab", "tool-edit");
            }
        }
    });

    DOMeditorPage.addEventListener('click', (e) => {
        e = e || window.event;

        
        if(!closeSubNavs()) {
            if(curTool === 0) {
                if(e.target === DOMnodeCanvas) {
                    let nodeObj = new NodeItem("Title here", "Content here", [], [
                        e.clientX - editorPos[0],
                        e.clientY - editorPos[1],
                        300
                    ]);
                    
                    nodes.push(nodeObj);
                    
                    heldNode = createNodeSingular(nodes.length - 1);

                    // Select newly created node
                    deselectNodes();

                    heldNode.classList.add("selected");
                }
            }
        }
    });
    
    // Node functionality
    function NodeItem(title, content, connections, transform) {
        this.title = title;
        this.content = content;
        this.connections = connections;
        this.transform = transform;
    }

    function NodeObj(nodeJSON) {
        this.nodes = nodeJSON;
    }
    
    let nodes = [
        
    ];


    let deselectNodes = () => {
        // Deselect all other selected elements
        let selectedNodes = document.querySelectorAll(".nodeContainer.selected");
        if(selectedNodes !== null) {
            for(let i = 0; i < selectedNodes.length; i++) {
                selectedNodes[i].classList.remove("selected");
            }
        }
    }
        
    let createNodeEditor = (nodeContainer) => {
        // Create elements
        let nodeEditorContainerElement = document.createElement("form");

        let nodeEditorTitleLabelElement = document.createElement("p");
        let nodeEditorTitleElement = document.createElement("textarea");

        let nodeEditorContentLabelElement = document.createElement("p");
        let nodeEditorContentElement = document.createElement("textarea");

        let nodeEditorBtnContainerElement = document.createElement("div");
        let nodeEditorOkBtnElement = document.createElement("button");
        let nodeEditorCancelBtnElement = document.createElement("button");

        // Classes & id's
        nodeEditorContainerElement.className = "singularNodeEditor";
        nodeEditorTitleElement.className = "singularNodeEditor-title";
        nodeEditorContentElement.className = "singularNodeEditor-content";

        // Other attributes
        nodeEditorContainerElement.setAttribute("data-node-id", nodeContainer.getAttribute("data-node-id"));

        nodeEditorTitleElement.value = nodeContainer.querySelector(".nodeTitle").textContent;
        nodeEditorContentElement.value = nodeContainer.querySelector(".nodeContent").textContent;

        nodeEditorTitleLabelElement.textContent = "Title:";
        nodeEditorContentLabelElement.textContent = "Content:";

        nodeEditorOkBtnElement.textContent = "Save Changes";
        nodeEditorCancelBtnElement.textContent = "Cancel";

        nodeEditorContentElement.style.height = "80px";

        nodeEditorOkBtnElement.addEventListener('click', (e) => {
            e = e || window.event;

            // Apply changes
            let singularNodeEditor = document.querySelector(".singularNodeEditor");
            let nodeObj = nodes[singularNodeEditor.getAttribute("data-node-id")];
            let newTitle = singularNodeEditor.querySelector(".singularNodeEditor-title").value;
            let newContent = singularNodeEditor.querySelector(".singularNodeEditor-content").value;

            nodeObj.title = newTitle;
            nodeObj.content = newContent;
            nodeContainer.querySelector(".nodeTitle").textContent = newTitle;
            nodeContainer.querySelector(".nodeContent").textContent = newContent;

            // Remove element
            singularNodeEditor.parentNode.removeChild(singularNodeEditor);
        });

        nodeEditorCancelBtnElement.addEventListener('click', (e) => {
            e = e || window.event;

            // Remove element
            document.querySelector(".singularNodeEditor").parentNode.removeChild(document.querySelector(".singularNodeEditor"));            
        });


        // Element structure
        nodeEditorContainerElement.appendChild(nodeEditorTitleLabelElement);
        nodeEditorContainerElement.appendChild(nodeEditorTitleElement);

        nodeEditorContainerElement.appendChild(nodeEditorContentLabelElement);
        nodeEditorContainerElement.appendChild(nodeEditorContentElement);

        nodeEditorBtnContainerElement.appendChild(nodeEditorOkBtnElement);
        nodeEditorBtnContainerElement.appendChild(nodeEditorCancelBtnElement);

        nodeEditorContainerElement.appendChild(nodeEditorBtnContainerElement);

        DOMeditorPage.appendChild(nodeEditorContainerElement);
    }

    // Create nodes
    let DOMeditorNodeContainer = document.querySelector("#editor-node-container");
    
    let createNodeSingular = (nodeIndex) => {
        let nodeObj = nodes[nodeIndex];

        // Create elements
        let nodeContainerElement = document.createElement("div");
        let nodeTitleElement = document.createElement("p");
        let nodeContentElement = document.createElement("p");
        let nodeConnectorInElement = document.createElement("div");
        let nodeConnectorOutElement = document.createElement("div");

        // Apply classes & id's
        nodeContainerElement.className = "nodeContainer";
        nodeTitleElement.className = "nodeTitle";
        nodeContentElement.className = "nodeContent";
        nodeConnectorInElement.className = "nodeConnector connectorIn";
        nodeConnectorOutElement.className = "nodeConnector connectorOut";

        // Other attributes
        nodeTitleElement.textContent = nodeObj.title;
        nodeContentElement.textContent = nodeObj.content;

        nodeContainerElement.setAttribute("data-node-id", nodeIndex)

        nodeContainerElement.addEventListener('dblclick', (e) => {
            e = e || window.event;

            createNodeEditor(e.currentTarget);
        });

        nodeConnectorOutElement.setAttribute("data-connections", nodeObj.connections);

        // Add correct node transforms
        nodeContainerElement.style.left = nodeObj.transform[0] + "px";
        nodeContainerElement.style.top = nodeObj.transform[1] + "px";
        nodeContainerElement.style.width = nodeObj.transform[2] + "px";

        // DOM structure
        nodeContainerElement.appendChild(nodeTitleElement);
        nodeContainerElement.appendChild(nodeContentElement);
        nodeContainerElement.appendChild(nodeConnectorInElement);
        nodeContainerElement.appendChild(nodeConnectorOutElement);

        DOMeditorNodeContainer.appendChild(nodeContainerElement);

        return nodeContainerElement;
    }

    let createNodes = () => {
        for(let i = 0; i < nodes.length; i++) {
            createNodeSingular(i);
        }

        heldNode = DOMeditorNodeContainer.lastChild;
        heldNode.classList.add("selected");
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

    // File functionality
    let filePath = "";
    
    let fileSave = () => {
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

    // Navigation bar
    DOMnavSystem = document.querySelector(".navSystem");

    let closeSubNavs = () => {
        let visibleItems = Array.prototype.slice.call(DOMnavSystem.querySelectorAll(".subNav.visible"));

        // Hide visible subnavigations
        for(let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].className = visibleItems[i].className.replace("visible", "hidden");
        }

        if(visibleItems.length) {
            return true;
        }

        return false;
    }

    DOMnavSystem.addEventListener('click', (e) => {
        if(e.target.id === "subNav-edit-clear") {
            // Clear
            closeSubNavs();

            nodes = [];
            nodeAmount = 0;
            
            // Clear children
            while(DOMeditorNodeContainer.firstChild) {
                DOMeditorNodeContainer.removeChild(DOMeditorNodeContainer.firstChild);
            }
        } else if(e.target.id === "subNav-edit-deselect") {
            // Deselect
            closeSubNavs();

            deselectNodes();
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
    let isEditorPageHeld = false;
    let editorPageHeldPos = [0, 0];
    let editorPos = [0, 0];

    let isNodeHeld = false;
    let nodeHeldPos = [0, 0];
    let nodePos = [ 0, 0 ];
    let heldNode = null;

    DOMeditorPage.addEventListener('mousedown', (e) => {
        e = e || window.event;

        if(e.button === 0) {
            if(curTool === 1) {
                if(e.target !== DOMeditorToStart) {
                    isEditorPageHeld = true;
    
                    editorPageHeldPos = [ e.clientX, e.clientY ];
                }
            } else if(curTool === 0) {
                if(e.target.classList.contains("nodeContainer") || e.target.classList.contains("nodeTitle") || e.target.classList.contains("nodeContent")) {
                    // Select clicked element
                    deselectNodes();

                    if(e.target.classList.contains("nodeContainer")) e.target.classList.add("selected");
                    else e.target.parentNode.classList.add("selected");
                    
                    isNodeHeld = true;

                    nodeHeldPos = [ e.clientX, e.clientY ];

                    heldNode = document.querySelector(".nodeContainer.selected");
                    nodePos = [ parseInt(heldNode.style.left.replace("px", "")), parseInt(heldNode.style.top.replace("px", "")) ];
                }
            }
        }
    });

    // Editor page -- "To Start" button
    let DOMeditorToStart = document.querySelector("#editor-to-start");
    DOMeditorToStart.addEventListener('click', (e) => {
        e = e || window.event;
        
        if(e.button === 0) {
            editorPos = [0, 0];
            DOMeditorPage.style.backgroundPosition = "0 0";

            DOMeditorNodeContainer.style.left = "0";
            DOMeditorNodeContainer.style.top = "0";
        }
    });

    // Window event -- Move mouse around
    window.addEventListener('mousemove', (e) => {
        e = e || window.event;

        // Draggable background - Move if left mouse button is held down
        if(isEditorPageHeld) {
            if(curTool === 1) {
                let relativeX, relativeY;

                relativeX = e.clientX - editorPageHeldPos[0] + editorPos[0];
                relativeY = e.clientY - editorPageHeldPos[1] + editorPos[1];

                DOMeditorPage.style.backgroundPosition = relativeX + "px " + relativeY + "px";
                DOMeditorNodeContainer.style.left = relativeX + "px";
                DOMeditorNodeContainer.style.top = relativeY + "px";
            } else {
                isEditorPageHeld = false;

                editorPos[0] = e.clientX - editorPageHeldPos[0] + editorPos[0];
                editorPos[1] = e.clientY - editorPageHeldPos[1] + editorPos[1];
            }
        } else if(isNodeHeld) {
            if(curTool === 0) {
                let relativeX, relativeY;

                relativeX = e.clientX - nodeHeldPos[0] + nodePos[0];
                relativeY = e.clientY - nodeHeldPos[1] + nodePos[1];

                heldNode.style.left = relativeX + "px";
                heldNode.style.top = relativeY + "px";
            }
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
        } else if(isNodeHeld) {
            isNodeHeld = false;

            let nodeId = heldNode.getAttribute("data-node-id")
            nodes[nodeId].transform[0] = parseInt(heldNode.style.left.replace("px", ""));
            nodes[nodeId].transform[1] = parseInt(heldNode.style.top.replace("px", ""));
        }
    });

    // Loading completed
    ipcRenderer.send('request-mainprocess-action', {
        message: "loading-end"
    });
});