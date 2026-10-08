<script setup lang="ts">
import { computed } from 'vue'
import { ElAlert, ElButton, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { Link, Refresh } from '@element-plus/icons-vue'
import { appConfig } from '@/config/app'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const checkedTime = computed(() => app.checkedAt?.toLocaleString('zh-CN') || '尚未检测')
const docsUrl = appConfig.apiDocsUrl
const dependencies = computed(() => [
  {
    name: 'API 服务',
    detail: 'NestJS · /api/v1/health',
    state: app.health ? '正常' : app.healthError ? '异常' : '待检测',
  },
  { name: 'MySQL', detail: '业务数据存储', state: app.health?.mysql === 'up' ? '正常' : '未确认' },
  { name: 'Redis', detail: '会话与缓存', state: app.health?.redis === 'up' ? '正常' : '未确认' },
])
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">CONNECTION</p>
      <h1>服务连接</h1>
      <p class="page-description">确认管理端与应用服务的连接状态。</p>
    </div>
    <ElButton type="primary" :icon="Refresh" :loading="app.checking" @click="app.checkHealth"
      >检测连接</ElButton
    >
  </div>
  <ElAlert
    v-if="app.healthError"
    :title="app.healthError"
    type="error"
    show-icon
    :closable="false"
    class="health-alert"
  />
  <ElAlert
    v-else-if="app.health"
    title="健康检查通过，API、MySQL 与 Redis 已就绪。"
    type="success"
    show-icon
    :closable="false"
    class="health-alert"
  />
  <div class="dependency-grid" aria-live="polite">
    <section
      v-for="dependency in dependencies"
      :key="dependency.name"
      class="panel dependency-card"
    >
      <div class="section-title">
        <h2>{{ dependency.name }}</h2>
        <ElTag
          :type="
            dependency.state === '正常'
              ? 'success'
              : dependency.state === '异常'
                ? 'danger'
                : 'info'
          "
          effect="plain"
          >{{ app.checking ? '检测中' : dependency.state }}</ElTag
        >
      </div>
      <p class="muted">{{ dependency.detail }}</p>
    </section>
  </div>
  <section class="panel connection-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">CONFIGURATION</p>
        <h2>连接信息</h2>
      </div>
      <ElButton tag="a" :href="docsUrl" target="_blank" rel="noopener noreferrer" :icon="Link"
        >接口文档</ElButton
      >
    </div>
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="API 地址"
        ><code>{{ appConfig.apiBaseUrl }}</code></ElDescriptionsItem
      >
      <ElDescriptionsItem label="健康检查"
        ><code>GET {{ appConfig.apiBaseUrl }}/health</code></ElDescriptionsItem
      >
      <ElDescriptionsItem label="最近检测">{{ checkedTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="认证方式"
        >Bearer Token（管理端认证待服务端提供）</ElDescriptionsItem
      >
    </ElDescriptions>
    <p class="configuration-note">
      开发环境通过 Vite 代理连接服务端。修改根目录的 .env.local 后，重启开发服务即可生效。
    </p>
  </section>
</template>
