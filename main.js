const {app, shell, BrowserWindow} = require('electron');
const path = require('path');

let mainWindow = null;
const instanceLock = app.requestSingleInstanceLock();

if (!instanceLock) {
  app.quit();
  process.exit();
}

const isPackaged = ((
  process.mainModule &&
  process.mainModule.filename.indexOf('app.asar') !== -1
) || (process.argv.filter(a => a.indexOf('app.asar') !== -1).length > 0));

let pluginName;
switch (process.platform) {
  case 'darwin':
    pluginName = './plugins/PepperFlashPlayer.plugin';
    break;
  case 'linux':
    pluginName = './plugins/libpepflashplayer_' + process.arch + '.so';
    break;
  case 'win32':
    pluginName = './plugins/pepflashplayer_' + process.arch + '.dll';
    break;
}
if (isPackaged) {
  pluginName = path.join(__dirname, '../../', pluginName);
} else {
  pluginName = path.join(__dirname, pluginName);
}
app.commandLine.appendSwitch('ppapi-flash-path', pluginName);

app.setAsDefaultProtocolClient("bentewee");

function createWindow () {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, './build/icon.icns'),
    title: app.getName(),
    webPreferences: {
      plugins: true,
      webviewTag: true,
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  if (process.argv.length > 1) {
    if (process.argv.length > 2 && process.argv[2] === 'debug') {
      mainWindow.openDevTools();
    } else {
      loadCustomUrl(process.argv[1]);
    }
  }
}

function loadCustomUrl(url) {
  if (url.startsWith('bentewee://')) {
    url = 'https://www.bentewee.com/' + url.substr(11);
    mainWindow.webContents.executeJavaScript(`document.getElementById('benteview').loadURL('${url}');`);
  }
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', (event, argv, workingDirectory) => {
  if (mainWindow) {
    if (argv.length > 1) {
      loadCustomUrl(argv[1]);
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();

  loadCustomUrl(url);
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
