import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import Discover from './pages/Discover'
import Search from './pages/Search'
import Installed from './pages/Installed'
import Updates from './pages/Updates'
import AppDetail from './pages/AppDetail'
import { CatalogProvider } from './hooks/useCatalog'

export default function App() {
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    // Check for updates on startup
    window.cargstore?.flatpak.checkUpdates().then((updates) => {
      setUpdateCount(updates.length)
    })
  }, [])

  return (
    <CatalogProvider>
      <div className="flex flex-col h-screen bg-store-bg">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar updateCount={updateCount} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/search" element={<Search />} />
              <Route path="/installed" element={<Installed />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/app/:appId" element={<AppDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </CatalogProvider>
  )
}
