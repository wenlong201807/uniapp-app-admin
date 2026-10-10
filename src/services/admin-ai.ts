import { request } from './http'

export interface AdminAiModel {
  id: string
  model: string
  displayName: string
  supportsReasoning: boolean
  enabled: boolean
  isDefault: boolean
}
export interface AdminAiProvider {
  id: string
  kind: 'GPT' | 'GLM'
  name: string
  baseUrl: string
  enabled: boolean
  createdAt: string
  models: AdminAiModel[]
}
export interface AdminAiProviderPage {
  items: AdminAiProvider[]
  total: number
  page: number
  pageSize: number
}

export function getAdminAiProviders(
  token: string,
  query: { page?: number; pageSize?: number } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  return request<AdminAiProviderPage>(`/admin/ai/providers${params.size ? `?${params}` : ''}`, {
    token,
  })
}
export function createAdminAiProvider(
  token: string,
  body: { kind: 'GPT' | 'GLM'; name: string; baseUrl: string; apiKey: string; enabled: boolean },
) {
  return request<{ id: string }>('/admin/ai/providers', { method: 'POST', token, body })
}
export function updateAdminAiProvider(
  token: string,
  id: string,
  body: { name?: string; baseUrl?: string; apiKey?: string; enabled?: boolean },
) {
  return request<{ updated: boolean }>(`/admin/ai/providers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body,
  })
}
export function removeAdminAiProvider(token: string, id: string) {
  return request<{ deleted: boolean }>(`/admin/ai/providers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
export function createAdminAiModel(
  token: string,
  providerId: string,
  body: { model: string; displayName: string; supportsReasoning: boolean; enabled: boolean },
) {
  return request<{ id: string }>(`/admin/ai/providers/${encodeURIComponent(providerId)}/models`, {
    method: 'POST',
    token,
    body,
  })
}
export function updateAdminAiModel(
  token: string,
  id: string,
  body: {
    displayName?: string
    supportsReasoning?: boolean
    enabled?: boolean
    isDefault?: boolean
  },
) {
  return request<{ updated: boolean }>(`/admin/ai/models/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body,
  })
}
export function removeAdminAiModel(token: string, id: string) {
  return request<{ deleted: boolean }>(`/admin/ai/models/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
export interface AdminAiUsageRow {
  provider?: string
  model?: string
  user?: { id: string; email: string; displayName: string }
  promptTokens: number
  completionTokens: number
  calls: number
  failures: number
}
export function getAdminAiUsage(
  token: string,
  query: { from?: string; to?: string; by: 'user' | 'model' },
) {
  const params = new URLSearchParams({ by: query.by })
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  return request<{ by: string; items: AdminAiUsageRow[] }>(`/admin/ai/stats/usage?${params}`, {
    token,
  })
}
export interface AdminAiQuotaRow {
  id: string
  email: string
  displayName: string
  dailyTokenLimit: number | null
  dailyCallLimit: number | null
}
export function getAdminAiQuotas(
  token: string,
  query: { page?: number; pageSize?: number; q?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  return request<{ items: AdminAiQuotaRow[]; total: number; page: number; pageSize: number }>(
    `/admin/ai/quotas${params.size ? `?${params}` : ''}`,
    { token },
  )
}
export function putAdminAiQuota(
  token: string,
  userId: string,
  body: { dailyTokenLimit: number | null; dailyCallLimit: number | null },
) {
  return request<{ saved: boolean }>(`/admin/ai/quotas/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    token,
    body,
  })
}
export function getAdminAiSettings(token: string) {
  return request<{
    overrideTokenLimit: number | null
    overrideCallLimit: number | null
    effectiveTokenLimit: number | null
    effectiveCallLimit: number | null
  }>('/admin/ai/settings', { token })
}
export function putAdminAiSettings(
  token: string,
  body: { dailyTokenLimit: number | null; dailyCallLimit: number | null },
) {
  return request<{ saved: boolean }>('/admin/ai/settings', { method: 'PUT', token, body })
}
export interface AdminAiConversation {
  id: string
  title: string
  modelId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; displayName: string }
}
export function getAdminAiConversations(
  token: string,
  query: { page?: number; pageSize?: number; q?: string; userId?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.userId) params.set('userId', query.userId)
  return request<{ items: AdminAiConversation[]; total: number; page: number; pageSize: number }>(
    `/admin/ai/conversations${params.size ? `?${params}` : ''}`,
    { token },
  )
}
export interface AdminAiMessage {
  id: string
  role: string
  content: string
  reasoning: string | null
  status: string
  model: string | null
  promptTokens: number
  completionTokens: number
  durationMs: number
  createdAt: string
}
export function getAdminAiMessages(token: string, conversationId: string) {
  return request<{
    conversation: { title: string; user: { email: string; displayName: string } }
    messages: AdminAiMessage[]
  }>(`/admin/ai/conversations/${encodeURIComponent(conversationId)}/messages`, { token })
}
