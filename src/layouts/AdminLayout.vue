<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElIcon, ElTag, ElMessage } from 'element-plus'
import { Connection, Fold, Grid, Expand, ArrowRight, Lock } from '@element-plus/icons-vue'
import { appConfig } from '@/config/app'
import { useAppStore } from '@/stores/app'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { useAdminRoutesStore } from '@/stores/admin-routes'

const app = useAppStore()
const auth = useAdminAuthStore()
const adminRoutes = useAdminRoutesStore()
const route = useRoute()
const router = useRouter()
const status = computed(() =>
  app.checking ? '检查中' : app.health ? '服务正常' : app.healthError ? '连接异常' : '待检测',
)
const iconMap = { dashboard: Grid, connection: Connection, shield: Lock }
const navigation = computed(() =>
  adminRoutes.visibleRoutes.map((item) => ({ ...item, icon: iconMap[item.icon] })),
)

async function logout() {
  try {
    await auth.logout()
  } catch (error) {
    ElMessage.warning(
      error instanceof Error
        ? `本地已退出，服务端注销失败：${error.message}`
        : '本地已退出，服务端注销失败',
    )
  } finally {
    adminRoutes.reset()
    await router.replace('/login')
  }
}
</script>

<template>
  <div class="admin-shell" :class="{ 'is-collapsed': app.sidebarCollapsed }">
    <a class="skip-link" href="#main-content">跳转到主要内容</a>
    <aside class="sidebar" aria-label="主导航">
      <RouterLink to="/overview" class="brand" aria-label="此刻管理端首页">
        <img src="/favicon.svg" alt="" width="38" height="38" />
        <span class="sidebar-copy"><strong>此刻</strong><small>管理控制台</small></span>
      </RouterLink>
      <div class="nav-caption sidebar-copy">WORKSPACE</div>
      <nav class="navigation" aria-label="管理导航">
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :title="item.title"
          :aria-current="route.path === item.path ? 'page' : undefined"
        >
          <ElIcon :size="20"><component :is="item.icon" /></ElIcon>
          <span class="sidebar-copy">{{ item.title }}</span>
          <span v-if="route.path === item.path" class="nav-dot sidebar-copy"></span>
        </RouterLink>
      </nav>
      <p v-if="adminRoutes.error" class="sidebar-notice sidebar-copy">{{ adminRoutes.error }}</p>
      <div class="sidebar-footer sidebar-copy">
        <span class="environment-dot"></span>
        <span>管理端基础工程</span>
        <small>v{{ appConfig.version }}</small>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="breadcrumbs">
          <ElButton
            text
            :aria-label="app.sidebarCollapsed ? '展开导航' : '收起导航'"
            :aria-expanded="!app.sidebarCollapsed"
            @click="app.toggleSidebar"
          >
            <ElIcon :size="20"><Expand v-if="app.sidebarCollapsed" /><Fold v-else /></ElIcon>
          </ElButton>
          <span class="breadcrumb-root">管理控制台</span>
          <ElIcon :size="12"><ArrowRight /></ElIcon>
          <strong>{{ route.meta.title }}</strong>
        </div>
        <RouterLink to="/system" class="connection-link" aria-label="查看服务连接状态">
          <ElTag
            :type="app.health ? 'success' : app.healthError ? 'danger' : 'info'"
            effect="plain"
            round
          >
            <span class="status-dot" :class="{ online: app.health }"></span>{{ status }}
          </ElTag>
        </RouterLink>
      </header>
      <main id="main-content" class="main-content" tabindex="-1">
        <RouterView />
      </main>
      <footer class="workspace-footer">
        <span>此刻 · 让管理井然有序</span>
        <span
          >管理员：{{ auth.admin?.displayName || auth.admin?.email }} ·
          <button class="logout-button" type="button" @click="logout">退出</button></span
        >
        <span>ADMIN CONSOLE / {{ appConfig.version }}</span>
      </footer>
    </div>
  </div>
</template>
