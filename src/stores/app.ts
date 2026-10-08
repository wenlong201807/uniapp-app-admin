import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHealth, type HealthStatus } from '@/services/health'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const health = ref<HealthStatus | null>(null)
  const checking = ref(false)
  const healthError = ref('')
  const checkedAt = ref<Date | null>(null)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function checkHealth() {
    if (checking.value) return
    checking.value = true
    healthError.value = ''
    health.value = null
    try {
      health.value = await getHealth()
    } catch (error) {
      healthError.value = error instanceof Error ? error.message : '健康检查失败'
    } finally {
      checkedAt.value = new Date()
      checking.value = false
    }
  }

  return { sidebarCollapsed, health, checking, healthError, checkedAt, toggleSidebar, checkHealth }
})
