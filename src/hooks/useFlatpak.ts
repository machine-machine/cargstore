import { useState, useEffect, useCallback } from 'react'

interface InstalledApp {
  id: string
  name: string
  version: string
  size: string
}

// Global state for installed apps (shared across components)
let installedAppsCache: InstalledApp[] = []
let installedAppsListeners: Set<() => void> = new Set()

function notifyListeners() {
  installedAppsListeners.forEach((listener) => listener())
}

export function useFlatpak(appId?: string) {
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(installedAppsCache)

  // Subscribe to installed apps updates
  useEffect(() => {
    const listener = () => setInstalledApps([...installedAppsCache])
    installedAppsListeners.add(listener)
    return () => {
      installedAppsListeners.delete(listener)
    }
  }, [])

  // Listen for progress updates
  useEffect(() => {
    if (!appId) return

    window.cargstore?.flatpak.onProgress((data) => {
      if (data.appId === appId) {
        setProgress(data.progress)
      }
    })
  }, [appId])

  const refreshInstalled = useCallback(async () => {
    const apps = await window.cargstore?.flatpak.listInstalled() || []
    installedAppsCache = apps
    notifyListeners()
  }, [])

  // Initial load
  useEffect(() => {
    if (installedAppsCache.length === 0) {
      refreshInstalled()
    }
  }, [refreshInstalled])

  const isInstalled = appId
    ? installedApps.some((app) => app.id === appId)
    : false

  const install = useCallback(async (bundleUrl?: string) => {
    if (!appId) return

    setInstalling(true)
    setProgress(0)
    try {
      if (bundleUrl) {
        await window.cargstore?.flatpak.installBundle(appId, bundleUrl)
      } else {
        await window.cargstore?.flatpak.install(appId)
      }
      await refreshInstalled()
    } catch (error) {
      console.error('Install failed:', error)
      throw error
    } finally {
      setInstalling(false)
    }
  }, [appId, refreshInstalled])

  const uninstall = useCallback(async () => {
    if (!appId) return

    try {
      await window.cargstore?.flatpak.uninstall(appId)
      await refreshInstalled()
    } catch (error) {
      console.error('Uninstall failed:', error)
      throw error
    }
  }, [appId, refreshInstalled])

  const launch = useCallback(async () => {
    if (!appId) return
    await window.cargstore?.flatpak.launch(appId)
  }, [appId])

  return {
    installedApps,
    isInstalled,
    installing,
    progress,
    install,
    uninstall,
    launch,
    refreshInstalled,
  }
}
