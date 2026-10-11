import { request } from './http'
export interface AdminMediaShare {
  id: string
  mediaId: string
  ownerId: string
  originalName: string
  status: string
  expiresAt: string
  maxUses: number
  usedCount: number
  lastUsedAt: string | null
  createdAt: string
}
export interface AdminMediaSharePage {
  items: AdminMediaShare[]
  total: number
  page: number
  pageSize: number
}
export function getAdminMediaShares(
  token: string,
  query: { page?: number; pageSize?: number; q?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<AdminMediaSharePage>(`/admin/media-shares${params.size ? `?${params}` : ''}`, {
    token,
  })
}
export function revokeAdminMediaShare(token: string, id: string) {
  return request<{ revoked: boolean }>(`/admin/media-shares/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
