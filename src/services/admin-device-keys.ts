import { request } from './http'

export interface AdminDeviceKeyUser {
  id: string
  email: string
  displayName: string
}
export interface AdminDeviceKey {
  id: string
  name: string
  audience: string
  createdAt: string
  lastUsedAt: string | null
  user: AdminDeviceKeyUser
}
export interface AdminDeviceKeyPage {
  items: AdminDeviceKey[]
  total: number
  page: number
  pageSize: number
}

export function getAdminDeviceKeys(
  token: string,
  query: { page?: number; pageSize?: number; q?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<AdminDeviceKeyPage>(`/admin/device-keys${params.size ? `?${params}` : ''}`, {
    token,
  })
}

export function revokeAdminDeviceKey(token: string, id: string) {
  return request<{ revoked: boolean }>(`/admin/device-keys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
