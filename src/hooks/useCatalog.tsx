import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CatalogApp {
  id: string
  name: string
  summary: string
  description: string
  category: string
  icon: string
  featured: boolean
  flatpakRef: string
  keywords: string[]
}

interface Category {
  id: string
  name: string
  icon: string
}

interface Catalog {
  apps: CatalogApp[]
  categories: Category[]
}

interface CatalogContextType {
  catalog: Catalog | null
  loading: boolean
  error: string | null
  getApp: (id: string) => CatalogApp | undefined
  searchApps: (query: string) => CatalogApp[]
  getAppsByCategory: (categoryId: string) => CatalogApp[]
  getFeaturedApps: () => CatalogApp[]
}

const CatalogContext = createContext<CatalogContextType | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCatalog() {
      try {
        // Try to load from Electron IPC, fallback to fetch for dev
        if (window.cargstore?.catalog) {
          const data = await window.cargstore.catalog.get()
          setCatalog(data)
        } else {
          // Development fallback - load from public folder
          const response = await fetch('/catalog/apps.json')
          const data = await response.json()
          setCatalog(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
        // Load default catalog
        setCatalog(defaultCatalog)
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const getApp = (id: string) => catalog?.apps.find((app) => app.id === id)

  const searchApps = (query: string) => {
    if (!catalog) return []
    const lowerQuery = query.toLowerCase()
    return catalog.apps.filter(
      (app) =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.summary.toLowerCase().includes(lowerQuery) ||
        app.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))
    )
  }

  const getAppsByCategory = (categoryId: string) => {
    if (!catalog) return []
    return catalog.apps.filter((app) => app.category === categoryId)
  }

  const getFeaturedApps = () => {
    if (!catalog) return []
    return catalog.apps.filter((app) => app.featured)
  }

  return (
    <CatalogContext.Provider
      value={{
        catalog,
        loading,
        error,
        getApp,
        searchApps,
        getAppsByCategory,
        getFeaturedApps,
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider')
  }
  return context
}

// Default catalog for development/fallback
const defaultCatalog: Catalog = {
  apps: [
    {
      id: 'com.visualstudio.code',
      name: 'Visual Studio Code',
      summary: 'Code editor by Microsoft',
      description: 'Visual Studio Code is a lightweight but powerful source code editor.',
      category: 'development',
      icon: 'vscode.png',
      featured: true,
      flatpakRef: 'flathub:app/com.visualstudio.code/x86_64/stable',
      keywords: ['code', 'editor', 'vscode', 'ide', 'programming'],
    },
    {
      id: 'md.obsidian.Obsidian',
      name: 'Obsidian',
      summary: 'Knowledge base and note-taking',
      description: 'Obsidian is a powerful knowledge base that works on local Markdown files.',
      category: 'office',
      icon: 'obsidian.png',
      featured: true,
      flatpakRef: 'flathub:app/md.obsidian.Obsidian/x86_64/stable',
      keywords: ['notes', 'markdown', 'knowledge', 'writing'],
    },
    {
      id: 'com.slack.Slack',
      name: 'Slack',
      summary: 'Team communication platform',
      description: 'Slack is a messaging app for business that connects people to the information they need.',
      category: 'office',
      icon: 'slack.png',
      featured: true,
      flatpakRef: 'flathub:app/com.slack.Slack/x86_64/stable',
      keywords: ['chat', 'messaging', 'team', 'communication'],
    },
    {
      id: 'org.gimp.GIMP',
      name: 'GIMP',
      summary: 'Image editor',
      description: 'GNU Image Manipulation Program for photo retouching, image composition and image authoring.',
      category: 'creative',
      icon: 'gimp.png',
      featured: false,
      flatpakRef: 'flathub:app/org.gimp.GIMP/x86_64/stable',
      keywords: ['image', 'photo', 'editor', 'graphics'],
    },
    {
      id: 'org.mozilla.firefox',
      name: 'Firefox',
      summary: 'Web browser by Mozilla',
      description: 'Fast, private and secure web browser from Mozilla.',
      category: 'browsers',
      icon: 'firefox.png',
      featured: false,
      flatpakRef: 'flathub:app/org.mozilla.firefox/x86_64/stable',
      keywords: ['browser', 'web', 'internet'],
    },
  ],
  categories: [
    { id: 'development', name: 'Development', icon: 'code' },
    { id: 'creative', name: 'Creative', icon: 'palette' },
    { id: 'office', name: 'Office', icon: 'file-text' },
    { id: 'ai-ml', name: 'AI & ML', icon: 'brain' },
    { id: 'browsers', name: 'Browsers', icon: 'globe' },
    { id: 'utilities', name: 'Utilities', icon: 'wrench' },
  ],
}
