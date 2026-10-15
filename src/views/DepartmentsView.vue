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
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { ApiError } from '@/services/http'
import {
  createDepartment,
  deleteDepartment,
  departmentOptions,
  departmentTree,
  getDepartments,
  updateDepartment,
  type Department,
  type DepartmentInput,
} from '@/services/admin-organization'
const auth = useAdminAuthStore()
const rows = ref<Department[]>([])
const loading = ref(false),
  saving = ref(false),
  error = ref(''),
  dialog = ref(false)
const q = ref(''),
  state = ref(''),
  expanded = ref(true)
const editing = ref<Department | null>(null)
const emptyForm = (): DepartmentInput => ({
  name: '',
  parentId: null,
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  enabled: true,
})
const form = ref(emptyForm())
const canWrite = computed(
  () =>
    (auth.admin?.permissions?.includes('admin:organization:departments:write') ?? false) &&
    auth.admin?.dataScope === 'ALL',
)
const tree = computed(() => departmentTree(rows.value, q.value, state.value))
const parents = computed(() => departmentOptions(rows.value, editing.value?.id))
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  error.value = ''
  try {
    rows.value = (await getDepartments(auth.accessToken)).items
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '部门加载失败'
  } finally {
    loading.value = false
  }
}
function open(row?: Department, parentId: string | null = null) {
  editing.value = row ?? null
  form.value = row
    ? {
        name: row.name,
        parentId: row.parentId,
        orderNum: row.orderNum,
        leader: row.leader,
        phone: row.phone,
        email: row.email,
        enabled: row.enabled,
      }
    : { ...emptyForm(), parentId }
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || saving.value) return
  if (!form.value.name.trim()) {
    ElMessage.error('请输入部门名称')
    return
  }
  saving.value = true
  try {
    if (editing.value)
      await updateDepartment(auth.accessToken, editing.value.id, {
        ...form.value,
        expectedRevision: editing.value.revision,
      })
    else await createDepartment(auth.accessToken, form.value)
    dialog.value = false
    await load()
    ElMessage.success('部门已保存')
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
async function remove(row: Department) {
  try {
    await ElMessageBox.confirm(
      `确认删除部门“${row.name}”？含下级或成员的部门不能删除。`,
      '删除部门',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  if (!auth.accessToken || saving.value) return
  saving.value = true
  try {
    await deleteDepartment(auth.accessToken, row.id, row.revision)
    await load()
    ElMessage.success('部门已删除')
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
  state.value = ''
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">ORGANIZATION</p>
      <h1>部门管理</h1>
      <p class="page-description">维护部门层级、负责人和状态，成员归属在管理员账号中分配。</p>
    </div>
    <ElButton
      v-if="canWrite"
      type="primary"
      :disabled="loading || saving || !!error"
      @click="open()"
      >新建部门</ElButton
    >
  </div>
  <section class="panel">
    <div class="organization-toolbar">
      <ElInput
        v-model="q"
        placeholder="搜索部门名称"
        aria-label="搜索部门名称"
        clearable
      /><ElSelect v-model="state" placeholder="全部状态" aria-label="状态筛选" clearable
        ><ElOption label="启用" value="true" /><ElOption label="停用" value="false" /></ElSelect
      ><ElButton @click="resetFilters">重置</ElButton
      ><ElButton @click="expanded = !expanded">{{ expanded ? '收起全部' : '展开全部' }}</ElButton
      ><ElButton :loading="loading" @click="load">刷新</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <ElTable
      v-else-if="rows.length"
      :key="String(expanded)"
      :data="tree"
      row-key="id"
      :default-expand-all="expanded"
      empty-text="没有匹配部门"
      stripe
      style="width: 100%"
      ><ElTableColumn prop="name" label="部门" min-width="200" /><ElTableColumn
        prop="orderNum"
        label="排序"
        width="80"
      /><ElTableColumn prop="leader" label="负责人" min-width="100" /><ElTableColumn
        prop="phone"
        label="电话"
        min-width="140"
      /><ElTableColumn prop="email" label="邮箱" min-width="180" /><ElTableColumn
        label="状态"
        width="90"
        ><template #default="{ row }"
          ><ElTag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? '启用' : '停用'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn v-if="canWrite" label="操作" width="190" fixed="right"
        ><template #default="{ row }"
          ><ElButton link type="primary" :disabled="saving" @click="open(row as Department)"
            >编辑</ElButton
          ><ElButton
            link
            type="primary"
            :disabled="!row.enabled || saving"
            @click="open(undefined, row.id)"
            >新增下级</ElButton
          ><ElButton link type="danger" :disabled="saving" @click="remove(row as Department)"
            >删除</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    >
    <ElEmpty v-else :description="loading ? '正在加载部门…' : '暂无部门'" />
  </section>
  <ElDialog
    v-model="dialog"
    :title="editing ? '编辑部门' : '新建部门'"
    width="min(600px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="save"
      ><ElFormItem label="上级部门"
        ><ElSelect
          v-model="form.parentId"
          clearable
          filterable
          placeholder="根部门"
          @clear="form.parentId = null"
          ><ElOption
            v-for="item in parents"
            :key="item.id"
            :label="item.name"
            :value="item.id" /></ElSelect></ElFormItem
      ><ElFormItem label="部门名称" required
        ><ElInput v-model="form.name" maxlength="50" /></ElFormItem
      ><ElFormItem label="排序"
        ><ElInputNumber v-model="form.orderNum" :min="0" :max="999999" :precision="0" /></ElFormItem
      ><ElFormItem label="负责人"><ElInput v-model="form.leader" maxlength="50" /></ElFormItem
      ><ElFormItem label="电话"><ElInput v-model="form.phone" maxlength="30" /></ElFormItem
      ><ElFormItem label="邮箱"><ElInput v-model="form.email" maxlength="254" /></ElFormItem
      ><ElFormItem label="启用"><ElSwitch v-model="form.enabled" /></ElFormItem
    ></ElForm>
    <template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    >
  </ElDialog>
</template>
<style scoped>
.organization-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.organization-toolbar .el-input {
  width: 240px;
}
.organization-toolbar .el-select {
  width: 130px;
}
</style>
