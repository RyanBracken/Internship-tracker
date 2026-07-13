import { useState } from 'react'
import clsx from 'clsx'
import type { Internship, ApplicationStatus } from '../../types'
import { timeAgo, CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../utils/format'
import { upsertApplication, deleteApplication } from '../../utils/api'

interface InternshipCardProps {
  internship: Internship
  onStatusChange?: (id: string, status: ApplicationStatus | null) => void
  onClick?: () => void
}

const STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected']

export default function InternshipCard({ internship: i, onStatusChange, onClick }: InternshipCardProps) {
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(
    (i.app_status as ApplicationStatus) || null
  )
  const [appId, setAppId] = useState<string | null>(i.app_id || null)
  const [saving, setSaving] = useState(false)

  async function handleStatusChange(status: ApplicationStatus | null) {
    setSaving(true)
    try {
      if (status === null && appId) {
        await deleteApplication(appId)
        setAppId(null)
        setAppStatus(null)
        onStatusChange?.(i.id, null)
      } else if (status) {
        const result = appId
          ? await upsertApplication(i.id, status)
          : await upsertApplication(i.id, status)
        if (result.id) setAppId(result.id)
        setAppStatus(status)
        onStatusChange?.(i.id, status)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const categoryColor = CATEGORY_COLORS[i.category] || 'bg-gray-100 text-gray-700'

  return (
    <article
      className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-lg font-bold text-gray-600 dark:text-gray-300 shrink-0 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {i.company_logo ? (
              <img
                src={i.company_logo}
                alt={i.company}
                className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              i.company.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                  {i.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{i.company}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                {i.source_type === 'direct' && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    Direct
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>📍</span>
            <span>{i.location}</span>
          </span>
          {i.start_date && (
            <span className="flex items-center gap-1">
              <span>📅</span>
              <span>{i.start_date}</span>
            </span>
          )}
          {i.duration && (
            <span className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{i.duration}</span>
            </span>
          )}
          {i.salary && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <span>💶</span>
              <span>{i.salary}</span>
            </span>
          )}
          {i.salary_type === 'unpaid' && (
            <span className="text-orange-500 dark:text-orange-400">Unpaid</span>
          )}
        </div>

        {/* Description */}
        {i.description_short && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {i.description_short}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', categoryColor)}>
              {i.category}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              via {i.source} · {timeAgo(i.date_posted || i.date_scraped)}
            </span>
          </div>

          {/* Status toggle */}
          <div onClick={e => e.stopPropagation()} className="shrink-0">
            {appStatus ? (
              <div className="flex items-center gap-1">
                <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[appStatus])}>
                  {STATUS_LABELS[appStatus]}
                </span>
                <button
                  onClick={() => handleStatusChange(null)}
                  disabled={saving}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => handleStatusChange('saved')}
                disabled={saving}
                className="text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 font-medium transition-colors border border-brand-200 dark:border-brand-800"
              >
                {saving ? '...' : '+ Track'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
