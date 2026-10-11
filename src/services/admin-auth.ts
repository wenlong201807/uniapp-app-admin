import { request } from './http'

export interface AdminAccount {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export interface AdminAuthResult {
  admin: AdminAccount
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  refreshExpiresIn: number
}

export interface AdminLoginInput {
  email: string
  password: string
}

export interface AdminBootstrapInput extends AdminLoginInput {
  displayName: string
  bootstrapToken: string
}

export function loginAdmin(input: AdminLoginInput) {
  return request<AdminAuthResult>('/admin/auth/login', { method: 'POST', body: input })
}

export function bootstrapAdmin(input: AdminBootstrapInput) {
  return request<AdminAuthResult>('/admin/auth/bootstrap', { method: 'POST', body: input })
}

export function refreshAdmin(refreshToken: string) {
  return request<AdminAuthResult>('/admin/auth/refresh', { method: 'POST', body: { refreshToken } })
}

export function getAdminMe(token: string) {
  return request<AdminAccount>('/admin/auth/me', { token })
}

export function logoutAdmin(token: string) {
  return request<{ loggedOut: boolean }>('/admin/auth/logout', { method: 'POST', token })
}
