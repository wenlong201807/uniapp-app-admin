import { request } from './http'

export type DataScope =
  | 'ALL'
  | 'DEPARTMENT'
  | 'DEPARTMENT_AND_CHILDREN'
  | 'SELF'
  | 'CUSTOM_DEPARTMENTS'
export interface AdminRole {
  dataScope: DataScope
  departmentIds: string[]
  id: string
  code: string
  name: string
  description: string
  permissions: string[]
  enabled: boolean
  isSystem: boolean
}
export interface AdminMember {
  id: string
  email: string
  displayName: string
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  department: { id: string; name: string } | null
  positions: Array<{ id: string; code: string; name: string }>
  role: { id: string; code: string; name: string } | null
}
export const getAdminRoles = (token: string, q = '') =>
  request<{ items: AdminRole[]; total: number }>(
    // pageSize=500 keeps the roles table and every role dropdown rendering the
    // full list; the server endpoint is genuinely paginated when data grows.
    `/admin/rbac/roles?q=${encodeURIComponent(q)}&page=1&pageSize=500`,
    { token },
  )
export const getAdminPermissions = (token: string) =>
  request<Array<{ code: string; name: string }>>('/admin/rbac/permissions', { token })
export const createAdminRole = (
  token: string,
  body: {
    code: string
    name: string
    description?: string
    permissions: string[]
    dataScope?: DataScope
    departmentIds?: string[]
  },
) => request<AdminRole>('/admin/rbac/roles', { method: 'POST', token, body })
export const updateAdminRole = (
  token: string,
  id: string,
  body: Partial<{
    name: string
    description: string
    permissions: string[]
    enabled: boolean
    dataScope: DataScope
    departmentIds: string[]
  }>,
) => request<AdminRole>(`/admin/rbac/roles/${id}`, { method: 'PATCH', token, body })
export const getAdminMembers = (token: string, q = '') =>
  request<{ items: AdminMember[]; total: number }>(
    // Same show-all semantics as roles until the administrators table grows a
    // pagination UI.
    `/admin/rbac/admins?q=${encodeURIComponent(q)}&page=1&pageSize=500`,
    { token },
  )
export const updateAdminMember = (
  token: string,
  id: string,
  body: {
    roleId?: string | null
    departmentId?: string | null
    positionIds?: string[]
    status?: 'ACTIVE' | 'DISABLED'
  },
) => request<AdminMember>(`/admin/rbac/admins/${id}`, { method: 'PATCH', token, body })

export const deleteAdminRole = (token: string, id: string) =>
  request<{ deleted: boolean }>(`/admin/rbac/roles/${id}`, { method: 'DELETE', token })

export const createAdminMember = (
  token: string,
  body: {
    email: string
    displayName: string
    password: string
    roleId?: string | null
    departmentId?: string | null
    positionIds?: string[]
    status?: 'ACTIVE' | 'DISABLED'
  },
) => request<AdminMember>('/admin/rbac/admins', { method: 'POST', token, body })
