import { useState, useEffect } from 'react'
import { RefreshCw, Download, Loader2, CheckCircle, ExternalLink, Package } from 'lucide-react'

interface AppUpdate {
  id: string
  currentVersion: string
  newVersion: string
}

interface SelfUpdateState {
  available: boolean
  currentVersion: string
  latestVersion?: string
  releaseUrl?: string
  tarballUrl?: string
  error?: string
}

export default function Updates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updatingAll, setUpdatingAll] = useState(false)
  const [selfUpdate, setSelfUpdate] = useState<SelfUpdateState | null>(null)
  const [selfUpdateLoading, setSelfUpdateLoading] = useState(true)
  const [selfUpdating, setSelfUpdating] = useState(false)

  const checkUpdates = async () => {
    setLoading(true)
    try {
      const result = await window.cargstore?.flatpak.checkUpdates() || []
      setUpdates(result)
    } catch (error) {
      console.error('Failed to check updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSelfUpdate = async () => {
    setSelfUpdateLoading(true)
    try {
      const result = await window.cargstore?.app.checkSelfUpdate()
      if (result) setSelfUpdate(result)
    } catch (error) {
      console.error('Failed to check Cargstore update:', error)
    } finally {
      setSelfUpdateLoading(false)
    }
  }

  useEffect(() => {
    checkUpdates()
    checkSelfUpdate()
  }, [])

  const handleUpdate = async (appId: string) => {
    setUpdating(appId)
    try {
      await window.cargstore?.flatpak.update(appId)
      setUpdates((prev) => prev.filter((u) => u.id !== appId))
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateAll = async () => {
    setUpdatingAll(true)
    try {
      for (const update of updates) {
        await window.cargstore?.flatpak.update(update.id)
      }
      setUpdates([])
    } catch (error) {
      console.error('Update all failed:', error)
    } finally {
      setUpdatingAll(false)
      checkUpdates()
    }
  }

  const handleSelfUpdate = async () => {
    if (!selfUpdate?.tarballUrl) return
    setSelfUpdating(true)
    try {
      await window.cargstore?.app.selfUpdate(selfUpdate.tarballUrl)
    } catch (error) {
      console.error('Self-update failed:', error)
      setSelfUpdating(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Updates</h1>
          <p className="text-store-text-secondary mt-1">
            {updates.length} {updates.length === 1 ? 'update' : 'updates'} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { checkUpdates(); checkSelfUpdate() }}
            disabled={loading || selfUpdateLoading}
            className="flex items-center gap-2 px-4 py-2 bg-store-card rounded-lg hover:bg-opacity-80 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading || selfUpdateLoading ? 'animate-spin' : ''}`} />
            Check
          </button>
          {updates.length > 0 && (
            <button
              onClick={handleUpdateAll}
              disabled={updatingAll}
              className="flex items-center gap-2 px-4 py-2 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors"
            >
              {updatingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Update All
            </button>
          )}
        </div>
      </div>

      {/* Cargstore self-update section */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-store-text-secondary uppercase tracking-wider mb-3">Cargstore</h2>
        {selfUpdateLoading ? (
          <div className="flex items-center gap-3 p-4 bg-store-card rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-store-accent" />
            <span className="text-sm text-store-text-secondary">Checking for updates...</span>
          </div>
        ) : selfUpdate?.available ? (
          <div className="flex items-center gap-4 p-4 bg-store-card rounded-xl border border-store-accent/30">
            <div className="w-12 h-12 rounded-xl bg-store-bg flex items-center justify-center">
              <Package className="w-7 h-7 text-store-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">Cargstore</h3>
              <p className="text-sm text-store-text-secondary">
                v{selfUpdate.currentVersion} &rarr; v{selfUpdate.latestVersion}
              </p>
              {selfUpdate.releaseUrl && (
                <a
                  href={selfUpdate.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-store-accent hover:underline mt-1"
                >
                  Release Notes <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={handleSelfUpdate}
              disabled={selfUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors"
            >
              {selfUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Update
            </button>
          </div>
        ) : selfUpdate ? (
          <div className="flex items-center gap-3 p-4 bg-store-card rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">
              Cargstore v{selfUpdate.currentVersion} &mdash; Up to date
            </span>
          </div>
        ) : null}
      </div>

      {/* Flatpak updates section */}
      <h2 className="text-sm font-medium text-store-text-secondary uppercase tracking-wider mb-3">Applications</h2>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-store-accent" />
        </div>
      ) : updates.length > 0 ? (
        <div className="space-y-2">
          {updates.map((update) => (
            <div
              key={update.id}
              className="flex items-center gap-4 p-4 bg-store-card rounded-xl"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-store-bg flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-store-accent to-purple-600 flex items-center justify-center text-white font-bold">
                  {update.id[0].toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{update.id}</h3>
                <p className="text-sm text-store-text-secondary">
                  {update.currentVersion} &rarr; {update.newVersion}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={() => handleUpdate(update.id)}
                disabled={updating === update.id}
                className="flex items-center gap-2 px-4 py-2 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors"
              >
                {updating === update.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Update
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-store-text-secondary">
          <CheckCircle className="w-16 h-16 mb-4 text-green-500 opacity-75" />
          <p className="text-lg">All apps are up to date</p>
          <p className="text-sm mt-1">Check back later for new updates</p>
        </div>
      )}
    </div>
  )
}
