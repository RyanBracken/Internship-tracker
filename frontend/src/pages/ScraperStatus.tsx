import { useState, useEffect } from 'react'
import { fetchScrapeStatus, triggerScrape } from '../utils/api'
import { formatDate, timeAgo } from '../utils/format'
import clsx from 'clsx'

interface ScrapeLog {
  id: number
  source: string
  started_at: string
  finished_at: string | null
  count_added: number
  count_skipped: number
  status: 'running' | 'success' | 'error'
  error: string | null
}

interface ScrapeStatus {
  running: boolean
  last_result: { success: boolean; at: string; error?: string } | null
  logs: ScrapeLog[]
}

const SOURCES = [
  // ── Dublin job boards ──────────────────────────────────────────
  { name: 'IrishJobs', type: '🇮🇪 Job board', icon: '🇮🇪' },
  { name: 'GradIreland', type: '🇮🇪 Job board', icon: '🎓' },
  { name: 'RecruitIreland', type: '🇮🇪 Job board', icon: '🔍' },
  { name: 'ETRecruite', type: '🇮🇪 Job board', icon: '🔗' },
  { name: 'Indeed', type: '🌍 Job board (Dublin)', icon: '🔎' },
  { name: 'LinkedIn', type: '🌍 Job board (Dublin)', icon: '💼' },
  { name: 'Glassdoor', type: '🌍 Job board (Dublin)', icon: '🚪' },
  // ── UK / London job boards ─────────────────────────────────────
  { name: 'eFinancialCareers', type: '🇬🇧 Finance job board (all cities)', icon: '💹' },
  { name: 'Reed', type: '🇬🇧 Job board (London)', icon: '📋' },
  { name: 'Totaljobs', type: '🇬🇧 Job board (London)', icon: '🗂️' },
  { name: 'CV-Library', type: '🇬🇧 Job board (London)', icon: '📄' },
  { name: 'Targetjobs', type: '🇬🇧 Graduate job board (London)', icon: '🎯' },
  { name: 'Milkround', type: '🇬🇧 Graduate job board (London)', icon: '🥛' },
  { name: 'Prospects', type: '🇬🇧 Graduate job board (London)', icon: '🎓' },
  { name: 'Bright Network', type: '🇬🇧 Graduate network (London)', icon: '✨' },
  { name: 'Monster', type: '🌍 Job board (London, Dublin, Paris, Frankfurt)', icon: '👾' },
  { name: 'Handshake', type: '🌍 Student platform (London, Dublin)', icon: '🤝' },
  { name: 'Welcome to the Jungle', type: '🌍 Job board (all cities)', icon: '🌿' },
  // ── Germany job boards ─────────────────────────────────────────
  { name: 'StepStone', type: '🇩🇪 Job board (Frankfurt)', icon: '🪨' },
  // ── France job boards ──────────────────────────────────────────
  { name: 'French Job Boards', type: '🇫🇷 APEC, HelloWork, Cadremploi (Paris)', icon: '🗼' },
  // ── Switzerland job boards ─────────────────────────────────────
  { name: 'Swiss Job Boards', type: '🇨🇭 jobs.ch, jobup.ch, jobscout24 (Zurich)', icon: '🏔️' },
  // ── Dublin direct scrapers ─────────────────────────────────────
  { name: 'BigFour', type: '🇮🇪 Direct (Deloitte, PwC, KPMG, EY, GT, BDO)', icon: '🏢' },
  { name: 'Banks', type: '🇮🇪 Direct (BOI, AIB, Goldman, JP Morgan, Citi...)', icon: '🏦' },
  { name: 'Consulting', type: '🇮🇪 Direct (Accenture, Capgemini, Stripe...)', icon: '💡' },
  { name: 'Alternatives & Boutiques', type: '🇮🇪 Direct (PE, Private Debt, Advisory — Dublin)', icon: '🏛️' },
  // ── London direct scrapers ─────────────────────────────────────
  { name: 'London', type: '🇬🇧 Direct (Goldman, KKR, Blackstone, McKinsey, 100+ firms)', icon: '🇬🇧' },
  // ── Paris direct scrapers ──────────────────────────────────────
  { name: 'Paris', type: '🇫🇷 Direct (BNP, Lazard, Ardian, McKinsey, 60+ firms)', icon: '🇫🇷' },
  // ── Frankfurt direct scrapers ──────────────────────────────────
  { name: 'Frankfurt', type: '🇩🇪 Direct (Deutsche Bank, KKR, DWS, Roland Berger, 60+ firms)', icon: '🇩🇪' },
  // ── Zurich direct scrapers ─────────────────────────────────────
  { name: 'Zurich', type: '🇨🇭 Direct (UBS, Julius Baer, Partners Group, McKinsey, 60+ firms)', icon: '🇨🇭' },
]

export default function ScraperStatus() {
  const [status, setStatus] = useState<ScrapeStatus | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [message, setMessage] = useState('')

  async function loadStatus() {
    try {
      const data = await fetchScrapeStatus()
      setStatus(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadStatus()
    const iv = setInterval(loadStatus, 5000)
    return () => clearInterval(iv)
  }, [])

  async function handleTrigger() {
    setTriggering(true)
    setMessage('')
    try {
      await triggerScrape()
      setMessage('Scrape started! This may take 10-30 minutes. Status updates every 5 seconds.')
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('409')) {
        setMessage('A scrape is already running.')
      } else {
        setMessage('Failed to trigger scrape. Make sure backend is running.')
      }
    } finally {
      setTriggering(false)
    }
  }

  const sourceStats: Record<string, { added: number; last_run: string | null; status: string }> = {}
  if (status?.logs) {
    for (const log of status.logs) {
      if (!sourceStats[log.source] || log.id > (status.logs.find(l => l.source === log.source)?.id || 0)) {
        sourceStats[log.source] = {
          added: log.count_added,
          last_run: log.finished_at,
          status: log.status,
        }
      }
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scraper Status</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Scrapers run automatically once a day at 07:00 Dublin time across 4 parallel workers. You can also trigger a manual scrape.
        </p>
      </div>

      {/* Control panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx('w-2.5 h-2.5 rounded-full', status?.running ? 'bg-yellow-400 animate-pulse' : 'bg-green-400')} />
              <span className="font-semibold text-gray-900 dark:text-white">
                {status?.running ? 'Scrape in progress...' : 'Idle'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next automatic run: daily at 07:00 Dublin time
            </p>
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering || status?.running}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-medium transition-colors"
          >
            {triggering || status?.running ? (
              <>
                <span className="animate-spin">⟳</span>
                {status?.running ? 'Running...' : 'Starting...'}
              </>
            ) : (
              <>⚡ Run scrape now</>
            )}
          </button>
        </div>
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-sm">
            {message}
          </div>
        )}
      </div>

      {/* Sources table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Data Sources ({SOURCES.length})</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {SOURCES.map(({ name, type, icon }) => {
            const stat = sourceStats[name]
            return (
              <div key={name} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl w-8 text-center">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{type}</div>
                </div>
                {stat ? (
                  <div className="text-right shrink-0">
                    <div className={clsx('text-xs font-medium', stat.status === 'success' ? 'text-green-600 dark:text-green-400' : stat.status === 'error' ? 'text-red-500' : 'text-yellow-500')}>
                      {stat.status === 'success' ? `✓ +${stat.added}` : stat.status === 'error' ? '✗ Error' : '⟳ Running'}
                    </div>
                    {stat.last_run && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(stat.last_run)}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">Never run</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent log */}
      {status?.logs && status.logs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Run Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-5 py-2 font-medium">Started</th>
                  <th className="px-5 py-2 font-medium">Duration</th>
                  <th className="px-5 py-2 font-medium">Added</th>
                  <th className="px-5 py-2 font-medium">Skipped</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {status.logs.slice(0, 30).map(log => {
                  const duration = log.finished_at && log.started_at
                    ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                    : null
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-gray-900 dark:text-white">{log.source}</td>
                      <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{timeAgo(log.started_at)}</td>
                      <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{duration != null ? `${duration}s` : '—'}</td>
                      <td className="px-5 py-2.5 text-green-600 dark:text-green-400 font-medium">+{log.count_added}</td>
                      <td className="px-5 py-2.5 text-gray-400">{log.count_skipped}</td>
                      <td className="px-5 py-2.5">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                          log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : log.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        )}>
                          {log.status}
                        </span>
                        {log.error && <span className="ml-2 text-xs text-red-500 truncate max-w-xs inline-block" title={log.error}>{log.error}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
