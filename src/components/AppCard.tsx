import { Link } from 'react-router-dom'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useFlatpak } from '../hooks/useFlatpak'

interface AppCardProps {
  app: {
    id: string
    name: string
    summary: string
    icon: string
    category: string
  }
}

export default function AppCard({ app }: AppCardProps) {
  const { isInstalled, install, launch, installing, progress } = useFlatpak(app.id)
  const [imageError, setImageError] = useState(false)

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isInstalled) {
      await launch()
    } else {
      await install()
    }
  }

  return (
    <Link
      to={`/app/${encodeURIComponent(app.id)}`}
      className="block bg-store-card rounded-xl p-4 hover:bg-opacity-80 transition-all hover:scale-[1.02] hover:shadow-lg"
    >
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-store-bg flex items-center justify-center overflow-hidden">
        {!imageError ? (
          <img
            src={`/assets/icons/${app.icon}`}
            alt={app.name}
            className="w-12 h-12 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-store-accent to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {app.name[0]}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-medium text-center text-store-text truncate">
        {app.name}
      </h3>

      {/* Summary */}
      <p className="text-xs text-store-text-secondary text-center mt-1 line-clamp-2 h-8">
        {app.summary}
      </p>

      {/* Action button */}
      <button
        onClick={handleAction}
        disabled={installing}
        className={`w-full mt-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          isInstalled
            ? 'bg-store-card border border-store-accent text-store-accent hover:bg-store-accent hover:text-white'
            : 'bg-store-accent text-white hover:bg-store-accent-hover'
        } ${installing ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {installing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress > 0 ? `${progress}%` : 'Installing...'}
          </>
        ) : isInstalled ? (
          <>
            <ExternalLink className="w-4 h-4" />
            Open
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Install
          </>
        )}
      </button>
    </Link>
  )
}
