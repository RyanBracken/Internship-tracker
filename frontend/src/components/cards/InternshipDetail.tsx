import { useState, useEffect } from 'react'
import clsx from 'clsx'
import type { Internship, ApplicationStatus } from '../../types'
import { formatDate, timeAgo, CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../utils/format'
import { upsertApplication, updateApplication, deleteApplication } from '../../utils/api'

interface InternshipDetailProps {
  internship: Internship
  onClose: () => void
}

const STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected']

export default function InternshipDetail({ internship: i, onClose }: InternshipDetailProps) {
  const [status, setStatus] = useState<ApplicationStatus | null>((i.app_status as ApplicationStatus) || null)
  const [appId, setAppId] = useState<string | null>(i.app_id || null)
  const [notes, setNotes] = useState(i.app_notes || '')
  const [appliedDate, setAppliedDate] = useState(i.applied_date || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function saveApplication(newStatus: ApplicationStatus) {
    setSaving(true)
    try {
      const result = await upsertApplication(i.id, newStatus, notes, appliedDate || undefined)
      if (result.id) setAppId(result.id)
      setStatus(newStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function saveNotes() {
    if (!appId && !status) return
    setSaving(true)
    try {
      if (appId) {
        await updateApplication(appId, status || 'saved', notes, appliedDate || undefined)
      } else {
        const result = await upsertApplication(i.id, 'saved', notes, appliedDate || undefined)
        if (result.id) setAppId(result.id)
        setStatus('saved')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function removeTracking() {
    if (!appId) return
    await deleteApplication(appId)
    setAppId(null)
    setStatus(null)
    setNotes('')
    setAppliedDate('')
  }

  const categoryColor = CATEGORY_COLORS[i.category] || 'bg-gray-100 text-gray-700'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-lg font-bold text-gray-600 dark:text-gray-300 shrink-0 overflow-hidden">
            {i.company_logo ? (
              <img src={i.company_logo} alt={i.company} className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : i.company.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{i.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">{i.company}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none p-1 shrink-0">✕</button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', categoryColor)}>{i.category}</span>
            {i.source_type === 'direct' && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">Direct</span>
            )}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">via {i.source}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📍', label: 'Location', value: i.location },
              { icon: '📅', label: 'Start date', value: i.start_date || 'Not specified' },
              { icon: '⏱️', label: 'Duration', value: i.duration || 'Not specified' },
              { icon: '💶', label: 'Salary', value: i.salary || (i.salary_type === 'unpaid' ? 'Unpaid' : 'Not stated') },
              { icon: '🗓️', label: 'Posted', value: formatDate(i.date_posted) },
              { icon: '🔄', label: 'Scraped', value: timeAgo(i.date_scraped) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                  <span>{icon}</span><span>{label}</span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {i.description && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <div
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: i.description.replace(/<[^>]+>/g, '') }}
              />
            </div>
          )}

          {/* Application tracker */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Track Application</h3>

            {/* Status buttons */}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => saveApplication(s)}
                  className={clsx(
                    'text-sm px-3 py-1.5 rounded-full font-medium transition-colors',
                    status === s ? STATUS_COLORS[s] : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
              {status && (
                <button onClick={removeTracking} className="text-sm px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Remove
                </button>
              )}
            </div>

            {/* Applied date */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Applied date</label>
              <input
                type="date"
                value={appliedDate}
                onChange={e => setAppliedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Notes (contacts, interview details, etc.)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <button
              onClick={saveNotes}
              disabled={saving}
              className="text-sm px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save notes'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <a
            href={i.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
          >
            Apply on {i.source_type === 'direct' ? i.company : i.source}
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
