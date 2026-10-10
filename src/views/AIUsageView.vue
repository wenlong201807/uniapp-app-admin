<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElButton,
  ElDatePicker,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getAdminAiUsage, type AdminAiUsageRow } from '@/services/admin-ai'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()
const loading = ref(false)
const by = ref<'user' | 'model'>('user')
const rows = ref<AdminAiUsageRow[]>([])
let revision = 0

function toDateInput(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
const from = ref(toDateInput(Date.now() - 29 * 86400000))
const to = ref(toDateInput(Date.now()))

function toastError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback)
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}

function tokensOf(row: AdminAiUsageRow) {
  return row.promptTokens + row.completionTokens
}

async function load() {
  if (!auth.accessToken) return
  loading.value = true
  const current = ++revision
  const token = auth.accessToken
  try {
    const result = await getAdminAiUsage(token, {
      from: from.value || undefined,
      to: to.value || undefined,
      by: by.value,
    })
    if (current !== revision || token !== auth.accessToken) return
    rows.value = result.items
  } catch (error) {
    toastError(error, '用量统计加载失败')
  } finally {
    if (current === revision) loading.value = false
  }
}

const maxTokens = computed(() => rows.value.reduce((peak, row) => Math.max(peak, tokensOf(row)), 0))

function barWidth(row: AdminAiUsageRow) {
  if (maxTokens.value <= 0) return '0%'
  return `${Math.round((tokensOf(row) / maxTokens.value) * 1000) / 10}%`
}

const summary = computed(() =>
  rows.value.reduce(
    (totals, row) => ({
      tokens: totals.tokens + tokensOf(row),
      calls: totals.calls + row.calls,
      failures: totals.failures + row.failures,
    }),
    { tokens: 0, calls: 0, failures: 0 },
  ),
)

onMounted(load)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">AI ANALYTICS</p>
      <h1>AI 用量</h1>
      <p class="page-description">按用户或模型查看 AI 调用的 Token 用量与失败情况。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">USAGE STATS</p>
        <h2>用量统计</h2>
      </div>
      <ElDatePicker
        v-model="from"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="开始日期"
        :clearable="false"
        style="width: 160px"
      />
      <ElDatePicker
        v-model="to"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="结束日期"
        :clearable="false"
        style="width: 160px"
      />
      <ElSelect v-model="by" style="width: 130px" @change="load">
        <ElOption label="按用户" value="user" />
        <ElOption label="按模型" value="model" />
      </ElSelect>
      <ElButton type="primary" :icon="Search" :loading="loading" @click="load">查询</ElButton>
    </div>
    <div class="usage-summary">
      <span>共 {{ rows.length }} 项</span>
      <span>Tokens {{ formatNumber(summary.tokens) }}</span>
      <span>调用 {{ formatNumber(summary.calls) }}</span>
      <span>失败 {{ formatNumber(summary.failures) }}</span>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <template #empty>该时间范围内暂无 AI 用量记录</template>
      <ElTableColumn v-if="by === 'model'" label="供应商" width="110">
        <template #default="scope">
          <ElTag size="small" effect="plain">{{ scope.row.provider }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn v-if="by === 'model'" prop="model" label="模型" min-width="180" />
      <ElTableColumn v-else label="用户" min-width="220">
        <template #default="scope">
          <strong>{{ (scope.row as AdminAiUsageRow).user?.displayName }}</strong>
          <br />
          <span class="muted">{{ (scope.row as AdminAiUsageRow).user?.email }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="Tokens" min-width="220">
        <template #default="scope">
          <div class="token-cell">
            <span>{{ formatNumber(tokensOf(scope.row as AdminAiUsageRow)) }}</span>
            <div class="token-bar-track">
              <div class="token-bar" :style="{ width: barWidth(scope.row as AdminAiUsageRow) }" />
            </div>
            <span class="muted token-breakdown">
              输入 {{ formatNumber((scope.row as AdminAiUsageRow).promptTokens) }} · 输出
              {{ formatNumber((scope.row as AdminAiUsageRow).completionTokens) }}
            </span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="调用" min-width="100">
        <template #default="scope">{{
          formatNumber((scope.row as AdminAiUsageRow).calls)
        }}</template>
      </ElTableColumn>
      <ElTableColumn label="失败" min-width="100">
        <template #default="scope">{{
          formatNumber((scope.row as AdminAiUsageRow).failures)
        }}</template>
      </ElTableColumn>
    </ElTable>
  </section>
</template>

<style scoped>
.usage-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.token-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.token-bar-track {
  width: 100%;
  max-width: 220px;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.token-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
}
.token-breakdown {
  font-size: 12px;
}
</style>
