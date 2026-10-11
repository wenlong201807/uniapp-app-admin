import { request } from './http'
export interface AdminTaskInvitation {
  id: string
  taskTitle: string
  status: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'REVOKED'
  expiresAt: string
  acceptedAt: string | null
  owner: { id: string; email: string; displayName: string }
}
export function getAdminTaskInvitations(token: string, query: { page: number; q?: string }) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: '20' })
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<{ items: AdminTaskInvitation[]; total: number }>(
    '/admin/task-invitations?' + params,
    { token },
  )
}
export function revokeAdminTaskInvitation(token: string, id: string) {
  return request<{ revoked: boolean }>('/admin/task-invitations/' + encodeURIComponent(id), {
    token,
    method: 'DELETE',
  })
}
