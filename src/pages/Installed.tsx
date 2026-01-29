import { useFlatpak } from '../hooks/useFlatpak'
import { useCatalog } from '../hooks/useCatalog'
import { Download, ExternalLink, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function Installed() {
  const { installedApps, refreshInstalled } = useFlatpak()
  const { getApp } = useCatalog()
  const [refreshing, setRefreshing] = useState(false)
  const [uninstalling, setUninstalling] = useState<string | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshInstalled()
    setRefreshing(false)
  }

  const handleUninstall = async (appId: string) => {
    if (!confirm('Are you sure you want to uninstall this app?')) return

    setUninstalling(appId)
    try {
      await window.cargstore?.flatpak.uninstall(appId)
      await refreshInstalled()
    } catch (error) {
      console.error('Uninstall failed:', error)
    } finally {
      setUninstalling(null)
    }
  }

  const handleLaunch = async (appId: string) => {
    await window.cargstore?.flatpak.launch(appId)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Installed Apps</h1>
          <p className="text-store-text-secondary mt-1">
            {installedApps.length} {installedApps.length === 1 ? 'app' : 'apps'} installed
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-store-card rounded-lg hover:bg-opacity-80 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* List */}
      {installedApps.length > 0 ? (
        <div className="space-y-2">
          {installedApps.map((app) => {
            const catalogApp = getApp(app.id)
            return (
              <div
                key={app.id}
                className="flex items-center gap-4 p-4 bg-store-card rounded-xl"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-store-bg flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-store-accent to-purple-600 flex items-center justify-center text-white font-bold">
                    {app.name[0]}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{app.name}</h3>
                  <p className="text-sm text-store-text-secondary">
                    {app.version} • {app.size}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLaunch(app.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => handleUninstall(app.id)}
                    disabled={uninstalling === app.id}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Uninstall"
                  >
                    {uninstalling === app.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-store-text-secondary">
          <Download className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">No apps installed</p>
          <p className="text-sm mt-1">Install apps from the Discover page</p>
        </div>
      )}
    </div>
  )
}
