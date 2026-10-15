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
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import {
  createAdminMember,
  getAdminMembers,
  getAdminRoles,
  updateAdminMember,
  type AdminMember,
  type AdminRole,
} from '@/services/admin-rbac'
import {
  getDepartments,
  getPositions,
  type Department,
  type Position,
} from '@/services/admin-organization'
const auth = useAdminAuthStore()
const members = ref<AdminMember[]>([]),
  roles = ref<AdminRole[]>([]),
  departments = ref<Department[]>([]),
  positions = ref<Position[]>([])
const error = ref(''),
  loading = ref(false),
  saving = ref(false),
  dialog = ref(false),
  q = ref('')
const editing = ref<AdminMember | null>(null)
const creating = ref(false)
const identity = ref({ email: '', displayName: '', password: '' })
const canCreate = computed(() => canRoles.value && auth.admin?.dataScope === 'ALL')
function openCreate() {
  creating.value = true
  editing.value = null
  identity.value = { email: '', displayName: '', password: '' }
  form.value = { roleId: null, departmentId: null, positionIds: [], active: true }
  dialog.value = true
}
const form = ref({
  roleId: null as string | null,
  departmentId: null as string | null,
  positionIds: [] as string[],
  active: true,
})
const ownPermissions = computed(() => auth.admin?.permissions ?? [])
const canRoles = computed(() => ownPermissions.value.includes('admin:rbac:roles'))
const canDepartments = computed(() =>
  ownPermissions.value.includes('admin:organization:departments'),
)
const canPositions = computed(() => ownPermissions.value.includes('admin:organization:positions'))
const assignableRoles = computed(() =>
  roles.value.filter(
    (row) =>
      row.enabled &&
      (auth.admin?.role?.code === 'SUPER_ADMIN' ||
        (!row.isSystem &&
          row.permissions.every((permission) => ownPermissions.value.includes(permission)))),
  ),
)
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  error.value = ''
  const token = auth.accessToken
  try {
    const [m, r, d, p] = await Promise.all([
      getAdminMembers(token, q.value),
      canRoles.value ? getAdminRoles(token) : Promise.resolve({ items: [] }),
      canDepartments.value ? getDepartments(token) : Promise.resolve({ items: [] }),
      canPositions.value ? getPositions(token) : Promise.resolve({ items: [] }),
    ])
    members.value = m.items
    roles.value = r.items
    departments.value = d.items
    positions.value = p.items
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '管理员加载失败'
  } finally {
    loading.value = false
  }
}
function open(member: AdminMember) {
  creating.value = false
  editing.value = member
  form.value = {
    roleId: member.role?.id ?? null,
    departmentId: member.department?.id ?? null,
    positionIds: member.positions.map((row) => row.id),
    active: member.status === 'ACTIVE',
  }
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || (!editing.value && !creating.value) || saving.value) return
  if (
    creating.value &&
    (!identity.value.email.trim() ||
      !identity.value.displayName.trim() ||
      identity.value.password.length < 8)
  ) {
    ElMessage.error('请输入邮箱、姓名和至少 8 位密码')
    return
  }
  try {
    await ElMessageBox.confirm('保存后此管理员的旧会话将失效，需要重新登录。', '保存账号配置', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  saving.value = true
  try {
    const input = {
      status: form.value.active ? 'ACTIVE' : 'DISABLED',
      ...(canRoles.value ? { roleId: form.value.roleId } : {}),
      ...(canDepartments.value ? { departmentId: form.value.departmentId } : {}),
      ...(canPositions.value ? { positionIds: form.value.positionIds } : {}),
    }
    if (creating.value)
      await createAdminMember(auth.accessToken, {
        ...identity.value,
        ...input,
        status: form.value.active ? 'ACTIVE' : 'DISABLED',
      })
    else if (editing.value)
      await updateAdminMember(auth.accessToken, editing.value.id, {
        ...input,
        status: form.value.active ? 'ACTIVE' : 'DISABLED',
      })
    identity.value.password = ''
    dialog.value = false
    if (editing.value?.id === auth.admin?.id) {
      ElMessage.success('账号已更新，请重新登录')
      auth.clear()
      window.location.assign('/login')
      return
    }
    await load()
    ElMessage.success('管理员已更新')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
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
      <p class="eyebrow">ADMINISTRATORS</p>
      <h1>管理员账号</h1>
      <p class="page-description">
        分配角色、部门和岗位，管理账号启停。至少保留一个启用中的超级管理员。
      </p>
    </div>
    <ElButton
      v-if="canCreate"
      type="primary"
      :disabled="saving || loading || !!error"
      @click="openCreate"
      >新建管理员</ElButton
    >
  </div>
  <section class="panel">
    <div class="admin-toolbar">
      <ElInput
        v-model="q"
        placeholder="按姓名或邮箱搜索"
        aria-label="按姓名或邮箱搜索"
        clearable
        @keyup.enter="load"
      /><ElButton :loading="loading" @click="load">搜索</ElButton
      ><ElButton @click="resetFilters">重置</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon /><ElTable
      v-else-if="members.length"
      :data="members"
      stripe
      ><ElTableColumn prop="displayName" label="姓名" min-width="120" /><ElTableColumn
        prop="email"
        label="邮箱"
        min-width="200"
      /><ElTableColumn label="角色" min-width="140"
        ><template #default="{ row }">{{ row.role?.name || '未分配' }}</template></ElTableColumn
      ><ElTableColumn label="部门" min-width="120"
        ><template #default="{ row }">{{
          row.department?.name || '未分配'
        }}</template></ElTableColumn
      ><ElTableColumn label="岗位" min-width="140"
        ><template #default="{ row }">{{
          row.positions.map((item: Position) => item.name).join('、') || '未分配'
        }}</template></ElTableColumn
      ><ElTableColumn label="状态" width="90"
        ><template #default="{ row }"
          ><ElTag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{
            row.status === 'ACTIVE' ? '启用' : '停用'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="操作" width="80" fixed="right"
        ><template #default="{ row }"
          ><ElButton
            link
            type="primary"
            :disabled="
              saving ||
              (row.role?.code === 'SUPER_ADMIN' && auth.admin?.role?.code !== 'SUPER_ADMIN')
            "
            @click="open(row as AdminMember)"
            >编辑</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    ><ElEmpty v-else :description="loading ? '正在加载管理员…' : '暂无管理员'" />
  </section>
  <ElDialog
    v-model="dialog"
    :title="creating ? '新建管理员' : '编辑管理员'"
    width="min(560px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @closed="identity.password = ''"
    ><p v-if="!creating">{{ editing?.displayName }} · {{ editing?.email }}</p>
    <ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="save"
      ><ElFormItem v-if="creating" label="邮箱" required
        ><ElInput v-model="identity.email" type="email" maxlength="254" autocomplete="off"
      /></ElFormItem>
      <ElFormItem v-if="creating" label="姓名" required
        ><ElInput v-model="identity.displayName" maxlength="50"
      /></ElFormItem>
      <ElFormItem v-if="creating" label="初始密码" required
        ><ElInput
          v-model="identity.password"
          type="password"
          show-password
          minlength="8"
          maxlength="128"
          autocomplete="new-password"
      /></ElFormItem>
      <ElFormItem v-if="canRoles" label="角色"
        ><ElSelect v-model="form.roleId" clearable placeholder="未分配" @clear="form.roleId = null"
          ><ElOption
            v-for="row in assignableRoles"
            :key="row.id"
            :label="row.name"
            :value="row.id" /></ElSelect></ElFormItem
      ><ElFormItem v-if="canDepartments" label="部门"
        ><ElSelect
          v-model="form.departmentId"
          clearable
          filterable
          placeholder="未分配"
          @clear="form.departmentId = null"
          ><ElOption
            v-for="row in departments"
            :key="row.id"
            :label="row.name"
            :value="row.id"
            :disabled="!row.enabled" /></ElSelect></ElFormItem
      ><ElFormItem v-if="canPositions" label="岗位"
        ><ElSelect v-model="form.positionIds" multiple clearable filterable
          ><ElOption
            v-for="row in positions"
            :key="row.id"
            :label="row.name"
            :value="row.id"
            :disabled="!row.enabled" /></ElSelect></ElFormItem
      ><ElFormItem label="启用"
        ><ElSwitch
          v-model="form.active"
          :disabled="editing?.id === auth.admin?.id" /></ElFormItem></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    ></ElDialog
  >
</template>
<style scoped>
.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.admin-toolbar .el-input {
  width: min(300px, 100%);
}
</style>
