import { request } from './http'
export type PushPlatform = 'IOS' | 'ANDROID' | 'HARMONY' | 'WEB'
export interface AdminPushDevice {
  id: string
  platform: PushPlatform
  deviceId: string
  tokenMasked: string
  appVersion: string | null
  timezone: string | null
  status: string
  lastSeenAt: string
  createdAt: string
  user: { id: string; email: string; displayName: string }
}
export interface AdminPushDevicePage {
  items: AdminPushDevice[]
  total: number
  page: number
  pageSize: number
}
export function getAdminPushDevices(
  token: string,
  query: { page?: number; pageSize?: number; q?: string; platform?: PushPlatform } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.platform) params.set('platform', query.platform)
  return request<AdminPushDevicePage>(`/admin/push-devices${params.size ? `?${params}` : ''}`, {
    token,
  })
}
export function revokeAdminPushDevice(token: string, id: string) {
  return request<{ revoked: boolean }>(`/admin/push-devices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
