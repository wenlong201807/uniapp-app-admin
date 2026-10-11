<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElTable, ElTableColumn } from 'element-plus'
import {
  getAdminTaskInvitations,
  revokeAdminTaskInvitation,
  type AdminTaskInvitation,
} from '@/services/admin-task-invitations'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false),
  query = ref(''),
  page = ref(1),
  total = ref(0)
const rows = ref<AdminTaskInvitation[]>([])
async function load() {
  if (loading.value || !auth.accessToken) return
  const token = auth.accessToken
  loading.value = true
  try {
    const result = await getAdminTaskInvitations(token, { page: page.value, q: query.value })
    if (auth.accessToken !== token) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '邀请加载失败')
  } finally {
    loading.value = false
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
async function revoke(row: AdminTaskInvitation) {
  if (
    loading.value ||
    !auth.accessToken ||
    !window.confirm(`撤销 ${row.owner.email} 创建的任务邀请？已接受的任务副本不受影响。`)
  )
    return
  loading.value = true
  try {
    await revokeAdminTaskInvitation(auth.accessToken, row.id)
    ElMessage.success('邀请已撤销并审计')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '撤销失败')
  } finally {
    loading.value = false
  }
  await load()
}
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">TASK INVITATIONS</p>
      <h1>任务邀请</h1>
      <p class="page-description">
        查看邀请创建、过期、接受与撤销状态。生成代码不代表已发送；不展示收件邮箱、通讯录或邀请代码。日历事件
        ID 仅保存在设备。
      </p>
    </div>
    <ElButton :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>学习任务邀请</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          placeholder="创建人邮箱或任务标题"
          clearable
          @keyup.enter="search"
        /><ElButton :disabled="loading" @click="search">查询</ElButton>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="创建人" min-width="220"
        ><template #default="scope"
          >{{ scope.row.owner.displayName }}<br /><span class="muted">{{
            scope.row.owner.email
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="taskTitle" label="任务" min-width="180" /><ElTableColumn
        prop="status"
        label="邀请状态"
        width="120"
      />
      <ElTableColumn label="到期" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.expiresAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="接受时间" min-width="180"
        ><template #default="scope">{{
          scope.row.acceptedAt ? new Date(scope.row.acceptedAt).toLocaleString('zh-CN') : '尚未接受'
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="100"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :disabled="loading || ['REVOKED', 'ACCEPTED'].includes(scope.row.status)"
            @click="revoke(scope.row as AdminTaskInvitation)"
            >撤销</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条</span
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
