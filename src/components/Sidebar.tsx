import { NavLink } from 'react-router-dom'
import { Compass, Download, RefreshCw, Code, Palette, FileText, Brain, Globe, Wrench } from 'lucide-react'

interface SidebarProps {
  updateCount: number
}

const categories = [
  { id: 'development', name: 'Development', icon: Code },
  { id: 'creative', name: 'Creative', icon: Palette },
  { id: 'office', name: 'Office', icon: FileText },
  { id: 'ai-ml', name: 'AI & ML', icon: Brain },
  { id: 'browsers', name: 'Browsers', icon: Globe },
  { id: 'utilities', name: 'Utilities', icon: Wrench },
]

export default function Sidebar({ updateCount }: SidebarProps) {
  return (
    <aside className="w-48 bg-store-sidebar border-r border-gray-700 flex flex-col">
      {/* Main navigation */}
      <nav className="p-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-store-accent text-white'
                : 'text-store-text-secondary hover:bg-store-card hover:text-white'
            }`
          }
        >
          <Compass className="w-4 h-4" />
          Discover
        </NavLink>

        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-store-text-secondary uppercase tracking-wider">
          Categories
        </div>

        {categories.map((category) => (
          <NavLink
            key={category.id}
            to={`/search?category=${category.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-store-accent text-white'
                  : 'text-store-text-secondary hover:bg-store-card hover:text-white'
              }`
            }
          >
            <category.icon className="w-4 h-4" />
            {category.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto p-3 border-t border-gray-700">
        <NavLink
          to="/installed"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-store-accent text-white'
                : 'text-store-text-secondary hover:bg-store-card hover:text-white'
            }`
          }
        >
          <Download className="w-4 h-4" />
          Installed
        </NavLink>

        <NavLink
          to="/updates"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-store-accent text-white'
                : 'text-store-text-secondary hover:bg-store-card hover:text-white'
            }`
          }
        >
          <span className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4" />
            Updates
          </span>
          {updateCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-store-accent rounded-full">
              {updateCount}
            </span>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
