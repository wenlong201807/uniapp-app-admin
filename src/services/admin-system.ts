import { request } from './http'
export interface SystemMenu {
  path: string
  title: string
  name: string
  icon: string
  permission: string
  orderNum: number
  enabled: boolean
  revision: number
}
export interface SystemSetting {
  id: string
  kind: 'DICTIONARY' | 'PARAMETER'
  key: string
  name: string
  value: string
  enabled: boolean
  revision: number
}
export type SettingInput = Omit<SystemSetting, 'id' | 'revision'>
export interface WechatIdentitySummary {
  provider: 'wechat'
  bound: boolean
  createdAt: string
  lastUsedAt: string | null
}
export interface SystemUser {
  wechatIdentity: WechatIdentitySummary | null
  id: string
  email: string
  displayName: string
  createdAt: string
  emailVerifiedAt: string | null
  department: { id: string; name: string } | null
}
export interface Dashboard {
  users: number
  tasks: number
  completedTasks: number
  media: number
  admins: number
  roles: number
  departments: number
  positions: number
  checkedAt: string
}
export const getSystemMenus = (token: string) =>
  request<{ items: SystemMenu[] }>('/admin/system/menus', { token })
export const updateSystemMenu = (
  token: string,
  body: {
    path: string
    title: string
    orderNum: number
    enabled: boolean
    expectedRevision: number
  },
) => request<SystemMenu>('/admin/system/menus', { method: 'PATCH', token, body })
export const getSystemSettings = (token: string, kind: SystemSetting['kind'], q = '') =>
  request<{ items: SystemSetting[]; total: number }>(
    `/admin/system/settings?kind=${kind}&q=${encodeURIComponent(q)}`,
    { token },
  )
export const createSystemSetting = (token: string, body: SettingInput) =>
  request<SystemSetting>('/admin/system/settings', { method: 'POST', token, body })
export const updateSystemSetting = (
  token: string,
  id: string,
  body: SettingInput & { expectedRevision: number },
) => request<SystemSetting>(`/admin/system/settings/${id}`, { method: 'PATCH', token, body })
export const deleteSystemSetting = (token: string, id: string, expectedRevision: number) =>
  request<{ deleted: boolean }>(`/admin/system/settings/${id}`, {
    method: 'DELETE',
    token,
    body: { expectedRevision },
  })
export const getSystemUsers = (
  token: string,
  query: { q?: string; departmentId?: string; page?: number },
) => {
  const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: '20' })
  if (query.q) params.set('q', query.q)
  if (query.departmentId) params.set('departmentId', query.departmentId)
  return request<{ items: SystemUser[]; total: number }>(`/admin/system/users?${params}`, { token })
}
export const updateSystemUser = (
  token: string,
  id: string,
  body: { departmentId?: string | null; revokeSessions?: boolean },
) => request<SystemUser>(`/admin/system/users/${id}`, { method: 'PATCH', token, body })
export const getDashboard = (token: string) =>
  request<Dashboard>('/admin/system/dashboard', { token })

export interface WechatStatus {
  wechat: { configured: boolean }
  wecom: { configured: boolean; customerMoments: boolean }
  origins: { wechat: string[]; wecom: string[] }
  checkedAt: string
}
export const getWechatStatus = (token: string) =>
  request<WechatStatus>('/admin/wechat/status', { token })
