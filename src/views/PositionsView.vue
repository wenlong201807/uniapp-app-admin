<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { ApiError } from '@/services/http'
import {
  createPosition,
  deletePosition,
  getPositions,
  updatePosition,
  type Position,
  type PositionInput,
} from '@/services/admin-organization'
const auth = useAdminAuthStore()
const rows = ref<Position[]>([]),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  dialog = ref(false),
  q = ref('')
const editing = ref<Position | null>(null)
const form = ref<PositionInput>({ code: '', name: '', orderNum: 0, enabled: true })
const canWrite = computed(
  () =>
    (auth.admin?.permissions?.includes('admin:organization:positions:write') ?? false) &&
    auth.admin?.dataScope === 'ALL',
)
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  error.value = ''
  try {
    rows.value = (await getPositions(auth.accessToken, q.value)).items
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '岗位加载失败'
  } finally {
    loading.value = false
  }
}
function open(row?: Position) {
  editing.value = row ?? null
  form.value = row
    ? { code: row.code, name: row.name, orderNum: row.orderNum, enabled: row.enabled }
    : { code: '', name: '', orderNum: 0, enabled: true }
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || saving.value) return
  if (
    !form.value.name.trim() ||
    !/^[A-Z][A-Z0-9_]{0,63}$/.test(form.value.code.trim().toUpperCase())
  ) {
    ElMessage.error('请输入名称和有效编码（字母开头，可含数字及下划线）')
    return
  }
  saving.value = true
  try {
    if (editing.value)
      await updatePosition(auth.accessToken, editing.value.id, {
        ...form.value,
        expectedRevision: editing.value.revision,
      })
    else await createPosition(auth.accessToken, form.value)
    dialog.value = false
    await load()
    ElMessage.success('岗位已保存')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
    if (cause instanceof ApiError && cause.status === 409) {
      dialog.value = false
      await load()
    }
  } finally {
    saving.value = false
  }
}
async function remove(row: Position) {
  try {
    await ElMessageBox.confirm(`确认删除岗位“${row.name}”？仍有成员的岗位不能删除。`, '删除岗位', {
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
    await deletePosition(auth.accessToken, row.id, row.revision)
    await load()
    ElMessage.success('岗位已删除')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '删除失败')
    await load()
  } finally {
    saving.value = false
  }
}
onMounted(load)
function resetFilters() {
  q.value = ''
  void load()
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">ORGANIZATION</p>
      <h1>岗位管理</h1>
      <p class="page-description">维护岗位编码、排序和状态。停用岗位不再接受新增分配。</p>
    </div>
    <ElButton
      v-if="canWrite"
      type="primary"
      :disabled="loading || saving || !!error"
      @click="open()"
      >新建岗位</ElButton
    >
  </div>
  <section class="panel">
    <div class="position-toolbar">
      <ElInput
        v-model="q"
        placeholder="按编码或名称搜索"
        aria-label="按编码或名称搜索"
        clearable
        @keyup.enter="load"
      /><ElButton :loading="loading" @click="load">搜索</ElButton
      ><ElButton @click="resetFilters">重置</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon /><ElTable
      v-else-if="rows.length"
      :data="rows"
      stripe
      ><ElTableColumn prop="name" label="名称" min-width="160" /><ElTableColumn
        prop="code"
        label="编码"
        min-width="180"
      /><ElTableColumn prop="orderNum" label="排序" width="90" /><ElTableColumn
        label="成员"
        width="90"
        ><template #default="{ row }">{{ row._count?.accounts ?? 0 }}</template></ElTableColumn
      ><ElTableColumn label="状态" width="100"
        ><template #default="{ row }"
          ><ElTag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? '启用' : '停用'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn v-if="canWrite" label="操作" width="150"
        ><template #default="{ row }"
          ><ElButton link type="primary" :disabled="saving" @click="open(row as Position)"
            >编辑</ElButton
          ><ElButton link type="danger" :disabled="saving" @click="remove(row as Position)"
            >删除</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    ><ElEmpty v-else :description="loading ? '正在加载岗位…' : '暂无岗位'" />
  </section>
  <ElDialog
    v-model="dialog"
    :title="editing ? '编辑岗位' : '新建岗位'"
    width="min(520px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    ><ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="save"
      ><ElFormItem label="岗位编码" required
        ><ElInput v-model="form.code" maxlength="64" /></ElFormItem
      ><ElFormItem label="岗位名称" required
        ><ElInput v-model="form.name" maxlength="50" /></ElFormItem
      ><ElFormItem label="排序"
        ><ElInputNumber v-model="form.orderNum" :min="0" :max="999999" :precision="0" /></ElFormItem
      ><ElFormItem label="启用"><ElSwitch v-model="form.enabled" /></ElFormItem></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    ></ElDialog
  >
</template>
<style scoped>
.position-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.position-toolbar .el-input {
  width: min(300px, 100%);
}
</style>
