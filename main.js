const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: true
        }
    })
    win.loadFile('index.html');
    //win.openDevTools();

    // use electron remote to pass command-line args to the renderer process
    // command-line args are only available in the main process, but we need
    // to reference them in the renderer process (i could probably pass a message
    // from renderer to main like i do to close the app, but, meh, once figured 
    // out this is easier)
    require('@electron/remote/main').initialize();
    require('@electron/remote/main').enable(win.webContents);
    global.sharedObject = {prop1: process.argv};
};

app.whenReady().then(() => {
    createWindow();

    // for macos behavior; intentionally skipping other OS behavior as this is mac only
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// handle close-app message from renderer 
ipcMain.on('close-app', () => {
    app.quit();
});