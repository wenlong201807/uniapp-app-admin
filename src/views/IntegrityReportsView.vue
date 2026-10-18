<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  ElButton,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import {
  listIntegrityReports,
  integrityCapabilities,
  reviewIntegrityReport,
  deleteIntegrityReport,
  type IntegrityReport,
  type IntegrityCapabilities,
} from '@/services/admin-integrity'
const auth = useAdminAuthStore()
const loading = ref(false),
  query = ref(''),
  review = ref(''),
  page = ref(1),
  total = ref(0)
const rows = ref<IntegrityReport[]>([]),
  capabilities = ref<IntegrityCapabilities | null>(null)
let alive = true
function signal(value: string) {
  return (
    (
      { DETECTED: '检测到线索', NOT_DETECTED: '未检测到', UNKNOWN: '未知' } as Record<
        string,
        string
      >
    )[value] || '未知'
  )
}
function reviewLabel(value: string) {
  return (
    ({ PENDING: '待复核', ACKNOWLEDGED: '已阅', FOLLOW_UP: '需跟进' } as Record<string, string>)[
      value
    ] || '未知'
  )
}
async function load() {
  const token = auth.accessToken
  if (loading.value || !token) return
  loading.value = true
  try {
    const [list, info] = await Promise.all([
      listIntegrityReports(token, { page: page.value, q: query.value, review: review.value }),
      integrityCapabilities(token),
    ])
    if (!alive || token !== auth.accessToken) return
    rows.value = list.items
    total.value = list.total
    capabilities.value = info
  } catch (error) {
    if (alive && token === auth.accessToken)
      ElMessage.error(error instanceof Error ? error.message : '设备风险加载失败')
  } finally {
    if (alive) loading.value = false
  }
}
function search() {
  if (!loading.value) {
    page.value = 1
    void load()
  }
}
function move(delta: number) {
  if (!loading.value) {
    page.value += delta
    void load()
  }
}
async function mutate(row: IntegrityReport, value: 'ACKNOWLEDGED' | 'FOLLOW_UP' | 'DELETE') {
  const token = auth.accessToken
  if (loading.value || !token) return
  try {
    await ElMessageBox.confirm(
      value === 'DELETE'
        ? '删除该报告？操作审计保留，不影响用户登录或设备密钥。'
        : '记录人工复核结果？报告仍为未验证的客户端线索，不表示设备可信。',
      value === 'DELETE' ? '删除报告' : '记录复核',
      {
        type: 'warning',
        confirmButtonText: value === 'DELETE' ? '删除' : '记录',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  loading.value = true
  try {
    if (value === 'DELETE') await deleteIntegrityReport(token, row.id)
    else await reviewIntegrityReport(token, row.id, value)
    if (alive && token === auth.accessToken) ElMessage.success('操作已完成并记录审计')
  } catch (error) {
    if (alive && token === auth.accessToken)
      ElMessage.error(error instanceof Error ? error.message : '操作失败')
  } finally {
    if (alive) loading.value = false
  }
  if (alive && token === auth.accessToken) await load()
}
onMounted(load)
onUnmounted(() => {
  alive = false
  rows.value = []
  capabilities.value = null
})
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">DEVICE RISK REPORTS</p>
      <h1>设备风险</h1>
      <p class="page-description">
        客户端枚举线索可被伪造或隐藏；未检测到不能证明安全。人工复核不改变未验证状态，当前观察模式不封禁账号、不修改登录或设备密钥。
      </p>
    </div>
    <ElButton :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <h2>平台证明状态</h2>
    <p v-if="!capabilities" class="muted">尚未获取服务端状态</p>
    <p v-for="provider in capabilities?.providers" :key="provider.provider">
      {{ provider.platform }} · {{ provider.provider }} ·
      {{ provider.configured ? provider.status : '未接入' }}
    </p>
    <p class="muted">
      每用户最多十条报告，最长保留 30 天。只有账号关联与三项枚举线索，不保存硬件标识、路径、平台
      Token 或原始证明。
    </p>
  </section>
  <section class="panel">
    <div class="section-title">
      <h2>人工复核</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          placeholder="用户邮箱或昵称"
          clearable
          @keyup.enter="search"
        /><ElSelect v-model="review" clearable placeholder="复核状态" style="width: 160px"
          ><ElOption label="待复核" value="PENDING" /><ElOption
            label="已阅"
            value="ACKNOWLEDGED" /><ElOption label="需跟进" value="FOLLOW_UP" /></ElSelect
        ><ElButton :disabled="loading" @click="search">查询</ElButton>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="200"
        ><template #default="scope"
          >{{ scope.row.owner.displayName }}<br /><span class="muted">{{
            scope.row.owner.email
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="platform" label="平台" width="100" />
      <ElTableColumn label="客户端线索" min-width="260"
        ><template #default="scope"
          >Root/越狱：{{ signal(scope.row.rootSignal) }}<br />调试：{{
            signal(scope.row.debugSignal)
          }}
          · 模拟器：{{ signal(scope.row.emulatorSignal) }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="证据" min-width="180"
        ><template #default="scope"
          >未验证 · 客户端报告<br />{{
            scope.row.freshness === 'STALE' ? '已陈旧' : '最近提交（不代表真机状态）'
          }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="复核" width="110"
        ><template #default="scope">{{ reviewLabel(scope.row.review) }}</template></ElTableColumn
      >
      <ElTableColumn label="提交 / 到期" min-width="190"
        ><template #default="scope"
          >{{ new Date(scope.row.createdAt).toLocaleString('zh-CN') }}<br />{{
            new Date(scope.row.expiresAt).toLocaleString('zh-CN')
          }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="操作" width="210" fixed="right"
        ><template #default="scope"
          ><ElButton
            text
            :disabled="loading"
            @click="mutate(scope.row as IntegrityReport, 'ACKNOWLEDGED')"
            >已阅</ElButton
          ><ElButton
            text
            :disabled="loading"
            @click="mutate(scope.row as IntegrityReport, 'FOLLOW_UP')"
            >跟进</ElButton
          ><ElButton
            text
            type="danger"
            :disabled="loading"
            @click="mutate(scope.row as IntegrityReport, 'DELETE')"
            >删除</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条报告</span
      ><ElButton text :disabled="loading || page <= 1" @click="move(-1)">上一页</ElButton
      ><ElButton text :disabled="loading || page * 20 >= total" @click="move(1)">下一页</ElButton>
    </div>
  </section>
</template>
<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
}
</style>
