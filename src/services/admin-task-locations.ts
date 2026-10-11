import { request } from './http'
export interface AdminTaskLocation {
  id: string
  taskId: string
  taskTitle: string
  label: string
  grid: string
  precision: string
  createdAt: string
  updatedAt: string
  owner: { id: string; email: string; displayName: string }
}
export function getAdminTaskLocations(
  token: string,
  query: { page: number; pageSize: number; q?: string },
) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<{ items: AdminTaskLocation[]; total: number; page: number; pageSize: number }>(
    '/admin/task-locations?' + params,
    { token },
  )
}
export function deleteAdminTaskLocation(token: string, id: string) {
  return request<{ deleted: boolean }>('/admin/task-locations/' + encodeURIComponent(id), {
    token,
    method: 'DELETE',
  })
}
