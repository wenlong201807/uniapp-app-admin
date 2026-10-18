<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElButton,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import { usePagedList } from '@/composables/usePagedList'
import {
  getAdminMediaShares,
  revokeAdminMediaShare,
  type AdminMediaShare,
} from '@/services/admin-media-shares'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const query = ref('')
const { rows, total, loading, canPrev, canNext, load, search, prev, next } = usePagedList(
  async (page: number, pageSize: number) => {
    const token = auth.accessToken
    if (!token) throw new Error('未登录')
    return getAdminMediaShares(token, { page, pageSize, q: query.value })
  },
  {
    enabled: () => Boolean(auth.accessToken),
    onError: (error) => {
      ElMessage.error(error instanceof Error ? error.message : '分享记录加载失败')
    },
  },
)
async function revoke(row: AdminMediaShare) {
  if (!auth.accessToken) return
  try {
    await ElMessageBox.confirm(`撤销分享“${row.originalName}”？`, '撤销分享', {
      type: 'warning',
      confirmButtonText: '撤销',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await revokeAdminMediaShare(auth.accessToken, row.id)
    ElMessage.success('分享已撤销')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分享撤销失败')
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
      ><ElButton text :disabled="!canPrev" @click="prev">上一页</ElButton
      ><ElButton text :disabled="!canNext" @click="next">下一页</ElButton>
    </div>
  </section>
</template>
