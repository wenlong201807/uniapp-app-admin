import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminLoginView from '@/views/AdminLoginView.vue'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { staticAdminRoutes } from '@/services/admin-routes'
import { useAdminRoutesStore } from '@/stores/admin-routes'
import { ApiError } from '@/services/http'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { title: '管理员登录' },
    },
    {
      path: '/session-error',
      name: 'session-error',
      component: () => import('@/views/SessionErrorView.vue'),
      meta: { title: '连接异常' },
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/overview' },
        {
          path: 'forbidden',
          name: 'forbidden',
          component: () => import('@/views/ForbiddenView.vue'),
          meta: { title: '无访问权限' },
        },
        {
          path: 'overview',
          name: 'overview',
          component: () => import('@/views/OverviewView.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'system',
          name: 'system',
          component: () => import('@/views/SystemView.vue'),
          meta: { title: '服务连接' },
        },
        {
          path: 'device-keys',
          name: 'device-keys',
          component: () => import('@/views/DeviceKeysView.vue'),
          meta: { title: '设备密钥' },
        },
        {
          path: 'media',
          name: 'media',
          component: () => import('@/views/MediaView.vue'),
          meta: { title: '媒体管理' },
        },
        {
          path: 'sessions',
          name: 'sessions',
          component: () => import('@/views/SessionsView.vue'),
          meta: { title: '设备会话' },
        },
        {
          path: 'security-events',
          name: 'security-events',
          component: () => import('@/views/SecurityEventsView.vue'),
          meta: { title: '安全审计' },
        },
        {
          path: 'push-devices',
          name: 'push-devices',
          component: () => import('@/views/PushDevicesView.vue'),
          meta: { title: '推送设备' },
        },
        {
          path: 'media-shares',
          name: 'media-shares',
          component: () => import('@/views/MediaSharesView.vue'),
          meta: { title: '媒体分享' },
        },
        {
          path: 'ai-config',
          name: 'ai-config',
          component: () => import('@/views/AIConfigView.vue'),
          meta: { title: 'AI 模型' },
        },
        {
          path: 'ai-usage',
          name: 'ai-usage',
          component: () => import('@/views/AIUsageView.vue'),
          meta: { title: 'AI 用量' },
        },
        {
          path: 'ai-quotas',
          name: 'ai-quotas',
          component: () => import('@/views/AIQuotasView.vue'),
          meta: { title: 'AI 额度' },
        },
        {
          path: 'ai-sessions',
          name: 'ai-sessions',
          component: () => import('@/views/AISessionsView.vue'),
          meta: { title: 'AI 会话' },
        },
        {
          path: ':pathMatch(.*)*',
          component: () => import('@/views/NotFoundView.vue'),
          meta: { title: '页面未找到' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAdminAuthStore()
  const navigation = useAdminRoutesStore()
  if (to.name === 'session-error') return auth.isAuthenticated ? true : '/login'
  if (to.name === 'admin-login') {
    if (!auth.isAuthenticated) navigation.reset()
    if (auth.isAuthenticated) return '/overview'
    return true
  }
  try {
    if (await auth.ensureSession()) {
      const token = auth.accessToken
      if (!token) return '/login'
      await navigation.load(token)
      if (auth.accessToken !== token) {
        navigation.reset()
        return '/login'
      }
      if (
        to.name === 'overview' ||
        to.name === 'system' ||
        to.name === 'device-keys' ||
        to.name === 'media' ||
        to.name === 'sessions' ||
        to.name === 'security-events' ||
        to.name === 'push-devices' ||
        to.name === 'media-shares' ||
        to.name === 'ai-config' ||
        to.name === 'ai-usage' ||
        to.name === 'ai-quotas' ||
        to.name === 'ai-sessions'
      ) {
        if (!navigation.visibleRoutes.some((item) => item.path === to.path)) return '/forbidden'
      }
      return true
    }
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
      if (auth.isAuthenticated) return '/session-error'
    }
    auth.clear()
  }
  navigation.reset()
  return { name: 'admin-login', query: { redirect: to.fullPath } }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || '管理端')} · 此刻`
})

export default router

export { staticAdminRoutes }
