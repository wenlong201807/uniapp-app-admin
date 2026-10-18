<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSelect,
  ElOption,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import {
  createAdminRole,
  deleteAdminRole,
  getAdminPermissions,
  getAdminRoles,
  updateAdminRole,
  type AdminRole,
  type DataScope,
} from '@/services/admin-rbac'
import { getDepartments, type Department } from '@/services/admin-organization'
const auth = useAdminAuthStore()
const departments = ref<Department[]>([])
const scopeOptions = [
  { value: 'SELF', label: '仅本人' },
  { value: 'DEPARTMENT', label: '本部门' },
  { value: 'DEPARTMENT_AND_CHILDREN', label: '本部门及下级' },
  { value: 'CUSTOM_DEPARTMENTS', label: '自定义部门' },
  { value: 'ALL', label: '全部' },
]
const roles = ref<AdminRole[]>([]),
  permissions = ref<Array<{ code: string; name: string }>>([])
const dialog = ref(false),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  q = ref('')
const editing = ref<AdminRole | null>(null)
const form = ref({
  code: '',
  name: '',
  description: '',
  permissions: [] as string[],
  enabled: true,
  dataScope: 'SELF' as DataScope,
  departmentIds: [] as string[],
})
const granted = computed(() =>
  permissions.value.filter((item) => auth.admin?.permissions?.includes(item.code)),
)
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  error.value = ''
  try {
    const [r, p] = await Promise.all([
      getAdminRoles(auth.accessToken, q.value),
      getAdminPermissions(auth.accessToken),
    ])
    roles.value = r.items
    permissions.value = p
    if (auth.admin?.role?.code === 'SUPER_ADMIN')
      departments.value = (await getDepartments(auth.accessToken)).items
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '角色加载失败'
  } finally {
    loading.value = false
  }
}
function openRole(role?: AdminRole) {
  editing.value = role || null
  form.value = role
    ? {
        code: role.code,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
        enabled: role.enabled,
        dataScope: role.dataScope,
        departmentIds: [...role.departmentIds],
      }
    : {
        code: '',
        name: '',
        description: '',
        permissions: [],
        enabled: true,
        dataScope: 'SELF',
        departmentIds: [],
      }
  dialog.value = true
}
async function saveRole() {
  if (!auth.accessToken || saving.value) return
  if (
    !form.value.name.trim() ||
    !/^[A-Z][A-Z0-9_]{0,63}$/.test(form.value.code.trim().toUpperCase())
  ) {
    ElMessage.error('请输入名称和有效角色编码')
    return
  }
  saving.value = true
  try {
    if (editing.value)
      await updateAdminRole(auth.accessToken, editing.value.id, {
        name: form.value.name,
        description: form.value.description,
        permissions: form.value.permissions,
        enabled: form.value.enabled,
        dataScope: form.value.dataScope,
        departmentIds: form.value.departmentIds,
      })
    else
      await createAdminRole(auth.accessToken, {
        code: form.value.code.trim(),
        name: form.value.name.trim(),
        description: form.value.description,
        permissions: form.value.permissions,
        dataScope: form.value.dataScope,
        departmentIds: form.value.departmentIds,
      })
    dialog.value = false
    await load()
    ElMessage.success('角色已保存，相关管理员需要重新登录')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
  } finally {
    saving.value = false
  }
}
async function remove(role: AdminRole) {
  try {
    await ElMessageBox.confirm(
      `确认删除角色“${role.name}”？仍有管理员的角色不能删除。`,
      '删除角色',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  if (!auth.accessToken || saving.value) return
  saving.value = true
  try {
    await deleteAdminRole(auth.accessToken, role.id)
    await load()
    ElMessage.success('角色已删除')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '删除失败')
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
      <p class="eyebrow">ACCESS CONTROL</p>
      <h1>角色与权限</h1>
      <p class="page-description">配置角色权限和启用状态。管理员账号、部门及岗位在各自页面维护。</p>
    </div>
    <ElButton type="primary" :disabled="loading || saving || !!error" @click="openRole()"
      >新建角色</ElButton
    >
  </div>
  <section class="panel">
    <div class="role-toolbar">
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
      v-else-if="roles.length"
      :data="roles"
      stripe
      ><ElTableColumn prop="name" label="名称" min-width="160" /><ElTableColumn
        prop="code"
        label="编码"
        min-width="180"
      /><ElTableColumn label="权限" width="100"
        ><template #default="{ row }">{{ row.permissions.length }} 项</template></ElTableColumn
      ><ElTableColumn label="状态" width="100"
        ><template #default="{ row }"
          ><ElTag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? '启用' : '停用'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="操作" width="150"
        ><template #default="{ row }"
          ><span v-if="row.isSystem" class="muted">系统内置</span
          ><template v-else
            ><ElButton
              link
              type="primary"
              :disabled="
                saving || (row.dataScope !== 'SELF' && auth.admin?.role?.code !== 'SUPER_ADMIN')
              "
              @click="openRole(row as AdminRole)"
              >编辑</ElButton
            ><ElButton link type="danger" :disabled="saving" @click="remove(row as AdminRole)"
              >删除</ElButton
            ></template
          ></template
        ></ElTableColumn
      ></ElTable
    ><ElEmpty v-else :description="loading ? '正在加载角色…' : '暂无角色'" />
  </section>
  <ElDialog
    v-model="dialog"
    :title="editing ? '编辑角色' : '新建角色'"
    width="min(680px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    ><ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="saveRole"
      ><ElFormItem label="角色编码" required
        ><ElInput v-model="form.code" :disabled="!!editing" maxlength="64" /></ElFormItem
      ><ElFormItem label="角色名称" required
        ><ElInput v-model="form.name" maxlength="50" /></ElFormItem
      ><ElFormItem label="描述"><ElInput v-model="form.description" maxlength="200" /></ElFormItem
      ><ElFormItem v-if="editing" label="启用"><ElSwitch v-model="form.enabled" /></ElFormItem
      ><ElFormItem v-if="auth.admin?.role?.code === 'SUPER_ADMIN'" label="数据范围">
        <ElSelect v-model="form.dataScope"
          ><ElOption
            v-for="item in scopeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
        /></ElSelect>
      </ElFormItem>
      <ElFormItem v-if="form.dataScope === 'CUSTOM_DEPARTMENTS'" label="自定义部门">
        <ElSelect v-model="form.departmentIds" multiple filterable
          ><ElOption
            v-for="item in departments"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="!item.enabled"
        /></ElSelect>
      </ElFormItem>
      <ElFormItem label="权限"
        ><ElCheckboxGroup v-model="form.permissions"
          ><ElCheckbox v-for="item in granted" :key="item.code" :value="item.code">{{
            item.name
          }}</ElCheckbox></ElCheckboxGroup
        ></ElFormItem
      ></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="saveRole">保存</ElButton></template
    ></ElDialog
  >
</template>
<style scoped>
.role-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.role-toolbar .el-input {
  width: min(300px, 100%);
}
</style>
