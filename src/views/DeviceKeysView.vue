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
import { Refresh, Delete } from '@element-plus/icons-vue'
import { usePagedList } from '@/composables/usePagedList'
import {
  getAdminDeviceKeys,
  revokeAdminDeviceKey,
  type AdminDeviceKey,
} from '@/services/admin-device-keys'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()
const query = ref('')
const { rows, total, loading, canPrev, canNext, load, search, prev, next } = usePagedList(
  async (page: number, pageSize: number) => {
    const token = auth.accessToken
    if (!token) throw new Error('未登录')
    return getAdminDeviceKeys(token, { page, pageSize, q: query.value })
  },
  {
    enabled: () => Boolean(auth.accessToken),
    onError: (error) => {
      ElMessage.error(error instanceof Error ? error.message : '设备列表加载失败')
    },
  },
)

const platform = (audience: string) =>
  audience.includes('sslip.io') || audience.includes('localhost') ? '开发环境' : '生产环境'
async function revoke(row: AdminDeviceKey) {
  if (!auth.accessToken) return
  try {
    await ElMessageBox.confirm(
      `撤销 ${row.user.email} 的设备密钥“${row.name}”？该用户的现有登录会话也会失效。`,
      '撤销设备密钥',
      { type: 'warning', confirmButtonText: '撤销', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await revokeAdminDeviceKey(auth.accessToken, row.id)
    ElMessage.success('设备密钥已撤销')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '设备密钥撤销失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">SECURITY DEVICES</p>
      <h1>设备密钥</h1>
      <p class="page-description">查看和撤销用户登记的指纹 / 人脸设备密钥。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">DEVICE KEYS</p>
        <h2>已登记设备</h2>
      </div>
      <ElInput
        v-model="query"
        clearable
        placeholder="邮箱或昵称"
        style="max-width: 260px"
        @keyup.enter="search"
      />
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ scope.row.user.displayName }}</strong
          ><br /><span class="muted">{{ scope.row.user.email }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="name" label="设备名称" min-width="150" />
      <ElTableColumn label="环境" width="110"
        ><template #default="scope"
          ><ElTag size="small" effect="plain">{{ platform(scope.row.audience) }}</ElTag></template
        ></ElTableColumn
      >
      <ElTableColumn label="最近使用" min-width="180"
        ><template #default="scope">{{
          scope.row.lastUsedAt ? new Date(scope.row.lastUsedAt).toLocaleString('zh-CN') : '尚未使用'
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton text type="danger" :icon="Delete" @click="revoke(scope.row as AdminDeviceKey)"
            >撤销</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 个设备密钥</span
      ><ElButton text :disabled="!canPrev" @click="prev">上一页</ElButton
      ><ElButton text :disabled="!canNext" @click="next">下一页</ElButton>
    </div>
  </section>
</template>
