interface InstalledApp {
  id: string
  name: string
  version: string
  size: string
  origin: string
}

interface AppUpdate {
  id: string
  currentVersion: string
  newVersion: string
}

interface CargstoreAPI {
  flatpak: {
    listInstalled: () => Promise<InstalledApp[]>
    install: (appId: string) => Promise<void>
    installBundle: (appId: string, bundleUrl: string) => Promise<void>
    uninstall: (appId: string) => Promise<void>
    launch: (appId: string) => Promise<void>
    checkUpdates: () => Promise<AppUpdate[]>
    update: (appId: string) => Promise<void>
    updateAll: () => Promise<void>
    onProgress: (callback: (data: { appId: string; progress: number }) => void) => void
  }
  catalog: {
    get: () => Promise<{ apps: CatalogApp[]; categories: Category[] }>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
  app: {
    getVersion: () => Promise<string>
  }
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

declare global {
  interface Window {
    cargstore?: CargstoreAPI
  }
}

export {}
