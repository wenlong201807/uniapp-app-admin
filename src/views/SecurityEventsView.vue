<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElButton,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSelect,
  ElOption,
} from 'element-plus'
import { appConfig } from '@/config/app'
import { Refresh } from '@element-plus/icons-vue'
import { getSecurityEvents, type SecurityEvent } from '@/services/admin-security-events'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const action = ref('')
const userId = ref('')
const resultFilter = ref<'' | 'SUCCESS' | 'FAILURE'>('')
const exporting = ref(false)
let revision = 0
const rows = ref<SecurityEvent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  const current = ++revision
  const token = auth.accessToken
  try {
    const result = await getSecurityEvents(auth.accessToken, {
      page: page.value,
      pageSize,
      action: action.value,
      userId: userId.value,
      result: resultFilter.value || undefined,
    })
    if (current !== revision || token !== auth.accessToken) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '审计日志加载失败')
  } finally {
    if (current === revision) loading.value = false
  }
}
async function search() {
  page.value = 1
  await load()
}
async function previousPage() {
  page.value -= 1
  await load()
}
async function nextPage() {
  page.value += 1
  await load()
}
async function exportPage() {
  if (!auth.accessToken || exporting.value) return
  const token = auth.accessToken
  exporting.value = true
  try {
    const query = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    if (action.value.trim()) query.set('action', action.value.trim())
    if (userId.value.trim()) query.set('userId', userId.value.trim())
    if (resultFilter.value) query.set('result', resultFilter.value)
    const response = await fetch(`${appConfig.apiBaseUrl}/admin/security-events/export?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(`导出失败（${response.status}）`)
    const blob = await response.blob()
    if (token !== auth.accessToken) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'security-events.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败')
  } finally {
    exporting.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SECURITY AUDIT</p>
      <h1>安全审计</h1>
      <p class="page-description">追踪登录、设备撤销和账号安全操作。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>事件记录</h2>
      <ElButton :loading="exporting" @click="exportPage">导出当前页</ElButton>
      <ElInput
        v-model="userId"
        clearable
        placeholder="用户 ID"
        style="max-width: 240px"
        @keyup.enter="search"
      />
      <ElSelect
        v-model="resultFilter"
        placeholder="全部结果"
        clearable
        style="width: 140px"
        @change="search"
        ><ElOption label="成功" value="SUCCESS" /><ElOption label="失败" value="FAILURE"
      /></ElSelect>
      <ElInput
        v-model="action"
        clearable
        placeholder="按动作筛选，如 LOGIN"
        style="max-width: 280px"
        @keyup.enter="search"
      />
    </div>
    <ElTable v-loading="loading" :data="rows" stripe
      ><ElTableColumn label="时间" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.createdAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      ><ElTableColumn label="动作" prop="action" min-width="180" /><ElTableColumn
        label="结果"
        width="100"
        ><template #default="scope"
          ><ElTag :type="scope.row.result === 'SUCCESS' ? 'success' : 'danger'">{{
            scope.row.result === 'SUCCESS' ? '成功' : '失败'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="用户 ID" prop="userId" min-width="280" /><ElTableColumn
        label="管理员 ID"
        prop="adminId"
        min-width="280" /><ElTableColumn label="平台" prop="platform" width="100" /><ElTableColumn
        label="IP 前缀"
        prop="ipAddress"
        min-width="150" /><ElTableColumn
        label="请求 ID"
        prop="requestId"
        min-width="280" /><ElTableColumn label="详情" prop="details" min-width="220"
    /></ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
    <p class="muted privacy-note">
      日志不保存令牌、生物特征或完整凭据；IP 和客户端信息仅供安全排查。
    </p>
  </section>
</template>
