import { isRecord, request } from './http'

export type AdminRouteIcon = 'dashboard' | 'connection' | 'shield'

export interface AdminRouteRecord {
  path: string
  name: string
  title: string
  icon: AdminRouteIcon
  permission: string
  children?: AdminRouteRecord[]
}

export const staticAdminRoutes: AdminRouteRecord[] = [
  {
    path: '/overview',
    name: 'overview',
    title: '工作台',
    icon: 'dashboard',
    permission: 'admin:dashboard:view',
  },
  {
    path: '/system',
    name: 'system',
    title: '服务连接',
    icon: 'connection',
    permission: 'admin:system:health',
  },
]

export function getAdminRoutes(token: string) {
  return request<unknown>('/admin/routes', { token })
}

export function safeAdminRedirect(value: unknown): string {
  return staticAdminRoutes.some((route) => route.path === value) ? String(value) : '/overview'
}

export function normalizeAdminRoutes(value: unknown): AdminRouteRecord[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const routes: AdminRouteRecord[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const known = staticAdminRoutes.find(
      (route) =>
        route.path === item.path &&
        route.name === item.name &&
        route.permission === item.permission &&
        route.icon === item.icon,
    )
    if (
      !known ||
      seen.has(known.path) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      item.title.length > 40 ||
      (item.children !== undefined && (!Array.isArray(item.children) || item.children.length > 0))
    )
      continue
    seen.add(known.path)
    routes.push({ ...known, title: item.title.trim() })
  }
  return routes
}
