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
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { getDepartments, type Department } from '@/services/admin-organization'
import { getSystemUsers, updateSystemUser, type SystemUser } from '@/services/admin-system'
const auth = useAdminAuthStore()
const rows = ref<SystemUser[]>([]),
  departments = ref<Department[]>([]),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  dialog = ref(false),
  q = ref(''),
  departmentId = ref(''),
  selectedDepartment = ref<string | null>(null),
  page = ref(1),
  total = ref(0)
const editing = ref<SystemUser | null>(null)
const canWrite = computed(
  () => auth.admin?.permissions.includes('admin:system:users:write') ?? false,
)
const canDepartments = computed(
  () => auth.admin?.permissions.includes('admin:organization:departments') ?? false,
)
let revision = 0
async function load() {
  if (!auth.accessToken) return
  const current = ++revision
  loading.value = true
  error.value = ''
  try {
    const result = await getSystemUsers(auth.accessToken, {
      q: q.value,
      departmentId: departmentId.value,
      page: page.value,
    })
    if (current === revision) {
      rows.value = result.items
      total.value = result.total
    }
  } catch (cause) {
    if (current === revision) error.value = cause instanceof Error ? cause.message : '用户加载失败'
  } finally {
    if (current === revision) loading.value = false
  }
}
function search() {
  page.value = 1
  void load()
}
function open(row: SystemUser) {
  editing.value = row
  selectedDepartment.value = row.department?.id ?? null
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || !editing.value || saving.value) return
  saving.value = true
  try {
    await updateSystemUser(auth.accessToken, editing.value.id, {
      departmentId: selectedDepartment.value,
    })
    dialog.value = false
    await load()
    ElMessage.success('部门已更新')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
  } finally {
    saving.value = false
  }
}
async function revoke(row: SystemUser) {
  try {
    await ElMessageBox.confirm(
      `确认撤销“${row.displayName}”的全部会话？用户需要重新登录。`,
      '撤销用户会话',
      { type: 'warning', confirmButtonText: '撤销', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  if (!auth.accessToken || saving.value) return
  saving.value = true
  try {
    await updateSystemUser(auth.accessToken, row.id, { revokeSessions: true })
    ElMessage.success('会话已撤销')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '操作失败')
  } finally {
    saving.value = false
  }
}
onMounted(async () => {
  await load()
  if (auth.accessToken && canDepartments.value) {
    try {
      departments.value = (await getDepartments(auth.accessToken)).items
    } catch {
      ElMessage.warning('部门选项加载失败，请刷新重试')
    }
  }
})
function resetFilters() {
  q.value = ''
  departmentId.value = ''
  search()
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">APPLICATION USERS</p>
      <h1>用户管理</h1>
      <p class="page-description">
        查询应用账号，分配部门或撤销会话。任务与媒体继续按账号归属隔离。
      </p>
    </div>
  </div>
  <section class="panel">
    <div class="users-toolbar">
      <ElInput
        v-model="q"
        placeholder="按姓名或邮箱搜索"
        aria-label="按姓名或邮箱搜索"
        clearable
        @keyup.enter="search"
      /><ElSelect
        v-if="canDepartments"
        v-model="departmentId"
        clearable
        filterable
        placeholder="全部部门"
        aria-label="按部门筛选"
        ><ElOption
          v-for="row in departments"
          :key="row.id"
          :value="row.id"
          :label="row.name" /></ElSelect
      ><ElButton :loading="loading" @click="search">搜索</ElButton
      ><ElButton @click="resetFilters">重置</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon /><ElTable
      v-else-if="rows.length"
      :data="rows"
      stripe
      ><ElTableColumn prop="displayName" label="姓名" min-width="120" /><ElTableColumn
        prop="email"
        label="邮箱"
        min-width="220"
      /><ElTableColumn label="部门" min-width="140"
        ><template #default="{ row }">{{
          row.department?.name || '未分配'
        }}</template></ElTableColumn
      ><ElTableColumn label="邮箱验证" width="100"
        ><template #default="{ row }">{{
          row.emailVerifiedAt ? '已验证' : '未验证'
        }}</template></ElTableColumn
      ><ElTableColumn label="注册时间" min-width="180"
        ><template #default="{ row }">{{
          new Date(row.createdAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      ><ElTableColumn v-if="canWrite" label="操作" width="180" fixed="right"
        ><template #default="{ row }"
          ><ElButton
            v-if="canDepartments"
            link
            type="primary"
            :disabled="saving"
            @click="open(row as SystemUser)"
            >分配部门</ElButton
          ><ElButton link type="danger" :disabled="saving" @click="revoke(row as SystemUser)"
            >撤销会话</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    ><ElEmpty v-else :description="loading ? '正在加载用户…' : '暂无用户'" /><ElPagination
      v-model:current-page="page"
      :total="total"
      :page-size="20"
      layout="prev, pager, next, total"
      @current-change="load"
    />
  </section>
  <ElDialog
    v-model="dialog"
    title="分配部门"
    width="min(500px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    ><ElForm label-position="top"
      ><ElFormItem :label="editing?.displayName"
        ><ElSelect
          v-model="selectedDepartment"
          clearable
          filterable
          :disabled="saving"
          placeholder="未分配"
          @clear="selectedDepartment = null"
          ><ElOption
            v-for="row in departments"
            :key="row.id"
            :value="row.id"
            :label="row.name"
            :disabled="!row.enabled" /></ElSelect></ElFormItem></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    ></ElDialog
  >
</template>
<style scoped>
.users-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.users-toolbar .el-input {
  width: min(260px, 100%);
}
.users-toolbar .el-select {
  width: 180px;
}
</style>
