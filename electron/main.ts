import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import { execSync } from 'child_process'
import { FlatpakManager } from './flatpak'
import { ClawdbotClient } from './clawdbot-client'

let mainWindow: BrowserWindow | null = null
let flatpak: FlatpakManager
let clawdbot: ClawdbotClient

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '../assets/icon.png')
    : path.join(process.resourcesPath, 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    icon: iconPath,
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
  ipcMain.handle('flatpak:install-bundle', async (_event, appId: string, bundleUrl: string) => {
    return flatpak.installFromBundle(bundleUrl, (progress) => {
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

  // App info
  ipcMain.handle('app:get-version', () => app.getVersion())

  // Self-update
  ipcMain.handle('app:check-self-update', async () => {
    const currentVersion = app.getVersion()
    try {
      const data = await fetchJson('https://api.github.com/repos/machine-machine/cargstore/releases/latest')
      const latestVersion = (data.tag_name || '').replace(/^v/, '')
      if (!latestVersion) {
        return { available: false, currentVersion }
      }
      const available = compareVersions(latestVersion, currentVersion) > 0
      return {
        available,
        currentVersion,
        latestVersion,
        releaseUrl: data.html_url,
        tarballUrl: available
          ? `https://github.com/machine-machine/cargstore/releases/download/v${latestVersion}/cargstore-${latestVersion}.tar.gz`
          : undefined,
      }
    } catch (err) {
      console.error('Self-update check failed:', err)
      return { available: false, currentVersion, error: String(err) }
    }
  })

  ipcMain.handle('app:self-update', async (_event, tarballUrl: string) => {
    const tmpPath = '/tmp/cargstore-update.tar.gz'
    try {
      await downloadFile(tarballUrl, tmpPath)
      execSync(`tar -xzf ${tmpPath} -C /opt/cargstore --strip-components=1`, { stdio: 'pipe' })
      execSync(`chmod +x /opt/cargstore/cargstore`, { stdio: 'pipe' })
      execSync(`rm -f ${tmpPath}`, { stdio: 'pipe' })
      app.relaunch()
      app.exit(0)
    } catch (err) {
      console.error('Self-update failed:', err)
      throw err
    }
  })
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Cargstore' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location!).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Cargstore' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location!, dest).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err: Error) => { fs.unlinkSync(dest); reject(err) })
    }).on('error', reject)
  })
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}
