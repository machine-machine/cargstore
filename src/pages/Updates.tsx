import { useState, useEffect } from 'react'
import { RefreshCw, Download, Loader2, CheckCircle } from 'lucide-react'

interface AppUpdate {
  id: string
  currentVersion: string
  newVersion: string
}

export default function Updates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updatingAll, setUpdatingAll] = useState(false)

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

  useEffect(() => {
    checkUpdates()
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
            onClick={checkUpdates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-store-card rounded-lg hover:bg-opacity-80 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                  {update.currentVersion} → {update.newVersion}
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
