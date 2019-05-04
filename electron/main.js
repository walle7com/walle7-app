const {app, Menu, shell, BrowserWindow} = require('electron')
const windowStateKeeper = require('electron-window-state')
var path = require('path')
let mainWindow
app.on('ready', function () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 960,
    defaultHeight: 640
  });
  mainWindow = new BrowserWindow({
    minWidth: 336,
    minHeight: 600,
    titleBarStyle: 'hidden',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    center: true,
    icon: path.join(__dirname, 'www/i/favicon.png'),
    title: 'Walle7',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      webSecurity: true
    }
  })
  mainWindow.loadFile('www/index.html')
  mainWindow.on('closed', function () {
    mainWindow = app.quit()
  })
  mainWindow.webContents.on('new-window', function(event, url){
   event.preventDefault()
   shell.openExternal(url)
  })
  mainWindowState.manage(mainWindow);
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
if (process.platform === 'darwin') {
const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { label: 'Developer',
        submenu: [
        { role: 'toggledevtools' } 
        ]
      }
    ]
  },
  {
    role: 'Window',
    submenu: [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { role: 'resetzoom' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'Help',
    submenu: [
      {
        label: `Visit Walle7.com`,
        click () { require('electron').shell.openExternal('https://walle7.com') }
      },
      {
        label: `Help Center`,
        click () { require('electron').shell.openExternal('https://walle7.com/chat/') }
      },
      {
        label: 'Report an issue',
        click () { require('electron').shell.openExternal('https://walle7.com/chat/') }
      }
    ]
  }
]
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
}