import { useState, useEffect, useCallback } from 'react'
import { fetchInternships } from '../utils/api'
import type { Internship, Pagination, Filters } from '../types'

export function useInternships(filters: Partial<Filters>) {
  const [internships, setInternships] = useState<Internship[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchInternships(filters, p)
      setInternships(result.data)
      setPagination(result.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load internships')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)]) // eslint-disable-line

  useEffect(() => {
    setPage(1)
    load(1)
  }, [JSON.stringify(filters)]) // eslint-disable-line

  const goToPage = useCallback((p: number) => {
    setPage(p)
    load(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [load])

  return { internships, pagination, loading, error, page, goToPage }
}
