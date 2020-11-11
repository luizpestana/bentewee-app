const {app, shell, BrowserWindow} = require('electron');
const path = require('path');

let mainWindow = null;
const instanceLock = app.requestSingleInstanceLock();

if (!instanceLock) {
  app.quit();
}
else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    if (mainWindow) {
      console.log('Second instance launched. Focus on currently running instance if minimized.');

      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        mainWindow.focus();
      }
    }
  });
}

const isPackaged = ((
  process.mainModule &&
  process.mainModule.filename.indexOf('app.asar') !== -1
) || (process.argv.filter(a => a.indexOf('app.asar') !== -1).length > 0));

let pluginName;
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
if (isPackaged) {
  pluginName = path.join(__dirname, '../../', pluginName);
} else {
  pluginName = path.join(__dirname, pluginName);
}
app.commandLine.appendSwitch('ppapi-flash-path', pluginName);

function createWindow () {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: `${__dirname}/build/icon.png`,
    title: __dirname,
    webPreferences: {
      plugins: true,
      webviewTag: true,
      devTools: false,
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
}

app.whenReady().then(() => {
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
