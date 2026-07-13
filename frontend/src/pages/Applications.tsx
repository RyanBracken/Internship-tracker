import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import type { Application, ApplicationStatus } from '../types'
import { fetchApplications, updateApplication, deleteApplication } from '../utils/api'
import { formatDate, timeAgo, CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../utils/format'
import InternshipDetail from '../components/cards/InternshipDetail'
import type { Internship } from '../types'

const STATUSES: (ApplicationStatus | 'all')[] = ['all', 'saved', 'applied', 'interview', 'offer', 'rejected']

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus | 'all'>('all')
  const [selected, setSelected] = useState<Internship | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApplications()
      setApplications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(app: Application, status: ApplicationStatus) {
    await updateApplication(app.id, status, app.notes || undefined, app.applied_date || undefined)
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a))
  }

  async function handleDelete(appId: string) {
    await deleteApplication(appId)
    setApplications(prev => prev.filter(a => a.id !== appId))
  }

  async function saveNotes(app: Application) {
    await updateApplication(app.id, app.status, noteText, app.applied_date || undefined)
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, notes: noteText } : a))
    setEditingNotes(null)
  }

  const filtered = activeStatus === 'all' ? applications : applications.filter(a => a.status === activeStatus)

  const counts: Record<string, number> = {}
  for (const app of applications) {
    counts[app.status] = (counts[app.status] || 0) + 1
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{applications.length} tracked internship{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {(['saved', 'applied', 'interview', 'offer', 'rejected'] as ApplicationStatus[]).map(s => (
          <div key={s} className={clsx('rounded-xl p-4 border', STATUS_COLORS[s], 'border-transparent')}>
            <div className="text-2xl font-bold">{counts[s] || 0}</div>
            <div className="text-xs mt-0.5 opacity-75">{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeStatus === s
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
            {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No applications yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Browse internships and click "+ Track" to start tracking.</p>
        </div>
      )}

      {/* Application cards */}
      <div className="space-y-3">
        {filtered.map(app => (
          <div
            key={app.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-start gap-3">
              {/* Logo */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0 overflow-hidden">
                {app.company_logo
                  ? <img src={app.company_logo} alt={app.company} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : app.company.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      onClick={() => setSelected({ ...app, id: app.internship_id, date_scraped: '', is_active: 1, tags: null, salary_type: 'not_stated', description: null, date_expires: null, app_status: app.status, app_id: app.id, app_notes: app.notes })}
                      className="font-semibold text-gray-900 dark:text-white hover:text-brand-700 dark:hover:text-brand-300 transition-colors text-left"
                    >
                      {app.title}
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{app.company} · {app.location}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[app.status])}>
                      {STATUS_LABELS[app.status]}
                    </span>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors text-sm"
                      title="Remove"
                    >✕</button>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className={clsx('px-2 py-0.5 rounded-full', CATEGORY_COLORS[app.category] || 'bg-gray-100 text-gray-600')}>{app.category}</span>
                  {app.applied_date && <span>Applied {formatDate(app.applied_date)}</span>}
                  {app.start_date && <span>Starts {app.start_date}</span>}
                  {app.salary && <span className="text-green-600 dark:text-green-400">{app.salary}</span>}
                  <span>via {app.source}</span>
                </div>

                {/* Status changer */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(['saved', 'applied', 'interview', 'offer', 'rejected'] as ApplicationStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(app, s)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full transition-colors',
                        app.status === s
                          ? STATUS_COLORS[s] + ' font-medium'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >{STATUS_LABELS[s]}</button>
                  ))}
                </div>

                {/* Notes */}
                {editingNotes === app.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={2}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveNotes(app)} className="text-xs px-3 py-1 bg-brand-600 text-white rounded-lg">Save</button>
                      <button onClick={() => setEditingNotes(null)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    {app.notes ? (
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400 italic cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={() => { setEditingNotes(app.id); setNoteText(app.notes || '') }}
                      >
                        📝 {app.notes}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(app.id); setNoteText('') }}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >+ Add notes</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <InternshipDetail
          internship={selected}
          onClose={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}
