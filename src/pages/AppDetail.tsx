import { useParams, useNavigate } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useFlatpak } from '../hooks/useFlatpak'
import { ArrowLeft, Download, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AppDetail() {
  const { appId } = useParams()
  const navigate = useNavigate()
  const decodedAppId = appId ? decodeURIComponent(appId) : ''

  const { getApp } = useCatalog()
  const { isInstalled, install, launch, installing, progress } = useFlatpak(decodedAppId)
  const [uninstalling, setUninstalling] = useState(false)
  const [imageError, setImageError] = useState(false)

  const app = getApp(decodedAppId)

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-store-text-secondary">App not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 text-store-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </button>
      </div>
    )
  }

  const handleInstall = async () => {
    try {
      await install()
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  const handleUninstall = async () => {
    if (!confirm('Are you sure you want to uninstall this app?')) return

    setUninstalling(true)
    try {
      await window.cargstore?.flatpak.uninstall(decodedAppId)
    } catch (error) {
      console.error('Uninstall failed:', error)
    } finally {
      setUninstalling(false)
    }
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-store-text-secondary hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* App header */}
      <div className="flex gap-6 mb-8">
        {/* Icon */}
        <div className="w-32 h-32 rounded-2xl bg-store-card flex items-center justify-center flex-shrink-0">
          {!imageError ? (
            <img
              src={`/assets/icons/${app.icon}`}
              alt={app.name}
              className="w-24 h-24 object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-store-accent to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
              {app.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <p className="text-store-text-secondary mt-1">{app.summary}</p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            {isInstalled ? (
              <>
                <button
                  onClick={() => launch()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors font-medium"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open
                </button>
                <button
                  onClick={handleUninstall}
                  disabled={uninstalling}
                  className="flex items-center gap-2 px-6 py-2.5 bg-store-card text-red-400 rounded-lg hover:bg-red-400/10 transition-colors font-medium"
                >
                  {uninstalling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Uninstall
                </button>
              </>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex items-center gap-2 px-6 py-2.5 bg-store-accent text-white rounded-lg hover:bg-store-accent-hover transition-colors font-medium disabled:opacity-75"
              >
                {installing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {progress > 0 ? `Installing ${progress}%` : 'Installing...'}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Install
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">About</h2>
        <p className="text-store-text-secondary leading-relaxed">
          {app.description}
        </p>
      </section>

      {/* Details */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-store-card rounded-xl p-4">
            <p className="text-sm text-store-text-secondary">Category</p>
            <p className="font-medium capitalize">{app.category.replace('-', ' & ')}</p>
          </div>
          <div className="bg-store-card rounded-xl p-4">
            <p className="text-sm text-store-text-secondary">Flatpak ID</p>
            <p className="font-medium font-mono text-sm">{app.id}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
