<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElIcon, ElTag } from 'element-plus'
import { ArrowRight, Connection, Monitor, Check, Refresh } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()
const date = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())
const healthLabel = computed(() =>
  app.health ? '运行正常' : app.healthError ? '连接异常' : '等待检测',
)
const modules = [
  {
    number: '01',
    name: '用户管理',
    description: '用户列表、账号状态与权限管理',
    detail: '待定义管理员角色与用户管理接口',
  },
  {
    number: '02',
    name: '任务管理',
    description: '任务检索、状态查看与内容管理',
    detail: '现有任务接口仅返回当前用户的数据',
  },
  {
    number: '03',
    name: '媒体管理',
    description: '图片、视频与存储使用情况',
    detail: '待提供管理端媒体检索与审核接口',
  },
]
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
      <p>连接应用服务，逐步构建统一的管理工作空间。</p>
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
          <p class="eyebrow">FOUNDATION</p>
          <h2>工程基础</h2>
        </div>
        <ElIcon class="section-icon" :size="24"><Monitor /></ElIcon>
      </div>
      <div class="foundation-row">
        <span>界面与状态</span><strong>Vue 3 / Element Plus / Pinia</strong
        ><ElIcon><Check /></ElIcon>
      </div>
      <div class="foundation-row">
        <span>构建与类型</span><strong>Vite / TypeScript</strong><ElIcon><Check /></ElIcon>
      </div>
      <div class="foundation-row">
        <span>代码规范</span><strong>Oxfmt / Oxlint</strong><ElIcon><Check /></ElIcon>
      </div>
    </section>
  </div>

  <section class="panel module-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">NEXT STEPS</p>
        <h2>业务模块</h2>
      </div>
      <ElTag type="info" effect="plain">待接入管理接口</ElTag>
    </div>
    <div class="module-list">
      <article v-for="module in modules" :key="module.number" class="module-row">
        <span class="module-number">{{ module.number }}</span>
        <div class="module-name">
          <h3>{{ module.name }}</h3>
          <p>{{ module.description }}</p>
        </div>
        <p class="module-detail">{{ module.detail }}</p>
        <ElTag type="info" size="small" effect="plain">待规划</ElTag>
      </article>
    </div>
    <p class="module-note">
      当前服务端尚未提供管理员身份与全局数据管理能力，业务模块将在接口确定后接入。
    </p>
  </section>
</template>
