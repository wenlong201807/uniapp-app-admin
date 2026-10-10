<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus'
import { Edit, Refresh } from '@element-plus/icons-vue'
import {
  getAdminAiQuotas,
  getAdminAiSettings,
  putAdminAiQuota,
  putAdminAiSettings,
  type AdminAiQuotaRow,
} from '@/services/admin-ai'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()

function toastError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback)
}

function formatLimit(value: number | null) {
  return value === null ? '跟随全局' : value.toLocaleString('zh-CN')
}

const settingsLoading = ref(false)
const settingsSaving = ref(false)
const settingsForm = reactive({
  overrideTokenLimit: null as number | null,
  overrideCallLimit: null as number | null,
})
const effectiveTokenLimit = ref<number | null>(null)
const effectiveCallLimit = ref<number | null>(null)
let settingsRevision = 0

function formatEffective(value: number | null) {
  return value === null ? '未设置' : value.toLocaleString('zh-CN')
}

const effectiveSource = computed(() =>
  settingsForm.overrideTokenLimit !== null || settingsForm.overrideCallLimit !== null
    ? '数据库覆盖'
    : '环境变量默认',
)

async function loadSettings() {
  if (!auth.accessToken) return
  settingsLoading.value = true
  const current = ++settingsRevision
  const token = auth.accessToken
  try {
    const result = await getAdminAiSettings(token)
    if (current !== settingsRevision || token !== auth.accessToken) return
    settingsForm.overrideTokenLimit = result.overrideTokenLimit
    settingsForm.overrideCallLimit = result.overrideCallLimit
    effectiveTokenLimit.value = result.effectiveTokenLimit
    effectiveCallLimit.value = result.effectiveCallLimit
  } catch (error) {
    toastError(error, '全局额度加载失败')
  } finally {
    if (current === settingsRevision) settingsLoading.value = false
  }
}

async function saveSettings() {
  if (!auth.accessToken || settingsSaving.value) return
  settingsSaving.value = true
  try {
    // PUT 为全量替换：两字段必须齐发；override 语义下空=null 即清除覆盖，回退环境变量默认
    await putAdminAiSettings(auth.accessToken, {
      dailyTokenLimit: settingsForm.overrideTokenLimit ?? null,
      dailyCallLimit: settingsForm.overrideCallLimit ?? null,
    })
    ElMessage.success('全局默认额度已保存')
    await loadSettings()
  } catch (error) {
    toastError(error, '全局额度保存失败')
  } finally {
    settingsSaving.value = false
  }
}

const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = ref<AdminAiQuotaRow[]>([])
let quotaRevision = 0

async function load() {
  if (!auth.accessToken) return
  loading.value = true
  const current = ++quotaRevision
  const token = auth.accessToken
  try {
    const result = await getAdminAiQuotas(token, {
      page: page.value,
      pageSize: pageSize.value,
      q: query.value,
    })
    if (current !== quotaRevision || token !== auth.accessToken) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    toastError(error, '用户额度列表加载失败')
  } finally {
    if (current === quotaRevision) loading.value = false
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

const quotaDialog = ref(false)
const quotaSaving = ref(false)
const editingUser = ref<AdminAiQuotaRow | null>(null)
const quotaForm = reactive({
  dailyTokenLimit: null as number | null,
  dailyCallLimit: null as number | null,
})

function openQuotaEdit(row: AdminAiQuotaRow) {
  editingUser.value = row
  quotaForm.dailyTokenLimit = row.dailyTokenLimit
  quotaForm.dailyCallLimit = row.dailyCallLimit
  quotaDialog.value = true
}

async function submitQuota() {
  if (!auth.accessToken || !editingUser.value || quotaSaving.value) return
  quotaSaving.value = true
  try {
    // PUT 为全量替换：两字段必须齐发，留空序列化为 null（跟随全局）
    await putAdminAiQuota(auth.accessToken, editingUser.value.id, {
      dailyTokenLimit: quotaForm.dailyTokenLimit ?? null,
      dailyCallLimit: quotaForm.dailyCallLimit ?? null,
    })
    ElMessage.success('用户额度已保存')
    quotaDialog.value = false
    await load()
  } catch (error) {
    toastError(error, '用户额度保存失败')
  } finally {
    quotaSaving.value = false
  }
}

async function initialize() {
  await Promise.all([loadSettings(), load()])
}

onMounted(initialize)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">AI QUOTAS</p>
      <h1>AI 额度</h1>
      <p class="page-description">配置全局默认额度与单个用户的 AI 每日限额。</p>
    </div>
    <ElButton :icon="Refresh" :loading="settingsLoading || loading" @click="initialize"
      >刷新</ElButton
    >
  </div>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">GLOBAL LIMITS</p>
        <h2>全局默认额度</h2>
      </div>
      <ElButton type="primary" :loading="settingsSaving" @click="saveSettings"
        >保存全局额度</ElButton
      >
    </div>
    <ElForm
      :model="settingsForm"
      label-position="top"
      class="quota-form"
      v-loading="settingsLoading"
    >
      <ElFormItem label="每日 Token 上限（数据库覆盖）">
        <ElInputNumber
          v-model="settingsForm.overrideTokenLimit"
          :min="1"
          :max="100000000"
          :precision="0"
          :value-on-clear="null"
          placeholder="留空 = 无覆盖，使用环境变量默认"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="每日调用次数上限（数据库覆盖）">
        <ElInputNumber
          v-model="settingsForm.overrideCallLimit"
          :min="1"
          :max="100000000"
          :precision="0"
          :value-on-clear="null"
          placeholder="留空 = 无覆盖，使用环境变量默认"
          style="width: 100%"
        />
      </ElFormItem>
    </ElForm>
    <p class="muted quota-hint">
      当前生效：{{ formatEffective(effectiveTokenLimit) }} /
      {{ formatEffective(effectiveCallLimit) }}（{{
        effectiveSource
      }}）；表单留空保存即清除覆盖（两项同时提交），无覆盖时回退环境变量 AI_DAILY_TOKEN_LIMIT /
      AI_DAILY_CALL_LIMIT。
    </p>
  </section>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">USER LIMITS</p>
        <h2>用户额度</h2>
      </div>
      <ElInput
        v-model="query"
        clearable
        placeholder="邮箱或昵称"
        style="max-width: 260px"
        @keyup.enter="search"
      />
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ (scope.row as AdminAiQuotaRow).displayName }}</strong
          ><br /><span class="muted">{{ (scope.row as AdminAiQuotaRow).email }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="Token 上限" min-width="140"
        ><template #default="scope"
          ><span :class="{ muted: (scope.row as AdminAiQuotaRow).dailyTokenLimit === null }">{{
            formatLimit((scope.row as AdminAiQuotaRow).dailyTokenLimit)
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="调用上限" min-width="140"
        ><template #default="scope"
          ><span :class="{ muted: (scope.row as AdminAiQuotaRow).dailyCallLimit === null }">{{
            formatLimit((scope.row as AdminAiQuotaRow).dailyCallLimit)
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton text :icon="Edit" @click="openQuotaEdit(scope.row as AdminAiQuotaRow)"
            >编辑</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 个用户</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
  </section>

  <ElDialog
    v-model="quotaDialog"
    :title="editingUser ? `编辑「${editingUser.displayName}」的额度` : '编辑用户额度'"
    width="480px"
    :close-on-click-modal="false"
  >
    <ElForm :model="quotaForm" label-position="top">
      <ElFormItem label="每日 Token 上限">
        <ElInputNumber
          v-model="quotaForm.dailyTokenLimit"
          :min="1"
          :max="100000000"
          :precision="0"
          :value-on-clear="null"
          placeholder="留空 = 跟随全局"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="每日调用次数上限">
        <ElInputNumber
          v-model="quotaForm.dailyCallLimit"
          :min="1"
          :max="100000000"
          :precision="0"
          :value-on-clear="null"
          placeholder="留空 = 跟随全局"
          style="width: 100%"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton :disabled="quotaSaving" @click="quotaDialog = false">取消</ElButton>
      <ElButton type="primary" :loading="quotaSaving" @click="submitQuota">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.quota-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  column-gap: 16px;
  align-items: start;
}
.quota-hint {
  font-size: 12px;
}
</style>
