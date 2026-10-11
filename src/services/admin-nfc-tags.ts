import { request } from './http'
export interface AdminNfcTag {
  id: string
  label: string
  taskTitle: string
  version: number
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  owner: { id: string; email: string; displayName: string }
}
export function getAdminNfcTags(token: string, query: { page: number; q?: string }) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: '20' })
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<{ items: AdminNfcTag[]; total: number }>('/admin/nfc-tags?' + params, { token })
}
export function revokeAdminNfcTag(token: string, id: string) {
  return request<{ revoked: boolean }>('/admin/nfc-tags/' + encodeURIComponent(id), {
    token,
    method: 'DELETE',
  })
}
