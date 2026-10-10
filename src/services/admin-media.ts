import { request } from './http'

export type MediaKind = 'IMAGE' | 'VIDEO'
export type MediaStatus = 'READY' | 'DELETING'

export interface AdminMediaOwner {
  id: string
  email: string
  displayName: string
}
export interface AdminMedia {
  id: string
  originalName: string
  kind: MediaKind
  status: MediaStatus
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  durationSeconds: number | null
  createdAt: string
  owner: AdminMediaOwner
}
export interface AdminMediaPage {
  items: AdminMedia[]
  total: number
  page: number
  pageSize: number
}

export function getAdminMedia(
  token: string,
  query: {
    page?: number
    pageSize?: number
    q?: string
    kind?: MediaKind
    status?: MediaStatus
  } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.kind) params.set('kind', query.kind)
  if (query.status) params.set('status', query.status)
  return request<AdminMediaPage>(`/admin/media${params.size ? `?${params}` : ''}`, { token })
}

export function removeAdminMedia(token: string, id: string) {
  return request<{ id: string }>(`/admin/media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
