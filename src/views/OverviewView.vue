<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElAlert, ElButton, ElIcon, ElTag } from 'element-plus'
import { ArrowRight, Connection, Refresh } from '@element-plus/icons-vue'
import { useAdminRoutesStore } from '@/stores/admin-routes'
import { getDashboard, type Dashboard } from '@/services/admin-system'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()
const auth = useAdminAuthStore()
const stats = ref<Dashboard | null>(null),
  statsLoading = ref(false),
  statsError = ref('')
async function loadStats() {
  if (!auth.accessToken) return
  statsLoading.value = true
  statsError.value = ''
  try {
    stats.value = await getDashboard(auth.accessToken)
  } catch (cause) {
    statsError.value = cause instanceof Error ? cause.message : '统计加载失败'
  } finally {
    statsLoading.value = false
  }
}
onMounted(loadStats)
const metrics = computed(() =>
  stats.value
    ? [
        { label: '应用用户', value: stats.value.users },
        { label: '任务总数', value: stats.value.tasks },
        { label: '已完成任务', value: stats.value.completedTasks },
        { label: '媒体文件', value: stats.value.media },
        { label: '管理员', value: stats.value.admins },
        { label: '角色', value: stats.value.roles },
        { label: '部门', value: stats.value.departments },
        { label: '岗位', value: stats.value.positions },
      ]
    : [],
)
const date = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())
const healthLabel = computed(() =>
  app.health ? '运行正常' : app.healthError ? '连接异常' : '等待检测',
)
const navigation = useAdminRoutesStore()
const modules = computed(() =>
  [
    {
      number: '01',
      name: '角色与权限',
      description: '管理角色授权及启停状态',
      detail: '服务端 RBAC 已启用，权限由接口强制校验',
      path: '/rbac',
    },
    {
      number: '02',
      name: '部门与岗位',
      description: '维护组织层级和管理员归属',
      detail: '部门层级、岗位状态及成员分配已接入',
      path: '/organization/departments',
    },
    {
      number: '03',
      name: '安全审计',
      description: '查看认证和管理操作事件',
      detail: '支持筛选、分页和 CSV 导出',
      path: '/security-events',
    },
    {
      number: '04',
      name: '媒体管理',
      description: '查看和处理用户媒体元数据',
      detail: '支持按用户、文件名检索及管理员删除',
      path: '/media',
    },
  ].filter((module) => navigation.visibleRoutes.some((route) => route.path === module.path)),
)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">OVERVIEW</p>
      <h1>工作台</h1>
      <p class="page-description">从这里了解应用状态，开启管理工作。</p>
    </div>
    <span class="date-label">{{ date }}</span>
  </div>

  <section class="welcome-panel">
    <div class="welcome-copy">
      <span class="welcome-label">此刻 · 管理控制台</span>
      <h2>每一个此刻，<br />都有条不紊。</h2>
      <p>查看服务状态，管理权限、组织和业务资源。</p>
      <ElButton class="welcome-button" @click="router.push('/system')"
        >查看服务连接 <ElIcon><ArrowRight /></ElIcon
      ></ElButton>
    </div>
    <div class="welcome-art" aria-hidden="true">
      <div class="orbit orbit-one"></div>
      <div class="orbit orbit-two"></div>
      <div class="clock-face"><span></span><i></i><b></b></div>
      <span class="art-caption">A MOMENT, WELL ORGANIZED.</span>
    </div>
  </section>

  <div class="overview-grid">
    <section class="panel service-summary">
      <div class="section-title">
        <div>
          <p class="eyebrow">CONNECTION</p>
          <h2>服务状态</h2>
        </div>
        <ElIcon class="section-icon" :size="24"><Connection /></ElIcon>
      </div>
      <div class="service-state" aria-live="polite">
        <span
          class="large-status-dot"
          :class="{ online: app.health, failed: app.healthError }"
        ></span
        ><strong>{{ app.checking ? '正在检测' : healthLabel }}</strong>
      </div>
      <p class="muted">
        {{
          app.healthError ||
          (app.health ? 'API、MySQL 和 Redis 健康检查通过。' : '检测服务端与数据库连接情况。')
        }}
      </p>
      <ElButton :icon="Refresh" :loading="app.checking" @click="app.checkHealth">{{
        app.checkedAt ? '重新检测' : '检测连接'
      }}</ElButton>
    </section>
    <section class="panel foundation-summary">
      <div class="section-title">
        <div>
          <p class="eyebrow">LIVE DATA</p>
          <h2>业务统计</h2>
        </div>
        <ElButton text :loading="statsLoading" @click="loadStats">刷新</ElButton>
      </div>
      <ElAlert v-if="statsError" :title="statsError" type="error" :closable="false" show-icon />
      <p v-else-if="!stats" class="muted">正在加载统计…</p>
      <div v-else class="dashboard-metrics">
        <div v-for="metric in metrics" :key="metric.label">
          <span>{{ metric.label }}</span
          ><strong>{{ metric.value.toLocaleString('zh-CN') }}</strong>
        </div>
      </div>
      <p class="muted">统计按当前角色的数据范围计算。</p>
      <p v-if="stats" class="muted">
        更新于 {{ new Date(stats.checkedAt).toLocaleString('zh-CN') }}
      </p>
    </section>
  </div>

  <section class="panel module-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">MANAGEMENT</p>
        <h2>业务模块</h2>
      </div>
      <ElTag type="success" effect="plain">已接入管理接口</ElTag>
    </div>
    <div class="module-list">
      <article v-for="module in modules" :key="module.number" class="module-row">
        <span class="module-number">{{ module.number }}</span>
        <div class="module-name">
          <h3>{{ module.name }}</h3>
          <p>{{ module.description }}</p>
        </div>
        <p class="module-detail">{{ module.detail }}</p>
        <ElButton text type="primary" @click="router.push(module.path)"
          >打开 <ElIcon><ArrowRight /></ElIcon
        ></ElButton>
      </article>
    </div>
    <p class="module-note">
      管理端页面通过管理员会话访问服务端，接口权限由角色授权决定；未授权模块不会出现在导航中。
    </p>
  </section>
</template>

<style scoped>
.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 12px;
  margin: 22px 0;
}
.dashboard-metrics span {
  display: block;
  font-size: 12px;
  color: var(--text-muted, #6b7280);
}
.dashboard-metrics strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}
@media (max-width: 600px) {
  .dashboard-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
