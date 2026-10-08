import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/overview' },
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

router.afterEach((to) => {
  document.title = `${String(to.meta.title || '管理端')} · 此刻`
})

export default router
