<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import {
  getAdminSessions,
  revokeAdminSession,
  type AdminSessionGroup,
} from '@/services/admin-sessions'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = ref<AdminSessionGroup[]>([])
function date(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '旧版会话，时间未知'
}
function ttl(value: number) {
  return value < 3600
    ? `${Math.max(1, Math.ceil(value / 60))} 分钟`
    : `${Math.ceil(value / 3600)} 小时`
}
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminSessions(auth.accessToken, {
      page: page.value,
      pageSize: pageSize.value,
      q: query.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '会话列表加载失败')
  } finally {
    loading.value = false
  }
}
async function search() {
  page.value = 1
  await load()
}
async function turnPage(direction: 1 | -1) {
  page.value += direction
  await load()
}
async function revoke(group: AdminSessionGroup, sessionId: string) {
  if (
    !auth.accessToken ||
    !window.confirm(`撤销 ${group.user.email} 的这台设备会话？该设备需要重新登录。`)
  )
    return
  try {
    await revokeAdminSession(auth.accessToken, group.user.id, sessionId)
    ElMessage.success('会话已撤销')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '会话撤销失败')
  }
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SESSION SECURITY</p>
      <h1>设备会话</h1>
      <p class="page-description">查看用户的活跃登录会话，发现异常时立即撤销。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">ACTIVE SESSIONS</p>
        <h2>登录设备</h2>
      </div>
      <ElInput
        v-model="query"
        clearable
        placeholder="用户邮箱或昵称"
        style="max-width: 280px"
        @keyup.enter="search"
      />
    </div>
    <ElTable v-loading="loading" :data="rows" stripe
      ><ElTableColumn label="用户" min-width="230"
        ><template #default="scope"
          ><strong>{{ scope.row.user.displayName }}</strong
          ><br /><span class="muted">{{ scope.row.user.email }}</span></template
        ></ElTableColumn
      ><ElTableColumn label="会话" min-width="250"
        ><template #default="scope"
          ><div v-for="item in scope.row.sessions" :key="item.id" class="session-row">
            <span>{{ item.platform }} · {{ item.ipAddress || '地址未知' }}</span
            ><span class="session-id">{{ item.id.slice(0, 8) }}…</span
            ><ElTag size="small" type="success" effect="plain">剩余 {{ ttl(item.expiresIn) }}</ElTag
            ><ElButton
              text
              type="danger"
              :icon="Delete"
              @click="revoke(scope.row as AdminSessionGroup, item.id)"
              >撤销</ElButton
            >
          </div></template
        ></ElTableColumn
      ><ElTableColumn label="最近活动" min-width="180"
        ><template #default="scope"
          ><div v-for="item in scope.row.sessions" :key="`${item.id}-seen`">
            {{ date(item.lastSeenAt) }}
          </div></template
        ></ElTableColumn
      ><ElTableColumn label="创建时间" min-width="180"
        ><template #default="scope"
          ><div v-for="item in scope.row.sessions" :key="`${item.id}-created`">
            {{ date(item.createdAt) }}
          </div></template
        ></ElTableColumn
      ></ElTable
    >
    <div class="table-footer">
      <span>匹配 {{ total }} 个用户</span
      ><ElButton text :disabled="page <= 1" @click="turnPage(-1)">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="turnPage(1)">下一页</ElButton>
    </div>
    <p class="muted privacy-note">
      只显示会话标识前缀和时间，IP 仅显示脱敏前缀；不展示 refresh token、access token 或生物特征。
    </p>
  </section>
</template>
<style scoped>
.session-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}
.session-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.privacy-note {
  margin-top: 14px;
}
</style>
