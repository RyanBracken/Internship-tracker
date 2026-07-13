import axios from 'axios'
import type { InternshipsResponse, Stats, Application, ApplicationStatus, Filters } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

export async function fetchInternships(filters: Partial<Filters>, page = 1, limit = 20): Promise<InternshipsResponse> {
  const params: Record<string, string | number> = { page, limit }
  Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
  const { data } = await api.get('/internships', { params })
  return data
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get('/internships/stats')
  return data
}

export async function fetchInternship(id: string) {
  const { data } = await api.get(`/internships/${id}`)
  return data
}

export async function fetchApplications(status?: ApplicationStatus): Promise<Application[]> {
  const { data } = await api.get('/applications', { params: status ? { status } : {} })
  return data
}

export async function upsertApplication(internship_id: string, status: ApplicationStatus, notes?: string, applied_date?: string) {
  const { data } = await api.post('/applications', { internship_id, status, notes, applied_date })
  return data
}

export async function updateApplication(id: string, status: ApplicationStatus, notes?: string, applied_date?: string) {
  const { data } = await api.put(`/applications/${id}`, { status, notes, applied_date })
  return data
}

export async function deleteApplication(id: string) {
  const { data } = await api.delete(`/applications/${id}`)
  return data
}

export async function triggerScrape() {
  const { data } = await api.post('/scrape/trigger')
  return data
}

export async function fetchScrapeStatus() {
  const { data } = await api.get('/scrape/status')
  return data
}
