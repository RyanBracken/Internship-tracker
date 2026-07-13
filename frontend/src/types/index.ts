export interface Internship {
  id: string
  title: string
  company: string
  company_logo: string | null
  location: string
  start_date: string | null
  duration: string | null
  salary: string | null
  salary_type: 'paid' | 'unpaid' | 'not_stated'
  description: string | null
  description_short: string | null
  url: string
  source: string
  source_type: 'job_board' | 'direct'
  category: string
  tags: string | null
  date_posted: string | null
  date_scraped: string
  date_expires: string | null
  is_active: number
  app_status?: ApplicationStatus | null
  app_id?: string | null
  app_notes?: string | null
  applied_date?: string | null
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: string
  internship_id: string
  status: ApplicationStatus
  applied_date: string | null
  notes: string | null
  updated_at: string
  // joined from internships
  title: string
  company: string
  company_logo: string | null
  location: string
  salary: string | null
  start_date: string | null
  duration: string | null
  url: string
  source: string
  source_type: 'job_board' | 'direct'
  category: string
  description_short: string | null
  date_posted: string | null
}

export interface Stats {
  total: number
  last_updated: string | null
  categories: { category: string; count: number }[]
  sources: { source: string; count: number }[]
  companies: { company: string; count: number }[]
}

export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface InternshipsResponse {
  data: Internship[]
  pagination: Pagination
}

export interface Filters {
  q: string
  category: string
  company: string
  salary_type: string
  source_type: string
  source: string
  sort: string
  order: string
}
