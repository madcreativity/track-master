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
    // Hold down left mouse button on connection dot and drag to another connection dot to connect two nodes -- WIP
    
    let curTool = 0; // Edit, Grab
    let keyMap = {};
    let DOMeditorPage = document.querySelector("#page-editor");

    window.addEventListener('keydown', (e) => {
        e = e || window.event;
        keyMap[e.keyCode] = e.type == 'keydown';        

        if(curTool === 0) {
            if(e.keyCode === 32) {
                curTool = 1;
                document.body.classList.replace("tool-edit", "tool-grab");
            } else if(e.keyCode === 46 && heldNode.parentNode !== null) {
                let nodeId = heldNode.getAttribute("data-node-id");
                
                // Remove node element
                nodes.splice(nodeId, 1);
                heldNode.parentNode.removeChild(heldNode);
                
                // Remove all connections to nodes
                for(let n = 0; n < nodes.length; n++) {
                    let thisNodePos = nodes[n].connections.indexOf(nodeId);
                    
                    if(thisNodePos !== -1) {
                        nodes[n].connections.splice(thisNodePos, 1);
                    }

                    for(let i = 0; i < nodes[n].connections.length; i++) {
                        if(nodes[n].connections[i] > nodeId) {
                            nodes[n].connections[i] = (parseInt(nodes[n].connections[i]) - 1).toString();
                        }
                    }
                    
                    let thisNodeElement = DOMeditorNodeContainer.children[n];
                    if(thisNodeElement.getAttribute("data-node-id") > nodeId) {
                        thisNodeElement.setAttribute("data-node-id", thisNodeElement.getAttribute("data-node-id") - 1);
                    }
                }


                updateCanvas();
            }
        }

        // CTRL + S to save
        if(keyMap[17] && keyMap[83]) {
            if(filePath !== "") {
                fileSave();
            } else {
                fileSaveAs();
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

        keyMap[e.keyCode] = e.type == 'keydown';
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
    let isMouseConnectionHeld = false;
    let mouseConnectionNode = 0;
    let mouseConnectionPos = [0, 0];
    
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


            updateCanvas();
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

        updateCanvas();
    });

    // Window buttons
    let DOMwinBtnContainer = document.querySelector("#windowButtons");
    DOMwinBtnContainer.addEventListener('click', (e) => {
        if(e.target.id === "windowCloseBtn") {
            win.close(); // Close
        } else if(e.target.id === "windowMinimizeBtn") {
            win.minimize(); // Minimize
        } else if(e.target.id === "windowMaximizeBtn") {
            if(win.isMaximized()) {
                win.restore(); // Restore
                e.target.innerText = String.fromCodePoint(0x1F5D6); // 'Maximize' - Unicode icon
            } else {
                win.maximize(); // Maximize
                e.target.innerText = String.fromCodePoint(0x1F5D7); // 'Restore' - Unicode icon
            }
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

        updateCanvas();
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
                            
                            document.body.classList.add("loading-cursor");

                            let parsedData;

                            try {
                                parsedData = JSON.parse(data);
                            } catch(err) {
                                console.error(err);
                                document.body.classList.remove("loading-cursor");
                                return;                     
                            }

                            resetEditor();
                            filePath = file;
                            nodes = parsedData.nodes;
                            createNodes();
                            updateCanvas();

                            document.body.classList.remove("loading-cursor");
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
                    nodePos = [ heldNode.offsetLeft, heldNode.offsetTop ];
                } else if(e.target.classList.contains("connectorOut")) {
                    isMouseConnectionHeld = true;
                    mouseConnectionNode = e.target.parentNode.getAttribute("data-node-id");
                    mouseConnectionPos[0] = e.clientX;
                    mouseConnectionPos[1] = e.clientY;

                    updateCanvas();
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

            updateCanvas();
        }
    });

    // Window event -- Move mouse around
    window.addEventListener('mousemove', (e) => {
        e = e || window.event;

        if(isEditorPageHeld) {
            let relativeX, relativeY;

            relativeX = e.clientX - editorPageHeldPos[0] + editorPos[0];
            relativeY = e.clientY - editorPageHeldPos[1] + editorPos[1];

            DOMeditorPage.style.backgroundPosition = relativeX + "px " + relativeY + "px";
            DOMeditorNodeContainer.style.left = relativeX + "px";
            DOMeditorNodeContainer.style.top = relativeY + "px";

            updateCanvas(relativeX, relativeY);
        } else if(isNodeHeld) {
            let relativeX, relativeY;

            relativeX = e.clientX - nodeHeldPos[0] + nodePos[0];
            relativeY = e.clientY - nodeHeldPos[1] + nodePos[1];

            heldNode.style.left = relativeX + "px";
            heldNode.style.top = relativeY + "px";

            updateCanvas();
        } else if(isMouseConnectionHeld) {
            mouseConnectionPos[0] = e.clientX;
            mouseConnectionPos[1] = e.clientY;

            updateCanvas();
        }
    });

    // Window event -- Let go of left mouse button
    window.addEventListener('mouseup', (e) => {
        e = e || window.event;

        if(isEditorPageHeld) {
            isEditorPageHeld = false;

            editorPos[0] = e.clientX - editorPageHeldPos[0] + editorPos[0];
            editorPos[1] = e.clientY - editorPageHeldPos[1] + editorPos[1];
        } else if(isNodeHeld) {
            isNodeHeld = false;

            let nodeId = heldNode.getAttribute("data-node-id")
            nodes[nodeId].transform[0] = heldNode.offsetLeft;
            nodes[nodeId].transform[1] = heldNode.offsetTop;
        } else if(isMouseConnectionHeld) {
            isMouseConnectionHeld = false;

            if(e.target.classList.contains("connectorIn")) {
                nodes[mouseConnectionNode].connections.push(e.target.parentNode.getAttribute("data-node-id"));
            }

            updateCanvas();
        }
    });
    
    // Canvas functionality
    let ctx = DOMnodeCanvas.getContext("2d");

    ctx.fillStyle = "#707070";

    let drawCurve = (curve, offset) => {
        offset = offset || { x:0, y:0 };

        var ox = offset.x;
        var oy = offset.y;
        var p = curve.points, i;
        
        ctx.beginPath();
        ctx.moveTo(p[0].x + ox, p[0].y + oy);

        if(p.length === 3) {
            ctx.quadraticCurveTo(
                p[1].x + ox, p[1].y + oy,
                p[2].x + ox, p[2].y + oy
            );
        }

        if(p.length === 4) {
            ctx.bezierCurveTo(
                p[1].x + ox, p[1].y + oy,
                p[2].x + ox, p[2].y + oy,
                p[3].x + ox, p[3].y + oy
            );
        }

        ctx.stroke();
        ctx.closePath();
    }

    let updateCanvas = (offsetX, offsetY) => {
        offsetX = offsetX || editorPos[0];
        offsetY = offsetY || editorPos[1];

        // Clear canvas
        ctx.clearRect(0, 0, DOMnodeCanvas.width, DOMnodeCanvas.height);

        // Draw connection curves
        for(let i = 0; i < nodes.length; i++) {
            for(let n = 0; n < nodes[i].connections.length; n++) {
                let node = DOMeditorNodeContainer.children[i];
                let connectedNode = DOMeditorNodeContainer.children[nodes[i].connections[n]];
                
                let curve;

                if(node.offsetLeft + node.clientWidth > connectedNode.offsetLeft) {
                    // Works when connected node's left side is to the left of the current node
                    curve = new bezier([
                        {x: node.offsetLeft + node.clientWidth + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                        {x: (node.offsetLeft + node.clientWidth) - (connectedNode.offsetLeft - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + node.clientHeight + (connectedNode.offsetTop - node.offsetTop - node.clientHeight) / 2 + offsetY},
                        {x: (connectedNode.offsetLeft) + (connectedNode.offsetLeft - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + node.clientHeight + (connectedNode.offsetTop - node.offsetTop - node.clientHeight) / 2 + offsetY},
                        {x: connectedNode.offsetLeft + offsetX, y: connectedNode.offsetTop + (connectedNode.clientHeight / 2) + offsetY}
                    ]);
                } else {
                    // Works when connected node's left side is to the right of the current node
                    curve = new bezier([
                        {x: node.offsetLeft + node.clientWidth + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                        {x: (node.offsetLeft + node.clientWidth) + (connectedNode.offsetLeft - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                        {x: (node.offsetLeft + node.clientWidth) + (connectedNode.offsetLeft - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: connectedNode.offsetTop + (connectedNode.clientHeight / 2) + offsetY},
                        {x: connectedNode.offsetLeft + offsetX, y: connectedNode.offsetTop + (connectedNode.clientHeight / 2) + offsetY}
                    ]);
                }
                
                drawCurve(curve);

                /* Debug curve handles */
                /*ctx.fillStyle = "#0000EE";
                ctx.fillRect(curve.points[1].x - 5, curve.points[1].y - 5, 10, 10);

                ctx.fillStyle = "#EE0000";
                ctx.fillRect(curve.points[2].x - 5, curve.points[2].y - 5, 10, 10);
                ctx.fillStyle = "#707070";*/
            }
        }

        // Draw connection curve to mouse
        if(isMouseConnectionHeld) {
            let node = DOMeditorNodeContainer.children[mouseConnectionNode];
            
            let curve;

            if(node.offsetLeft + node.clientWidth > mouseConnectionPos[0] - offsetX) {
                // Works when mouse is to the left of current node
                curve = new bezier([
                    {x: node.offsetLeft + node.clientWidth + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                    {x: (node.offsetLeft + node.clientWidth) - ((mouseConnectionPos[0] - offsetX) - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + node.clientHeight + ((mouseConnectionPos[1] - offsetY) - node.offsetTop - node.clientHeight) / 2 + offsetY},
                    {x: (mouseConnectionPos[0]) + ((mouseConnectionPos[0] - offsetX) - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + node.clientHeight + ((mouseConnectionPos[1] - offsetY) - node.offsetTop - node.clientHeight) / 2 + offsetY},
                    {x: mouseConnectionPos[0], y: mouseConnectionPos[1]}
                ]);
            } else {
                // Works when mouse is to the right of current node
                curve = new bezier([
                    {x: node.offsetLeft + node.clientWidth + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                    {x: (node.offsetLeft + node.clientWidth) + ((mouseConnectionPos[0] - offsetX) - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: node.offsetTop + (node.clientHeight / 2) + offsetY},
                    {x: (node.offsetLeft + node.clientWidth) + ((mouseConnectionPos[0] - offsetX) - node.offsetLeft - node.clientWidth) / 2 + offsetX, y: (mouseConnectionPos[1] - offsetY) + offsetY},
                    {x: mouseConnectionPos[0], y: mouseConnectionPos[1]}
                ]);
            }
            
            drawCurve(curve);
        }
    }

    updateCanvas();
    
    // Loading completed
    ipcRenderer.send('request-mainprocess-action', {
        message: "loading-end"
    });
});