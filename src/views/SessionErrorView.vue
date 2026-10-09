<script setup lang="ts">
import { ElButton, ElResult, ElMessage } from 'element-plus'
import { Refresh, SwitchButton } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { useAdminRoutesStore } from '@/stores/admin-routes'

const router = useRouter()
const auth = useAdminAuthStore()
const navigation = useAdminRoutesStore()

async function retry() {
  navigation.reset()
  await router.replace('/overview')
}

async function logout() {
  try {
    await auth.logout()
  } catch {
    ElMessage.warning('本地已退出，服务端注销失败')
  } finally {
    navigation.reset()
    await router.replace('/login')
  }
}
</script>

<template>
  <main class="session-error-page">
    <ElResult icon="error" title="暂时无法连接服务" sub-title="请稍后重试。">
      <template #extra>
        <ElButton type="primary" :icon="Refresh" @click="retry">重试</ElButton>
        <ElButton :icon="SwitchButton" @click="logout">退出登录</ElButton>
      </template>
    </ElResult>
  </main>
</template>
