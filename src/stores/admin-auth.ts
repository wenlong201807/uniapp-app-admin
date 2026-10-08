import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getAdminMe,
  loginAdmin,
  logoutAdmin,
  refreshAdmin,
  type AdminAccount,
  type AdminLoginInput,
} from '@/services/admin-auth'

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const admin = ref<AdminAccount | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const expiresAt = ref(0)
  const refreshing = ref<Promise<void> | null>(null)
  const isAuthenticated = computed(() => Boolean(admin.value && accessToken.value))

  function clear() {
    admin.value = null
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = 0
    refreshing.value = null
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
    accept(await loginAdmin(input))
  }

  async function refresh() {
    if (refreshing.value) return refreshing.value
    const current = refreshToken.value
    if (!current) {
      clear()
      throw new Error('管理员会话已失效，请重新登录')
    }
    const pending = refreshAdmin(current)
      .then(accept)
      .catch((error: unknown) => {
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
    if (Date.now() >= expiresAt.value - 30_000) await refresh()
    if (!admin.value) admin.value = await getAdminMe(accessToken.value)
    return true
  }

  async function logout() {
    const token = accessToken.value
    try {
      if (token) await logoutAdmin(token)
    } finally {
      clear()
    }
  }

  return {
    admin,
    accessToken,
    isAuthenticated,
    refreshing,
    login,
    refresh,
    ensureSession,
    logout,
    clear,
  }
})
