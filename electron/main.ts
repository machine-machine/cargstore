import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { FlatpakManager } from './flatpak'
import { ClawdbotClient } from './clawdbot-client'

let mainWindow: BrowserWindow | null = null
let flatpak: FlatpakManager
let clawdbot: ClawdbotClient

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Initialize managers
  flatpak = new FlatpakManager()
  clawdbot = new ClawdbotClient()

  createWindow()

  // Register IPC handlers
  registerIpcHandlers()

  // Connect to Clawdbot Gateway
  clawdbot.connect()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function registerIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => mainWindow?.close())

  // Flatpak operations
  ipcMain.handle('flatpak:list-installed', () => flatpak.listInstalled())
  ipcMain.handle('flatpak:install', async (_event, appId: string) => {
    return flatpak.install(appId, (progress) => {
      mainWindow?.webContents.send('flatpak:progress', { appId, progress })
    })
  })
  ipcMain.handle('flatpak:uninstall', (_event, appId: string) => flatpak.uninstall(appId))
  ipcMain.handle('flatpak:launch', (_event, appId: string) => flatpak.launch(appId))
  ipcMain.handle('flatpak:check-updates', () => flatpak.checkUpdates())
  ipcMain.handle('flatpak:update', (_event, appId: string) => flatpak.update(appId))

  // Catalog
  ipcMain.handle('catalog:get', () => {
    const catalogPath = isDev
      ? path.join(__dirname, '../catalog/apps.json')
      : path.join(process.resourcesPath, 'catalog/apps.json')
    return require(catalogPath)
  })
}
