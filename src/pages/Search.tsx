import { useSearchParams } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import AppCard from '../components/AppCard'
import { Search as SearchIcon } from 'lucide-react'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  const { searchApps, getAppsByCategory, catalog } = useCatalog()

  const results = category
    ? getAppsByCategory(category)
    : query
    ? searchApps(query)
    : []

  const categoryName = category
    ? catalog?.categories.find((c) => c.id === category)?.name
    : null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        {categoryName ? (
          <h1 className="text-2xl font-semibold">{categoryName}</h1>
        ) : query ? (
          <h1 className="text-2xl font-semibold">
            Search results for "{query}"
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold">Search</h1>
        )}
        <p className="text-store-text-secondary mt-1">
          {results.length} {results.length === 1 ? 'app' : 'apps'} found
        </p>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-store-text-secondary">
          <SearchIcon className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">No apps found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  )
}
