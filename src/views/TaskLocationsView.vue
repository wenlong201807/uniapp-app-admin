<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus'
import { Refresh, Delete } from '@element-plus/icons-vue'
import {
  getAdminTaskLocations,
  deleteAdminTaskLocation,
  type AdminTaskLocation,
} from '@/services/admin-task-locations'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const rows = ref<AdminTaskLocation[]>([])
async function load() {
  if (loading.value || !auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminTaskLocations(auth.accessToken, {
      page: page.value,
      pageSize,
      q: query.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '位置记录加载失败')
  } finally {
    loading.value = false
  }
}
function search() {
  if (loading.value) return
  page.value = 1
  void load()
}
function movePage(delta: number) {
  if (loading.value) return
  page.value += delta
  void load()
}
async function remove(row: AdminTaskLocation) {
  if (loading.value || !auth.accessToken) return
  try {
    await ElMessageBox.confirm(
      '删除用户 ' + row.owner.email + ' 的地点“' + row.label + '”？任务内容会保留。',
      '删除地点',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  loading.value = true
  try {
    await deleteAdminTaskLocation(auth.accessToken, row.id)
    ElMessage.success('地点已删除，已记录管理员操作审计')
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '地点删除失败')
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
      <p class="eyebrow">LOCATION PRIVACY</p>
      <h1>位置隐私</h1>
      <p class="page-description">
        用户主动为任务添加的地点，仅保存约 1
        公里网格。未添加地点不代表用户拒绝授权；权限拒绝请查看安全审计。
      </p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>已保存的地点</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          clearable
          placeholder="邮箱、任务或地点"
          @keyup.enter="search"
        /><ElButton :disabled="loading" @click="search">查询</ElButton>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ scope.row.owner.displayName }}</strong
          ><br /><span class="muted">{{ scope.row.owner.email }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="taskTitle" label="任务" min-width="160" />
      <ElTableColumn prop="label" label="地点名称" min-width="160" />
      <ElTableColumn prop="grid" label="模糊网格" min-width="200" />
      <ElTableColumn label="最近保存" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.updatedAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :icon="Delete"
            :disabled="loading"
            @click="remove(scope.row as AdminTaskLocation)"
            >删除</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条地点</span
      ><ElButton text :disabled="loading || page <= 1" @click="movePage(-1)">上一页</ElButton
      ><ElButton text :disabled="loading || page * pageSize >= total" @click="movePage(1)"
        >下一页</ElButton
      >
    </div>
  </section>
</template>
<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
}
</style>
