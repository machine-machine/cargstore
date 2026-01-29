import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="titlebar-drag flex items-center justify-between h-12 px-4 bg-store-sidebar border-b border-gray-700">
      {/* Window controls (Linux style - right side usually, but we put left for macOS feel) */}
      <div className="titlebar-no-drag flex items-center gap-2">
        <button
          onClick={() => window.cargstore?.window.close()}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          title="Close"
        />
        <button
          onClick={() => window.cargstore?.window.minimize()}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
          title="Minimize"
        />
        <button
          onClick={() => window.cargstore?.window.maximize()}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
          title="Maximize"
        />
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="titlebar-no-drag flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-store-text-secondary" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-store-bg rounded-lg text-sm text-store-text placeholder-store-text-secondary focus:outline-none focus:ring-2 focus:ring-store-accent"
          />
        </div>
      </form>

      {/* Title */}
      <div className="text-sm font-medium text-store-text-secondary">
        Cargstore
      </div>
    </div>
  )
}
