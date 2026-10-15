<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElRadioButton,
  ElRadioGroup,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import {
  createSystemSetting,
  deleteSystemSetting,
  getSystemSettings,
  updateSystemSetting,
  type SettingInput,
  type SystemSetting,
} from '@/services/admin-system'
const auth = useAdminAuthStore()
const rows = ref<SystemSetting[]>([]),
  kind = ref<SystemSetting['kind']>('DICTIONARY'),
  q = ref(''),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  dialog = ref(false)
const editing = ref<SystemSetting | null>(null)
const form = ref<SettingInput>({
  kind: 'DICTIONARY',
  key: '',
  name: '',
  value: '[]',
  enabled: true,
})
let revision = 0
async function load() {
  if (!auth.accessToken) return
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const result = await getSystemSettings(auth.accessToken, kind.value, q.value)
    if (current === revision) rows.value = result.items
  } catch (cause) {
    if (current === revision) error.value = cause instanceof Error ? cause.message : '配置加载失败'
  } finally {
    if (current === revision) loading.value = false
  }
}
function open(row?: SystemSetting) {
  editing.value = row ?? null
  form.value = row
    ? { kind: row.kind, key: row.key, name: row.name, value: row.value, enabled: row.enabled }
    : {
        kind: kind.value,
        key: '',
        name: '',
        value: kind.value === 'DICTIONARY' ? '[]' : '',
        enabled: true,
      }
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || saving.value) return
  if (!form.value.name.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(form.value.key.trim())) {
    ElMessage.error('请输入名称和有效配置键')
    return
  }
  saving.value = true
  try {
    if (editing.value)
      await updateSystemSetting(auth.accessToken, editing.value.id, {
        ...form.value,
        expectedRevision: editing.value.revision,
      })
    else await createSystemSetting(auth.accessToken, form.value)
    dialog.value = false
    await load()
    ElMessage.success('配置已保存')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
  } finally {
    saving.value = false
  }
}
async function remove(row: SystemSetting) {
  try {
    await ElMessageBox.confirm(`确认删除“${row.name}”？`, '删除配置', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  if (!auth.accessToken || saving.value) return
  saving.value = true
  try {
    await deleteSystemSetting(auth.accessToken, row.id, row.revision)
    await load()
    ElMessage.success('配置已删除')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '删除失败')
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SYSTEM SETTINGS</p>
      <h1>字典与参数</h1>
      <p class="page-description">
        维护可复用字典与业务参数。配置保存在服务端，由业务模块显式引用后生效。
      </p>
    </div>
    <ElButton type="primary" :disabled="loading || saving || !!error" @click="open()"
      >新建{{ kind === 'DICTIONARY' ? '字典' : '参数' }}</ElButton
    >
  </div>
  <section class="panel">
    <div class="settings-toolbar">
      <ElRadioGroup v-model="kind" @change="load"
        ><ElRadioButton value="DICTIONARY">字典</ElRadioButton
        ><ElRadioButton value="PARAMETER">参数</ElRadioButton></ElRadioGroup
      ><ElInput
        v-model="q"
        placeholder="按键或名称搜索"
        aria-label="按键或名称搜索"
        clearable
        @keyup.enter="load"
      /><ElButton :loading="loading" @click="load">搜索</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon /><ElTable
      v-else-if="rows.length"
      :data="rows"
      stripe
      ><ElTableColumn prop="name" label="名称" min-width="140" /><ElTableColumn
        prop="key"
        label="配置键"
        min-width="160"
      /><ElTableColumn
        prop="value"
        label="配置值"
        min-width="240"
        show-overflow-tooltip
      /><ElTableColumn label="状态" width="90"
        ><template #default="{ row }"
          ><ElTag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? '启用' : '停用'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="操作" width="150"
        ><template #default="{ row }"
          ><ElButton link type="primary" :disabled="saving" @click="open(row as SystemSetting)"
            >编辑</ElButton
          ><ElButton link type="danger" :disabled="saving" @click="remove(row as SystemSetting)"
            >删除</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    ><ElEmpty v-else :description="loading ? '正在加载配置…' : '暂无配置'" />
  </section>
  <ElDialog
    v-model="dialog"
    :title="editing ? '编辑配置' : '新建配置'"
    width="min(620px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    ><ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="save"
      ><ElFormItem label="配置键" required><ElInput v-model="form.key" maxlength="64" /></ElFormItem
      ><ElFormItem label="名称" required><ElInput v-model="form.name" maxlength="50" /></ElFormItem
      ><ElFormItem label="值"
        ><ElInput v-model="form.value" type="textarea" :rows="7" maxlength="10000" />
        <p v-if="form.kind === 'DICTIONARY'" class="muted">
          格式示例：[{"label":"启用","value":"active"}]
        </p>
        <p v-else class="muted">用于业务参数，请勿填写密码或访问凭证。</p></ElFormItem
      ><ElFormItem label="启用"><ElSwitch v-model="form.enabled" /></ElFormItem></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    ></ElDialog
  >
</template>
<style scoped>
.settings-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.settings-toolbar .el-input {
  width: min(260px, 100%);
}
</style>
