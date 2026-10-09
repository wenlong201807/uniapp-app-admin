import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getAdminMe,
  loginAdmin,
  bootstrapAdmin,
  logoutAdmin,
  refreshAdmin,
  type AdminAccount,
  type AdminLoginInput,
} from '@/services/admin-auth'
import { ApiError } from '@/services/http'

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const admin = ref<AdminAccount | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const expiresAt = ref(0)
  const refreshing = ref<Promise<void> | null>(null)
  const isAuthenticated = computed(() => Boolean(admin.value && accessToken.value))
  let revision = 0
  let checking: Promise<boolean> | null = null

  function clear() {
    revision += 1
    admin.value = null
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = 0
    refreshing.value = null
    checking = null
  }

  function accept(result: {
    admin: AdminAccount
    accessToken: string
    refreshToken: string
    expiresIn: number
  }) {
    admin.value = result.admin
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    expiresAt.value = Date.now() + result.expiresIn * 1000
  }

  async function login(input: AdminLoginInput) {
    clear()
    const currentRevision = revision
    const result = await loginAdmin(input)
    if (revision !== currentRevision) throw new Error('登录操作已取消，请重试')
    accept(result)
  }

  async function bootstrap(input: Parameters<typeof bootstrapAdmin>[0]) {
    clear()
    const currentRevision = revision
    const result = await bootstrapAdmin(input)
    if (revision !== currentRevision) throw new Error('初始化操作已取消，请重试')
    accept(result)
  }

  async function refresh() {
    if (refreshing.value) return refreshing.value
    const current = refreshToken.value
    const currentRevision = revision
    if (!current) {
      clear()
      throw new Error('管理员会话已失效，请重新登录')
    }
    const pending = refreshAdmin(current)
      .then((result) => {
        if (revision !== currentRevision) throw new Error('管理员会话已变更，请重新登录')
        accept(result)
      })
      .catch((error: unknown) => {
        if (
          revision === currentRevision &&
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        )
          clear()
        throw error
      })
    refreshing.value = pending
    try {
      await pending
    } finally {
      if (refreshing.value === pending) refreshing.value = null
    }
  }

  async function ensureSession() {
    if (!accessToken.value) return false
    if (checking) return checking
    const currentRevision = revision
    const pending = (async () => {
      try {
        if (Date.now() >= expiresAt.value - 30_000) await refresh()
        if (revision !== currentRevision || !accessToken.value) return false
        const account = await getAdminMe(accessToken.value)
        if (revision !== currentRevision) return false
        admin.value = account
        return true
      } catch (error) {
        if (revision !== currentRevision) return false
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) clear()
        throw error
      }
    })()
    checking = pending
    try {
      return await pending
    } finally {
      if (checking === pending) checking = null
    }
  }

  async function logout() {
    const token = accessToken.value
    clear()
    if (token) await logoutAdmin(token)
  }

  return {
    admin,
    accessToken,
    isAuthenticated,
    refreshing,
    login,
    bootstrap,
    refresh,
    ensureSession,
    logout,
    clear,
  }
})
