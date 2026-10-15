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
    `/admin/rbac/roles${q ? `?q=${encodeURIComponent(q)}` : ''}`,
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
    `/admin/rbac/admins${q ? `?q=${encodeURIComponent(q)}` : ''}`,
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
