import { useState, useCallback } from 'react'
import type { Filters, Internship, ApplicationStatus } from '../types'
import { useInternships } from '../hooks/useInternships'
import { useStats } from '../hooks/useStats'
import FilterSidebar from '../components/filters/FilterSidebar'
import InternshipCard from '../components/cards/InternshipCard'
import InternshipDetail from '../components/cards/InternshipDetail'

const DEFAULT_FILTERS: Partial<Filters> = {
  sort: 'date_scraped',
  order: 'desc',
}

export default function Browse() {
  const [filters, setFilters] = useState<Partial<Filters>>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<Internship | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { internships, pagination, loading, error, page, goToPage } = useInternships(filters)
  const { stats } = useStats()

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      {/* Stats banner */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active listings', value: stats.total, icon: '📋' },
            { label: 'Companies', value: stats.companies.length, icon: '🏢' },
            { label: 'Categories', value: stats.categories.length, icon: '🏷️' },
            { label: 'Direct listings', value: stats.sources.filter(s => !['LinkedIn','Indeed','Glassdoor','IrishJobs','GradIreland','RecruitIreland','ETRecruite'].includes(s.source)).reduce((a, b) => a + b.count, 0), icon: '⭐' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <div className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin pb-4">
            <FilterSidebar filters={filters} stats={stats} onFilterChange={handleFilterChange} onReset={handleReset} />
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-3 rounded-full shadow-lg font-medium"
          >
            🔽 Filters
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="relative ml-auto w-72 bg-white dark:bg-gray-900 h-full overflow-y-auto p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400">✕</button>
              </div>
              <FilterSidebar filters={filters} stats={stats} onFilterChange={handleFilterChange} onReset={handleReset} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : pagination ? `${pagination.total.toLocaleString()} internships` : 'Internships'}
              </h1>
              {filters.category && (
                <p className="text-sm text-gray-500 dark:text-gray-400">in {filters.category}</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm mb-4">
              {error}. Make sure the backend is running.
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-3 h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="mt-2 h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && internships.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No internships found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                {Object.values(filters).some(v => v && v !== 'date_scraped' && v !== 'desc')
                  ? 'Try adjusting your filters or running a scrape from the Scraper Status page.'
                  : 'Run a scrape from the Scraper Status page to populate listings.'}
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && internships.length > 0 && (
            <>
              <div className="grid gap-3">
                {internships.map(internship => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    onClick={() => setSelected(internship)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                    let p = i + 1
                    if (pagination.pages > 7) {
                      if (page <= 4) p = i + 1
                      else if (page >= pagination.pages - 3) p = pagination.pages - 6 + i
                      else p = page - 3 + i
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-brand-600 text-white'
                            : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >{p}</button>
                    )
                  })}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pagination.pages}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <InternshipDetail
          internship={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
