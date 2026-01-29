import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('cargstore', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // Flatpak operations
  flatpak: {
    listInstalled: () => ipcRenderer.invoke('flatpak:list-installed'),
    install: (appId: string) => ipcRenderer.invoke('flatpak:install', appId),
    installBundle: (appId: string, bundleUrl: string) => ipcRenderer.invoke('flatpak:install-bundle', appId, bundleUrl),
    uninstall: (appId: string) => ipcRenderer.invoke('flatpak:uninstall', appId),
    launch: (appId: string) => ipcRenderer.invoke('flatpak:launch', appId),
    checkUpdates: () => ipcRenderer.invoke('flatpak:check-updates'),
    update: (appId: string) => ipcRenderer.invoke('flatpak:update', appId),
    onProgress: (callback: (data: { appId: string; progress: number }) => void) => {
      ipcRenderer.on('flatpak:progress', (_event, data) => callback(data))
    },
  },

  // Catalog
  catalog: {
    get: () => ipcRenderer.invoke('catalog:get'),
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    cargstore: {
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      flatpak: {
        listInstalled: () => Promise<InstalledApp[]>
        install: (appId: string) => Promise<void>
        installBundle: (appId: string, bundleUrl: string) => Promise<void>
        uninstall: (appId: string) => Promise<void>
        launch: (appId: string) => Promise<void>
        checkUpdates: () => Promise<AppUpdate[]>
        update: (appId: string) => Promise<void>
        onProgress: (callback: (data: { appId: string; progress: number }) => void) => void
      }
      catalog: {
        get: () => Promise<Catalog>
      }
    }
  }
}

interface InstalledApp {
  id: string
  name: string
  version: string
  size: string
}

interface AppUpdate {
  id: string
  currentVersion: string
  newVersion: string
}

interface Catalog {
  apps: CatalogApp[]
  categories: Category[]
}

interface CatalogApp {
  id: string
  name: string
  summary: string
  description: string
  category: string
  icon: string
  featured: boolean
  flatpakRef?: string
  bundleUrl?: string
  keywords: string[]
}

interface Category {
  id: string
  name: string
  icon: string
}
