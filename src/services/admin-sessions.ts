import { request } from './http'

export interface AdminSession {
  id: string
  createdAt: string | null
  lastSeenAt: string | null
  platform: string
  ipAddress: string | null
  expiresIn: number
}
export interface AdminSessionUser {
  id: string
  email: string
  displayName: string
}
export interface AdminSessionGroup {
  user: AdminSessionUser
  sessions: AdminSession[]
}
export interface AdminSessionPage {
  items: AdminSessionGroup[]
  total: number
  page: number
  pageSize: number
}
export function getAdminSessions(
  token: string,
  query: { page?: number; pageSize?: number; q?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<AdminSessionPage>(`/admin/sessions${params.size ? `?${params}` : ''}`, { token })
}
export function revokeAdminSession(token: string, userId: string, sessionId: string) {
  return request<{ revoked: boolean }>(
    `/admin/sessions/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE', token },
  )
}
