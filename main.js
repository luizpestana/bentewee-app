const {app, shell, BrowserWindow} = require('electron');
const path = require('path');

let pluginName
switch (process.platform) {
  case 'win32':
    pluginName = './plugins/pepflashplayer.dll';
    break;
  case 'darwin':
    pluginName = './plugins/PepperFlashPlayer.plugin';
    break;
  case 'linux':
    pluginName = './plugins/libpepflashplayer.so';
    break;
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: `${__dirname}/build/icon.png`,
    webPreferences: {
      plugins: true,
      webviewTag: true,
      devTools: false,
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
}

app.whenReady().then(() => {
  console.log(process.versions);
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (e, contents) => {
  if (contents.getType() == 'webview') {
    contents.on('new-window', (e, url) => {
      e.preventDefault();
      shell.openExternal(url);
    });
  }
});
