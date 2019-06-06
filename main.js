const { ipcMain, app, BrowserWindow } = require('electron');

let winLoading;
let win;

let isLoading = true;

var createLoadingWindow = () => {
    // Create loading window
    winLoading = new BrowserWindow({
        width: 700,
        height: 525,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
        icon: __dirname + '/assets/icons/icon.ico',
        title: "Tracks",
        frame: false
    });

    // Load loading.html
    winLoading.loadFile('./loading.html');

    global.winLoading = winLoading;

    // Execute when window is closed
    winLoading.on('closed', () => {
        // Dereference window
        winLoading = null;
        
        if(win !== null && isLoading) {
            win.close();
        }
    });

    // Create main window
    createMainWindow();
}

var createMainWindow = () => {
    // Create browser window
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
        icon: __dirname + '/assets/icons/icon.ico',
        title: "Tracks",
        show: false,
        frame: false
    });

    // Load index.html
    win.loadFile('./index.html');
    
    // Execute when window is closed
    win.on('closed', () => {
        // Dereference window
        winLoading = null;
        win = null;
    });
    
    global.win = win;
}

ipcMain.on('request-mainprocess-action', (event, arg) => {
    if(arg.message === "loading-end") {
        isLoading = false;
        winLoading.close();
        win.show();
    } else if(arg.message === "error-out") {
        winLoading.webContents.executeJavaScript('console.error("' + arg.data + '");');
    }
});

app.on('ready', createLoadingWindow);

app.on('window-all-closed', () => {
    // macOS docking
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // macOS "undocking"
    if (win === null && winLoading === null) {
        createLoadingWindow();
    }
});