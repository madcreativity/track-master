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

    // Loading completed
    ipcRenderer.send('request-mainprocess-action', {
        message: "loading-end"
    });
});