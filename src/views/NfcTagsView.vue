<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElTable, ElTableColumn } from 'element-plus'
import { getAdminNfcTags, revokeAdminNfcTag, type AdminNfcTag } from '@/services/admin-nfc-tags'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false),
  query = ref(''),
  page = ref(1),
  total = ref(0)
const rows = ref<AdminNfcTag[]>([])
async function load() {
  if (loading.value || !auth.accessToken) return
  const token = auth.accessToken
  loading.value = true
  try {
    const result = await getAdminNfcTags(token, { page: page.value, q: query.value })
    if (auth.accessToken !== token) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'NFC 标签加载失败')
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
async function revoke(row: AdminNfcTag) {
  if (
    loading.value ||
    !auth.accessToken ||
    !window.confirm(`撤销 ${row.owner.email} 的 NFC 入口“${row.label}”？标签文本将失效，任务保留。`)
  )
    return
  loading.value = true
  try {
    await revokeAdminNfcTag(auth.accessToken, row.id)
    ElMessage.success('入口已撤销，已记录审计')
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
      <p class="eyebrow">NFC TASK ENTRIES</p>
      <h1>NFC 标签</h1>
      <p class="page-description">
        管理任务入口与撤销状态。签名文本不在列表展示；读取仅允许所属用户，不验证实体标签真伪。
      </p>
    </div>
    <ElButton :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>任务入口</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          placeholder="邮箱、标签名或任务标题"
          clearable
          @keyup.enter="search"
        /><ElButton :disabled="loading" @click="search">查询</ElButton>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          >{{ scope.row.owner.displayName }}<br /><span class="muted">{{
            scope.row.owner.email
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="label" label="标签名称" min-width="150" /><ElTableColumn
        prop="taskTitle"
        label="任务"
        min-width="180"
      /><ElTableColumn prop="status" label="状态" width="110" /><ElTableColumn
        prop="version"
        label="版本"
        width="90"
      />
      <ElTableColumn label="到期时间" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.expiresAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="100"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :disabled="loading || scope.row.status === 'REVOKED'"
            @click="revoke(scope.row as AdminNfcTag)"
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
