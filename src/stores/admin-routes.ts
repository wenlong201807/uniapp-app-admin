import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getAdminRoutes,
  normalizeAdminRoutes,
  staticAdminRoutes,
  type AdminRouteRecord,
} from '@/services/admin-routes'
import { ApiError } from '@/services/http'

export const useAdminRoutesStore = defineStore('admin-routes', () => {
  const routes = ref<AdminRouteRecord[]>(staticAdminRoutes)
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const hasRemoteRoutes = ref(false)
  const visibleRoutes = computed(() => routes.value.filter((route) => route.path && route.title))
  let revision = 0
  let pending: Promise<void> | null = null

  async function load(token: string) {
    if (loaded.value) return
    if (pending) return pending
    const currentRevision = revision
    loading.value = true
    error.value = ''
    const task = (async () => {
      try {
        const response = await getAdminRoutes(token)
        if (revision !== currentRevision) return
        if (!Array.isArray(response)) throw new ApiError('管理导航响应格式异常', 502)
        routes.value = normalizeAdminRoutes(response)
        hasRemoteRoutes.value = true
        loaded.value = true
      } catch (cause) {
        if (revision !== currentRevision) return
        if (cause instanceof ApiError && (cause.status === 404 || cause.status === 501)) {
          routes.value = staticAdminRoutes
          error.value = '服务端尚未支持管理导航，当前仅提供基础页面'
          loaded.value = true
          return
        }
        routes.value = []
        if (cause instanceof ApiError && cause.status === 403) {
          error.value = '当前管理员无管理导航访问权限'
          loaded.value = true
          return
        }
        error.value = cause instanceof Error ? cause.message : '管理导航加载失败'
        throw cause
      } finally {
        if (revision === currentRevision) loading.value = false
      }
    })()
    pending = task
    try {
      await task
    } finally {
      if (pending === task) pending = null
    }
  }

  function reset() {
    revision += 1
    pending = null
    routes.value = staticAdminRoutes
    loading.value = false
    error.value = ''
    loaded.value = false
    hasRemoteRoutes.value = false
  }

  return { routes, visibleRoutes, loading, error, loaded, hasRemoteRoutes, load, reset }
})
