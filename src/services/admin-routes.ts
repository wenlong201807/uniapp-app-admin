import { isRecord, request } from './http'

export type AdminRouteIcon =
  | 'dashboard'
  | 'connection'
  | 'shield'
  | 'media'
  | 'audit'
  | 'bell'
  | 'ai'
  | 'settings'

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
    path: '/system/menus',
    name: 'system-menus',
    title: '菜单管理',
    icon: 'settings',
    permission: 'admin:system:menus',
  },
  {
    path: '/system/settings',
    name: 'system-settings',
    title: '字典与参数',
    icon: 'settings',
    permission: 'admin:system:settings',
  },
  {
    path: '/system/users',
    name: 'system-users',
    title: '用户管理',
    icon: 'settings',
    permission: 'admin:system:users',
  },
  {
    path: '/organization/departments',
    name: 'departments',
    title: '部门管理',
    icon: 'settings',
    permission: 'admin:organization:departments',
  },
  {
    path: '/organization/positions',
    name: 'positions',
    title: '岗位管理',
    icon: 'settings',
    permission: 'admin:organization:positions',
  },
  {
    path: '/administrators',
    name: 'administrators',
    title: '管理员账号',
    icon: 'settings',
    permission: 'admin:rbac:admins',
  },
  {
    path: '/integrity-reports',
    name: 'integrity-reports',
    title: '设备风险',
    icon: 'shield',
    permission: 'admin:security:integrity',
  },
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
  {
    path: '/rbac',
    name: 'rbac',
    title: '角色与权限',
    icon: 'settings',
    permission: 'admin:rbac:roles',
  },
  {
    path: '/device-keys',
    name: 'device-keys',
    title: '设备密钥',
    icon: 'shield',
    permission: 'admin:security:device-keys',
  },
  {
    path: '/media',
    name: 'media',
    title: '媒体管理',
    icon: 'media',
    permission: 'admin:content:media',
  },
  {
    path: '/sessions',
    name: 'sessions',
    title: '设备会话',
    icon: 'shield',
    permission: 'admin:security:sessions',
  },
  {
    path: '/security-events',
    name: 'security-events',
    title: '安全审计',
    icon: 'audit',
    permission: 'admin:security:audit',
  },
  {
    path: '/push-devices',
    name: 'push-devices',
    title: '推送设备',
    icon: 'bell',
    permission: 'admin:notifications:devices',
  },
  {
    path: '/media-shares',
    name: 'media-shares',
    title: '媒体分享',
    icon: 'media',
    permission: 'admin:content:shares',
  },
  {
    path: '/task-locations',
    name: 'task-locations',
    title: '位置隐私',
    icon: 'shield',
    permission: 'admin:privacy:locations',
  },
  {
    path: '/bluetooth-bindings',
    name: 'bluetooth-bindings',
    title: '蓝牙关联',
    icon: 'connection',
    permission: 'admin:hardware:bluetooth',
  },
  {
    path: '/nfc-tags',
    name: 'nfc-tags',
    title: 'NFC 标签',
    icon: 'connection',
    permission: 'admin:hardware:nfc',
  },
  {
    path: '/task-invitations',
    name: 'task-invitations',
    title: '任务邀请',
    icon: 'connection',
    permission: 'admin:tasks:invitations',
  },
  {
    path: '/ai-config',
    name: 'ai-config',
    title: 'AI 模型',
    icon: 'ai',
    permission: 'admin:ai:config',
  },
  {
    path: '/ai-usage',
    name: 'ai-usage',
    title: 'AI 用量',
    icon: 'ai',
    permission: 'admin:ai:usage',
  },
  {
    path: '/ai-quotas',
    name: 'ai-quotas',
    title: 'AI 额度',
    icon: 'ai',
    permission: 'admin:ai:quota',
  },
  {
    path: '/ai-sessions',
    name: 'ai-sessions',
    title: 'AI 会话',
    icon: 'ai',
    permission: 'admin:ai:sessions',
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
