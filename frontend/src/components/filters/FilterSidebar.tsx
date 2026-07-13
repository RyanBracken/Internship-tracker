import clsx from 'clsx'
import type { Filters, Stats } from '../../types'
import { CATEGORY_COLORS } from '../../utils/format'

interface FilterSidebarProps {
  filters: Partial<Filters>
  stats: Stats | null
  onFilterChange: (key: keyof Filters, value: string) => void
  onReset: () => void
}

const CITIES = [
  { value: '', label: '🌍 All cities' },
  { value: 'dublin', label: '🇮🇪 Dublin' },
  { value: 'london', label: '🇬🇧 London' },
  { value: 'paris', label: '🇫🇷 Paris' },
  { value: 'frankfurt', label: '🇩🇪 Frankfurt' },
  { value: 'zurich', label: '🇨🇭 Zurich' },
]
const CATEGORIES = ['Finance', 'Accounting', 'Tax', 'Audit', 'Banking & Investment', 'Economics', 'Business & Strategy', 'Consulting']
const SALARY_TYPES = [
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'not_stated', label: 'Not stated' },
]
const SORT_OPTIONS = [
  { value: 'date_posted', label: 'Date posted' },
  { value: 'date_scraped', label: 'Recently added' },
  { value: 'company', label: 'Company (A-Z)' },
  { value: 'title', label: 'Job title (A-Z)' },
]
const SOURCE_TYPES = [
  { value: 'direct', label: '🏢 Company website' },
  { value: 'job_board', label: '🔗 Job board' },
]

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  )
}

export default function FilterSidebar({ filters, stats, onFilterChange, onReset }: FilterSidebarProps) {
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'date_scraped' && v !== 'desc')

  return (
    <aside className="w-full flex flex-col gap-5">
      {/* City */}
      <FilterSection title="City">
        <div className="flex flex-col gap-1">
          {CITIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterChange('city', filters.city === value ? '' : value)}
              className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors font-medium',
                filters.city === value || (value === '' && !filters.city)
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >{label}</button>
          ))}
        </div>
      </FilterSection>

      {/* Search */}
      <FilterSection title="Search">
        <input
          type="text"
          placeholder="Job title, company, keyword..."
          value={filters.q || ''}
          onChange={e => onFilterChange('q', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort by">
        <select
          value={filters.sort || 'date_scraped'}
          onChange={e => onFilterChange('sort', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Discipline">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onFilterChange('category', '')}
            className={clsx(
              'text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
              !filters.category ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            All disciplines
            {stats && <span className="ml-1 text-xs text-gray-400">({stats.total})</span>}
          </button>
          {CATEGORIES.map(cat => {
            const count = stats?.categories.find(c => c.category === cat)?.count
            return (
              <button
                key={cat}
                onClick={() => onFilterChange('category', filters.category === cat ? '' : cat)}
                className={clsx(
                  'text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between',
                  filters.category === cat ? `${CATEGORY_COLORS[cat]} font-medium` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <span>{cat}</span>
                {count != null && <span className="text-xs opacity-60">{count}</span>}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Salary */}
      <FilterSection title="Salary">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onFilterChange('salary_type', '')}
            className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
              !filters.salary_type ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >All</button>
          {SALARY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterChange('salary_type', filters.salary_type === value ? '' : value)}
              className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                filters.salary_type === value ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >{label}</button>
          ))}
        </div>
      </FilterSection>

      {/* Source type */}
      <FilterSection title="Source">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onFilterChange('source_type', '')}
            className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
              !filters.source_type ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >All sources</button>
          {SOURCE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterChange('source_type', filters.source_type === value ? '' : value)}
              className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                filters.source_type === value ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >{label}</button>
          ))}
        </div>
      </FilterSection>

      {/* Top companies */}
      {stats && stats.companies.length > 0 && (
        <FilterSection title="Companies">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onFilterChange('company', '')}
              className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                !filters.company ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >All companies</button>
            {stats.companies.slice(0, 10).map(({ company, count }) => (
              <button
                key={company}
                onClick={() => onFilterChange('company', filters.company === company ? '' : company)}
                className={clsx('text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between',
                  filters.company === company ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
              >
                <span className="truncate">{company}</span>
                <span className="text-xs opacity-60 ml-1 shrink-0">{count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 font-medium py-1 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          ✕ Clear all filters
        </button>
      )}
    </aside>
  )
}
