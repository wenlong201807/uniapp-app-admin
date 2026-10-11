import { request } from './http'
export interface AdminBluetoothBinding {
  id: string
  platform: string
  name: string
  status: 'ACTIVE' | 'REVOKED'
  reportedState: 'UNKNOWN' | 'CONNECTED' | 'DISCONNECTED'
  identityVerified: false
  lastReportedAt: string | null
  revokedAt: string | null
  createdAt: string
  owner: { id: string; email: string; displayName: string }
}
export function getAdminBluetoothBindings(
  token: string,
  query: { page: number; pageSize: number; q?: string; status?: string },
) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.status) params.set('status', query.status)
  return request<{ items: AdminBluetoothBinding[]; total: number; page: number; pageSize: number }>(
    '/admin/bluetooth-bindings?' + params,
    { token },
  )
}
export function revokeAdminBluetoothBinding(token: string, id: string) {
  return request<{ revoked: boolean }>('/admin/bluetooth-bindings/' + encodeURIComponent(id), {
    token,
    method: 'DELETE',
  })
}
