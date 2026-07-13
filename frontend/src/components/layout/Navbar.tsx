import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import clsx from 'clsx'

interface NavbarProps {
  dark: boolean
  onToggleDark: () => void
  lastUpdated: string | null
}

export default function Navbar({ dark, onToggleDark, lastUpdated }: NavbarProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Browse', icon: '🔍' },
    { to: '/applications', label: 'My Applications', icon: '📋' },
    { to: '/scrape', label: 'Scraper Status', icon: '⚙️' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-gray-900 dark:text-white">
            <span className="text-2xl">🎓</span>
            <div className="hidden sm:block">
              <div className="text-base font-bold leading-tight">Dublin Finance</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-normal leading-tight">Internship Tracker</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                )}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span>Updated {new Date(lastUpdated).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}</span>
              </div>
            )}

            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                )}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
