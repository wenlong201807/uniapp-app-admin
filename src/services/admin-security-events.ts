import { request } from './http'
export interface SecurityEvent {
  id: string
  userId: string | null
  adminId: string | null
  sessionId: string | null
  action: string
  result: 'SUCCESS' | 'FAILURE'
  requestId: string
  ipAddress: string | null
  platform: string
  details: string | null
  createdAt: string
}
export interface SecurityEventPage {
  items: SecurityEvent[]
  total: number
  page: number
  pageSize: number
}
export function getSecurityEvents(
  token: string,
  query: {
    page?: number
    pageSize?: number
    action?: string
    userId?: string
    result?: 'SUCCESS' | 'FAILURE'
  } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.action?.trim()) params.set('action', query.action.trim())
  if (query.userId?.trim()) params.set('userId', query.userId.trim())
  if (query.result) params.set('result', query.result)
  return request<SecurityEventPage>(`/admin/security-events${params.size ? `?${params}` : ''}`, {
    token,
  })
}
