<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElButton,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSelect,
  ElOption,
} from 'element-plus'
import { Refresh, Delete } from '@element-plus/icons-vue'
import {
  getAdminPushDevices,
  revokeAdminPushDevice,
  type AdminPushDevice,
  type PushPlatform,
} from '@/services/admin-push-devices'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const platform = ref<PushPlatform | ''>('')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const rows = ref<AdminPushDevice[]>([])
function previousPage() {
  if (page.value > 1) {
    page.value -= 1
    void load()
  }
}
function nextPage() {
  if (page.value * pageSize < total.value) {
    page.value += 1
    void load()
  }
}
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminPushDevices(auth.accessToken, {
      page: page.value,
      pageSize,
      q: query.value,
      platform: platform.value || undefined,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '推送设备加载失败')
  } finally {
    loading.value = false
  }
}
async function revoke(row: AdminPushDevice) {
  if (
    !auth.accessToken ||
    !window.confirm(`撤销 ${row.user.email} 的推送设备？该设备将停止接收通知。`)
  )
    return
  try {
    await revokeAdminPushDevice(auth.accessToken, row.id)
    ElMessage.success('推送设备已撤销')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '推送设备撤销失败')
  }
}
function search() {
  page.value = 1
  void load()
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">PUSH OPERATIONS</p>
      <h1>推送设备</h1>
      <p class="page-description">
        查看各平台设备 Token 的状态和最近活跃时间。Token 仅显示脱敏值。
      </p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>设备 Token</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          clearable
          placeholder="邮箱或昵称"
          @keyup.enter="search"
        /><ElSelect v-model="platform" clearable placeholder="全部平台" @change="search"
          ><ElOption label="iOS" value="IOS" /><ElOption label="Android" value="ANDROID" /><ElOption
            label="鸿蒙"
            value="HARMONY" /><ElOption label="Web" value="WEB"
        /></ElSelect>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe
      ><ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ scope.row.user.displayName }}</strong
          ><br /><span class="muted">{{ scope.row.user.email }}</span></template
        ></ElTableColumn
      ><ElTableColumn label="平台" width="110"
        ><template #default="scope"
          ><ElTag size="small" effect="plain">{{ scope.row.platform }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn prop="tokenMasked" label="Token" min-width="180" /><ElTableColumn
        prop="appVersion"
        label="版本"
        width="100"
      /><ElTableColumn prop="status" label="状态" width="100" /><ElTableColumn
        label="最近活跃"
        min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.lastSeenAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      ><ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :icon="Delete"
            :disabled="scope.row.status !== 'ACTIVE'"
            @click="revoke(scope.row as AdminPushDevice)"
            >撤销</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    >
    <div class="table-footer">
      <span>共 {{ total }} 个设备</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
  </section>
</template>
<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  min-width: min(520px, 60vw);
}
.toolbar .el-select {
  width: 130px;
}
@media (max-width: 760px) {
  .toolbar {
    min-width: 0;
    flex-direction: column;
  }
}
</style>
