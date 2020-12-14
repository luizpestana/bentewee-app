const {app, shell, BrowserWindow} = require('electron');
const path = require('path');

let mainWindow = null;
const instanceLock = app.requestSingleInstanceLock();

if (!instanceLock) {
  app.quit();
  return;
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

let customUrl = null;
if (process.platform === 'win32') {
  app.setAsDefaultProtocolClient('bentewee', process.execPath, [app.getAppPath()]);
} else {
  app.setAsDefaultProtocolClient('bentewee');
}

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
  if (parseCustomUrl(process.argv)) {
    loadCustomUrl();
  }
}

function parseCustomUrl(argv) {
  if (customUrl) {
    return true;
  }
  for (const url of argv) {
    if (url.startsWith('bentewee://')) {
      customUrl = 'https://www.bentewee.com/' + url.substr(11);
      return true;
    }
  }
  return false;
}

function loadCustomUrl() {
  if (customUrl) {
    mainWindow.webContents.executeJavaScript(`newTab('${customUrl}');`);
  }
  customUrl = null;
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', (event, argv, workingDirectory) => {
  if (mainWindow) {
    if (parseCustomUrl(argv)) {
      loadCustomUrl();
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (parseCustomUrl([url])) {
    if (app.isReady()) {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        loadCustomUrl();
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();    
      }
    }
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (e, contents) => {
  if (contents.getType() == 'webview') {
    contents.on('new-window', (e, url) => {
      e.preventDefault();
      if (url.startsWith('https://www.bentewee.com/')) {
        mainWindow.webContents.executeJavaScript(`newTab('${url}');`);
      } else {
        shell.openExternal(url);
      }
    });
  }
});
