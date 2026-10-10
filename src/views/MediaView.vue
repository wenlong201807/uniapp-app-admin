<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElButton,
  ElInput,
  ElMessage,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import {
  getAdminMedia,
  removeAdminMedia,
  type AdminMedia,
  type MediaKind,
} from '@/services/admin-media'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const kind = ref<MediaKind | ''>('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = ref<AdminMedia[]>([])
function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KiB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}
function formatMedia(row: AdminMedia) {
  return row.kind === 'VIDEO' && row.durationSeconds
    ? `${row.width} × ${row.height} · ${Math.ceil(row.durationSeconds)} 秒`
    : `${row.width} × ${row.height}`
}
async function load() {
  if (!auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminMedia(auth.accessToken, {
      page: page.value,
      pageSize: pageSize.value,
      q: query.value,
      kind: kind.value || undefined,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '媒体列表加载失败')
  } finally {
    loading.value = false
  }
}
async function search() {
  page.value = 1
  await load()
}
async function turnPage(direction: 1 | -1) {
  page.value += direction
  await load()
}
async function remove(row: AdminMedia) {
  if (
    !auth.accessToken ||
    !window.confirm(`删除用户“${row.owner.email}”的媒体“${row.originalName}”？此操作不可恢复。`)
  )
    return
  try {
    await removeAdminMedia(auth.accessToken, row.id)
    ElMessage.success('媒体已删除')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '媒体删除失败')
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">MEDIA OPERATIONS</p>
      <h1>媒体管理</h1>
      <p class="page-description">查看私有照片与视频的元数据、归属和存储占用。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">PRIVATE MEDIA</p>
        <h2>上传记录</h2>
      </div>
      <div class="toolbar">
        <ElInput
          v-model="query"
          clearable
          placeholder="用户邮箱、昵称或文件名"
          @keyup.enter="search"
        /><ElSelect v-model="kind" clearable placeholder="全部类型" @change="search"
          ><ElOption label="照片" value="IMAGE" /><ElOption label="视频" value="VIDEO"
        /></ElSelect>
      </div>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ scope.row.owner.displayName }}</strong
          ><br /><span class="muted">{{ scope.row.owner.email }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="文件" min-width="220"
        ><template #default="scope"
          ><strong>{{ scope.row.originalName }}</strong
          ><br /><span class="muted">{{ formatMedia(scope.row as AdminMedia) }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="类型" width="100"
        ><template #default="scope"
          ><ElTag size="small" effect="plain">{{
            scope.row.kind === 'IMAGE' ? '照片' : '视频'
          }}</ElTag></template
        ></ElTableColumn
      >
      <ElTableColumn label="大小" width="110"
        ><template #default="scope">{{ formatSize(scope.row.sizeBytes) }}</template></ElTableColumn
      >
      <ElTableColumn label="上传时间" min-width="180"
        ><template #default="scope">{{
          new Date(scope.row.createdAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton text type="danger" :icon="Delete" @click="remove(scope.row as AdminMedia)"
            >删除</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条媒体</span
      ><ElButton text :disabled="page <= 1" @click="turnPage(-1)">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="turnPage(1)">下一页</ElButton>
    </div>
    <p class="muted privacy-note">
      管理端只显示元数据，不提供默认公开播放链接；删除会同步释放用户存储配额。
    </p>
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
.privacy-note {
  margin-top: 14px;
}
@media (max-width: 760px) {
  .toolbar {
    min-width: 0;
    flex-direction: column;
  }
}
</style>
