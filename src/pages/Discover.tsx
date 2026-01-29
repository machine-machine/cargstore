import { useCatalog } from '../hooks/useCatalog'
import AppCard from '../components/AppCard'
import { Loader2 } from 'lucide-react'

export default function Discover() {
  const { catalog, loading, getFeaturedApps, getAppsByCategory } = useCatalog()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-store-accent" />
      </div>
    )
  }

  const featuredApps = getFeaturedApps()
  const categories = catalog?.categories || []

  return (
    <div className="space-y-8">
      {/* Featured Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Featured</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {featuredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      {/* Category Sections */}
      {categories.map((category) => {
        const apps = getAppsByCategory(category.id)
        if (apps.length === 0) return null

        return (
          <section key={category.id}>
            <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {apps.slice(0, 5).map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
