import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Browse from './pages/Browse'
import Applications from './pages/Applications'
import ScraperStatus from './pages/ScraperStatus'
import { useStats } from './hooks/useStats'

function AppInner() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const { stats } = useStats()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar dark={dark} onToggleDark={() => setDark(!dark)} lastUpdated={stats?.last_updated || null} />
      <main>
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/scrape" element={<ScraperStatus />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
