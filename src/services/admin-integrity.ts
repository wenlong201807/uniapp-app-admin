import { request } from './http'
export interface IntegrityReport {
  id: string
  platform: string
  rootSignal: string
  debugSignal: string
  emulatorSignal: string
  verification: 'UNVERIFIED'
  evidence: 'CLIENT_REPORTED'
  freshness: 'RECENT' | 'STALE'
  review: 'PENDING' | 'ACKNOWLEDGED' | 'FOLLOW_UP'
  createdAt: string
  reviewedAt: string | null
  expiresAt: string
  owner: { id: string; email: string; displayName: string }
}
export interface IntegrityCapabilities {
  policy: string
  providers: { platform: string; provider: string; configured: boolean; status: string }[]
  retentionDays: number
  maxReportsPerUser: number
}
export function listIntegrityReports(
  token: string,
  query: { page: number; q?: string; review?: string },
) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: '20' })
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.review) params.set('review', query.review)
  return request<{ items: IntegrityReport[]; total: number }>(
    '/admin/integrity/reports?' + params,
    { token },
  )
}
export function integrityCapabilities(token: string) {
  return request<IntegrityCapabilities>('/admin/integrity/capabilities', { token })
}
export function reviewIntegrityReport(
  token: string,
  id: string,
  review: 'ACKNOWLEDGED' | 'FOLLOW_UP',
) {
  return request<IntegrityReport>(
    '/admin/integrity/reports/' + encodeURIComponent(id) + '/review',
    { token, method: 'POST', body: { review } },
  )
}
export function deleteIntegrityReport(token: string, id: string) {
  return request<{ deleted: boolean }>('/admin/integrity/reports/' + encodeURIComponent(id), {
    token,
    method: 'DELETE',
  })
}
