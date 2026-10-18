<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus'
import { Refresh, Delete } from '@element-plus/icons-vue'
import {
  getAdminBluetoothBindings,
  revokeAdminBluetoothBinding,
  type AdminBluetoothBinding,
} from '@/services/admin-bluetooth-bindings'
import { useAdminAuthStore } from '@/stores/admin-auth'
const auth = useAdminAuthStore()
const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const rows = ref<AdminBluetoothBinding[]>([])
async function load() {
  if (loading.value || !auth.accessToken) return
  loading.value = true
  try {
    const result = await getAdminBluetoothBindings(auth.accessToken, {
      page: page.value,
      pageSize,
      q: query.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '蓝牙关联加载失败')
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
async function remove(row: AdminBluetoothBinding) {
  if (loading.value || !auth.accessToken) return
  try {
    await ElMessageBox.confirm(
      '撤销用户 ' +
        row.owner.email +
        ' 的外设关联“' +
        row.name +
        '”？在线客户端下次检查时会断开；这无法远程关闭手机蓝牙。',
      '撤销外设关联',
      { type: 'warning', confirmButtonText: '撤销', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  loading.value = true
  try {
    await revokeAdminBluetoothBinding(auth.accessToken, row.id)
    ElMessage.success('关联已撤销，已记录审计')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '关联撤销失败')
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
      <p class="eyebrow">BLUETOOTH ASSOCIATIONS</p>
      <h1>蓝牙关联</h1>
      <p class="page-description">
        账号关联尚未验证物理设备身份；连接状态由客户端上报，两分钟后过期为未知。撤销关联不会即时关闭手机蓝牙。
      </p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <section class="panel">
    <div class="section-title">
      <h2>外设关联</h2>
      <div class="toolbar">
        <ElInput
          v-model="query"
          clearable
          placeholder="邮箱、昵称或外设名称"
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
      <ElTableColumn prop="name" label="外设名称" min-width="160" />
      <ElTableColumn prop="platform" label="平台" width="110" />
      <ElTableColumn prop="status" label="关联状态" width="120" /><ElTableColumn
        prop="reportedState"
        label="客户端报告"
        min-width="150"
      />
      <ElTableColumn label="最后报告" min-width="180"
        ><template #default="scope">{{
          scope.row.lastReportedAt
            ? new Date(scope.row.lastReportedAt).toLocaleString('zh-CN')
            : '未报告'
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton
            text
            type="danger"
            :icon="Delete"
            :disabled="loading || scope.row.status === 'REVOKED'"
            @click="remove(scope.row as AdminBluetoothBinding)"
            >撤销</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 条关联</span
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
