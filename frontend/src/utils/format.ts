import { formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Finance': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Accounting': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Tax': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Audit': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'Banking & Investment': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Economics': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Business & Strategy': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Consulting': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
}

export const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  interview: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}
