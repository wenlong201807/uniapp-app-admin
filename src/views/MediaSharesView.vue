<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import {
  getAdminMediaShares,
  revokeAdminMediaShare,
  type AdminMediaShare,
} from '@/services/admin-media-shares'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const rows = ref<AdminMediaShare[]>([])
function search() {
  page.value = 1
  void load()
}
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminMediaShares(auth.accessToken, {
      page: page.value,
      pageSize,
      q: query.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分享记录加载失败')
  } finally {
    loading.value = false
  }
}
async function revoke(row: AdminMediaShare) {
  if (!auth.accessToken || !window.confirm(`撤销分享“${row.originalName}”？`)) return
  try {
    await revokeAdminMediaShare(auth.accessToken, row.id)
    ElMessage.success('分享已撤销')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分享撤销失败')
  }
}
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
onMounted(load)
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SHARE AUDIT</p>
      <h1>媒体分享</h1>
      <p class="page-description">查看短时私密分享的过期、使用次数和撤销状态。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>分享记录</h2>
      <ElInput
        v-model="query"
        clearable
        placeholder="文件名或用户 ID"
        style="max-width: 260px"
        @keyup.enter="search"
      />
    </div>
    <ElTable v-loading="loading" :data="rows" stripe
      ><ElTableColumn prop="originalName" label="媒体" min-width="220" /><ElTableColumn
        prop="ownerId"
        label="用户 ID"
        min-width="280"
      /><ElTableColumn label="状态" width="100"
        ><template #default="scope"
          ><ElTag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">{{
            scope.row.status
          }}</ElTag></template
        ></ElTableColumn
      ><ElTableColumn label="使用次数" width="120"
        ><template #default="scope"
          >{{ scope.row.usedCount }} / {{ scope.row.maxUses }}</template
        ></ElTableColumn
      ><ElTableColumn label="过期时间" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.expiresAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      ><ElTableColumn label="操作" width="110"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :icon="Delete"
            :disabled="scope.row.status !== 'ACTIVE'"
            @click="revoke(scope.row as AdminMediaShare)"
            >撤销</ElButton
          ></template
        ></ElTableColumn
      ></ElTable
    >
    <div class="table-footer">
      <span>共 {{ total }} 条</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
  </section>
</template>
