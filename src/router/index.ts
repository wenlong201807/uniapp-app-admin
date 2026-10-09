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
      if (to.name === 'overview' || to.name === 'system') {
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
