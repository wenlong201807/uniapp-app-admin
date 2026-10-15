<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { getSystemMenus, updateSystemMenu, type SystemMenu } from '@/services/admin-system'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { useAdminRoutesStore } from '@/stores/admin-routes'
const auth = useAdminAuthStore(),
  navigation = useAdminRoutesStore()
const rows = ref<SystemMenu[]>([]),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  dialog = ref(false)
const editing = ref<SystemMenu | null>(null)
const form = ref({ title: '', enabled: true, orderNum: 0 })
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  error.value = ''
  try {
    rows.value = (await getSystemMenus(auth.accessToken)).items
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '菜单加载失败'
  } finally {
    loading.value = false
  }
}
function open(row: SystemMenu) {
  editing.value = row
  form.value = { title: row.title, enabled: row.enabled, orderNum: row.orderNum }
  dialog.value = true
}
async function save() {
  if (!auth.accessToken || !editing.value || saving.value) return
  if (!form.value.title.trim()) {
    ElMessage.error('请输入菜单名称')
    return
  }
  saving.value = true
  try {
    await updateSystemMenu(auth.accessToken, {
      path: editing.value.path,
      ...form.value,
      expectedRevision: editing.value.revision,
    })
    navigation.reset()
    await navigation.load(auth.accessToken)
    dialog.value = false
    await load()
    ElMessage.success('菜单已更新')
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : '保存失败')
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SYSTEM MENUS</p>
      <h1>菜单管理</h1>
      <p class="page-description">调整已注册页面的名称、顺序与显示状态。菜单权限由角色授权决定。</p>
    </div>
    <ElButton :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon /><ElTable
      v-else
      :data="rows"
      stripe
      ><ElTableColumn prop="title" label="菜单名称" min-width="140" /><ElTableColumn
        prop="path"
        label="页面路径"
        min-width="230"
      /><ElTableColumn prop="permission" label="所需权限" min-width="260" /><ElTableColumn
        prop="orderNum"
        label="排序"
        width="90"
      /><ElTableColumn label="显示" width="90"
        ><template #default="{ row }"
          ><ElTag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? '显示' : '隐藏'
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="操作" width="80" fixed="right"
        ><template #default="{ row }"
          ><ElButton link type="primary" :disabled="saving" @click="open(row as SystemMenu)"
            >编辑</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    >
  </section>
  <ElDialog
    v-model="dialog"
    title="编辑菜单"
    width="min(520px, 94vw)"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    ><ElForm :model="form" label-position="top" :disabled="saving" @submit.prevent="save"
      ><ElFormItem label="菜单名称" required
        ><ElInput v-model="form.title" maxlength="40" /></ElFormItem
      ><ElFormItem label="排序"
        ><ElInputNumber v-model="form.orderNum" :min="0" :max="999999" :precision="0" /></ElFormItem
      ><ElFormItem label="显示"
        ><ElSwitch
          v-model="form.enabled"
          :disabled="editing?.path === '/system/menus'" /></ElFormItem></ElForm
    ><template #footer
      ><ElButton :disabled="saving" @click="dialog = false">取消</ElButton
      ><ElButton type="primary" :loading="saving" @click="save">保存</ElButton></template
    ></ElDialog
  >
</template>
