<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import {
  createAdminAiModel,
  createAdminAiProvider,
  getAdminAiProviders,
  removeAdminAiModel,
  removeAdminAiProvider,
  updateAdminAiModel,
  updateAdminAiProvider,
  type AdminAiModel,
  type AdminAiProvider,
} from '@/services/admin-ai'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()
const loading = ref(false)
const rows = ref<AdminAiProvider[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
let revision = 0

function toastError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback)
}

async function load() {
  if (!auth.accessToken) return
  loading.value = true
  const current = ++revision
  const token = auth.accessToken
  try {
    const result = await getAdminAiProviders(token, {
      page: page.value,
      pageSize: pageSize.value,
    })
    if (current !== revision || token !== auth.accessToken) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    toastError(error, '供应商列表加载失败')
  } finally {
    if (current === revision) loading.value = false
  }
}

async function previousPage() {
  page.value -= 1
  await load()
}

async function nextPage() {
  page.value += 1
  await load()
}

const providerDialog = ref(false)
const providerSaving = ref(false)
const editingProviderId = ref<string | null>(null)
const providerForm = reactive({
  kind: 'GLM' as 'GPT' | 'GLM',
  name: '',
  baseUrl: '',
  apiKey: '',
  enabled: true,
})

function openProviderCreate() {
  editingProviderId.value = null
  providerForm.kind = 'GLM'
  providerForm.name = ''
  providerForm.baseUrl = ''
  providerForm.apiKey = ''
  providerForm.enabled = true
  providerDialog.value = true
}

function openProviderEdit(row: AdminAiProvider) {
  editingProviderId.value = row.id
  providerForm.kind = row.kind
  providerForm.name = row.name
  providerForm.baseUrl = row.baseUrl
  providerForm.apiKey = ''
  providerForm.enabled = row.enabled
  providerDialog.value = true
}

async function submitProvider() {
  if (!auth.accessToken || providerSaving.value) return
  if (!providerForm.name.trim() || !providerForm.baseUrl.trim()) {
    ElMessage.warning('请完整填写供应商名称与 baseUrl')
    return
  }
  if (!providerForm.baseUrl.trim().startsWith('https://')) {
    ElMessage.warning('baseUrl 必须是 HTTPS 地址')
    return
  }
  const apiKey = providerForm.apiKey.trim()
  if (!editingProviderId.value && !apiKey) {
    ElMessage.warning('新建供应商必须填写 API Key')
    return
  }
  if (apiKey && apiKey.length < 8) {
    ElMessage.warning('API Key 至少 8 位')
    return
  }
  providerSaving.value = true
  try {
    if (editingProviderId.value) {
      const body: { name: string; baseUrl: string; enabled: boolean; apiKey?: string } = {
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        enabled: providerForm.enabled,
      }
      if (apiKey) body.apiKey = apiKey
      await updateAdminAiProvider(auth.accessToken, editingProviderId.value, body)
      ElMessage.success('供应商已更新')
    } else {
      await createAdminAiProvider(auth.accessToken, {
        kind: providerForm.kind,
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        apiKey,
        enabled: providerForm.enabled,
      })
      ElMessage.success('供应商已创建')
    }
    providerDialog.value = false
    await load()
  } catch (error) {
    toastError(error, '供应商保存失败')
  } finally {
    providerSaving.value = false
  }
}

async function removeProvider(row: AdminAiProvider) {
  if (
    !auth.accessToken ||
    !window.confirm(`删除供应商“${row.name}”？其下 ${row.models.length} 个模型配置将一并删除。`)
  )
    return
  try {
    await removeAdminAiProvider(auth.accessToken, row.id)
    ElMessage.success('供应商已删除')
    await load()
  } catch (error) {
    toastError(error, '供应商删除失败')
  }
}

async function toggleProvider(row: AdminAiProvider) {
  if (!auth.accessToken) return
  try {
    await updateAdminAiProvider(auth.accessToken, row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '供应商已启用' : '供应商已停用')
    await load()
  } catch (error) {
    row.enabled = !row.enabled
    toastError(error, '供应商状态更新失败')
  }
}

const modelDialog = ref(false)
const modelSaving = ref(false)
const modelProvider = ref<AdminAiProvider | null>(null)
const modelForm = reactive({
  model: '',
  displayName: '',
  supportsReasoning: false,
  enabled: true,
})

function openModelCreate(provider: AdminAiProvider) {
  modelProvider.value = provider
  modelForm.model = ''
  modelForm.displayName = ''
  modelForm.supportsReasoning = false
  modelForm.enabled = true
  modelDialog.value = true
}

async function submitModel() {
  if (!auth.accessToken || !modelProvider.value || modelSaving.value) return
  if (!modelForm.model.trim() || !modelForm.displayName.trim()) {
    ElMessage.warning('请填写模型标识与显示名称')
    return
  }
  modelSaving.value = true
  try {
    await createAdminAiModel(auth.accessToken, modelProvider.value.id, {
      model: modelForm.model.trim(),
      displayName: modelForm.displayName.trim(),
      supportsReasoning: modelForm.supportsReasoning,
      enabled: modelForm.enabled,
    })
    ElMessage.success('模型已创建')
    modelDialog.value = false
    await load()
  } catch (error) {
    toastError(error, '模型创建失败')
  } finally {
    modelSaving.value = false
  }
}

async function toggleModelReasoning(row: AdminAiModel) {
  if (!auth.accessToken) return
  try {
    await updateAdminAiModel(auth.accessToken, row.id, {
      supportsReasoning: row.supportsReasoning,
    })
    ElMessage.success('模型配置已更新')
    await load()
  } catch (error) {
    row.supportsReasoning = !row.supportsReasoning
    toastError(error, '模型配置更新失败')
  }
}

async function toggleModelEnabled(row: AdminAiModel) {
  if (!auth.accessToken) return
  try {
    await updateAdminAiModel(auth.accessToken, row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '模型已启用' : '模型已停用')
    await load()
  } catch (error) {
    row.enabled = !row.enabled
    toastError(error, '模型状态更新失败')
  }
}

async function setDefaultModel(row: AdminAiModel) {
  if (!auth.accessToken) return
  try {
    await updateAdminAiModel(auth.accessToken, row.id, { isDefault: true })
    ElMessage.success('默认模型已切换')
    await load()
  } catch (error) {
    toastError(error, '默认模型设置失败')
  }
}

async function removeModel(row: AdminAiModel) {
  if (!auth.accessToken || !window.confirm(`删除模型“${row.displayName}”？`)) return
  try {
    await removeAdminAiModel(auth.accessToken, row.id)
    ElMessage.success('模型已删除')
    await load()
  } catch (error) {
    toastError(error, '模型删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">ARTIFICIAL INTELLIGENCE</p>
      <h1>AI 模型</h1>
      <p class="page-description">维护 AI 供应商接入地址、密钥与模型开放状态。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <ElAlert
    class="config-alert"
    type="warning"
    show-icon
    :closable="false"
    title="配置提示"
    description="服务端未配置 AI_CONFIG_SECRET 时无法保存；DB 存在同类型供应商行会抑制环境变量兜底（禁用即真禁用）。"
  />
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">AI PROVIDERS</p>
        <h2>供应商与模型</h2>
      </div>
      <ElButton type="primary" :icon="Plus" @click="openProviderCreate">新增供应商</ElButton>
    </div>
    <ElTable v-loading="loading" :data="rows" row-key="id" stripe>
      <ElTableColumn type="expand">
        <template #default="providerScope">
          <div class="model-subpanel">
            <div class="section-title">
              <h3>{{ (providerScope.row as AdminAiProvider).name }} 的模型</h3>
              <ElButton
                size="small"
                :icon="Plus"
                @click="openModelCreate(providerScope.row as AdminAiProvider)"
                >新增模型</ElButton
              >
            </div>
            <ElTable
              :data="(providerScope.row as AdminAiProvider).models"
              row-key="id"
              size="small"
              stripe
            >
              <ElTableColumn prop="model" label="模型标识" min-width="200" />
              <ElTableColumn prop="displayName" label="显示名称" min-width="140" />
              <ElTableColumn label="支持推理" width="100">
                <template #default="scope">
                  <ElSwitch
                    v-model="scope.row.supportsReasoning"
                    @change="toggleModelReasoning(scope.row as AdminAiModel)"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="启用" width="90">
                <template #default="scope">
                  <ElSwitch
                    v-model="scope.row.enabled"
                    @change="toggleModelEnabled(scope.row as AdminAiModel)"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="默认" width="90">
                <template #default="scope">
                  <ElRadio
                    :model-value="(scope.row as AdminAiModel).isDefault"
                    :value="true"
                    @update:model-value="setDefaultModel(scope.row as AdminAiModel)"
                    >默认</ElRadio
                  >
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="90" fixed="right">
                <template #default="scope">
                  <ElButton
                    text
                    type="danger"
                    :icon="Delete"
                    @click="removeModel(scope.row as AdminAiModel)"
                    >删除</ElButton
                  >
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" width="90">
        <template #default="scope">
          <ElTag size="small" effect="plain">{{ scope.row.kind }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="name" label="名称" min-width="150" />
      <ElTableColumn prop="baseUrl" label="baseUrl" min-width="240" />
      <ElTableColumn label="启用" width="90">
        <template #default="scope">
          <ElSwitch
            v-model="scope.row.enabled"
            @change="toggleProvider(scope.row as AdminAiProvider)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="模型数" width="80">
        <template #default="scope">{{ (scope.row as AdminAiProvider).models.length }}</template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="140" fixed="right">
        <template #default="scope">
          <ElButton text @click="openProviderEdit(scope.row as AdminAiProvider)">编辑</ElButton>
          <ElButton
            text
            type="danger"
            :icon="Delete"
            @click="removeProvider(scope.row as AdminAiProvider)"
            >删除</ElButton
          >
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 个供应商</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
  </section>

  <ElDialog
    v-model="providerDialog"
    :title="editingProviderId ? '编辑供应商' : '新增供应商'"
    width="560px"
  >
    <ElForm :model="providerForm" label-position="top">
      <ElFormItem label="供应商类型">
        <ElSelect
          v-model="providerForm.kind"
          :disabled="editingProviderId !== null"
          style="width: 100%"
        >
          <ElOption label="GPT（OpenAI 兼容）" value="GPT" />
          <ElOption label="GLM（智谱）" value="GLM" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="名称">
        <ElInput v-model="providerForm.name" placeholder="如：生产 GLM 直连" />
      </ElFormItem>
      <ElFormItem label="baseUrl（HTTPS）">
        <ElInput
          v-model="providerForm.baseUrl"
          placeholder="https://open.bigmodel.cn/api/paas/v4"
        />
      </ElFormItem>
      <ElFormItem
        :label="editingProviderId ? 'API Key（留空表示不修改）' : 'API Key（服务端加密存储）'"
      >
        <ElInput
          v-model="providerForm.apiKey"
          type="password"
          show-password
          autocomplete="off"
          :placeholder="editingProviderId ? '留空表示保持现有密钥不变' : '至少 8 位'"
        />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="providerForm.enabled" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="providerDialog = false">取消</ElButton>
      <ElButton type="primary" :loading="providerSaving" @click="submitProvider">保存</ElButton>
    </template>
  </ElDialog>

  <ElDialog
    v-model="modelDialog"
    :title="modelProvider ? `为「${modelProvider.name}」新增模型` : '新增模型'"
    width="520px"
  >
    <ElForm :model="modelForm" label-position="top">
      <ElFormItem label="模型标识">
        <ElInput v-model="modelForm.model" placeholder="如 glm-4.7" />
      </ElFormItem>
      <ElFormItem label="显示名称">
        <ElInput v-model="modelForm.displayName" placeholder="如 GLM-4.7" />
      </ElFormItem>
      <ElFormItem label="支持深度推理">
        <ElSwitch v-model="modelForm.supportsReasoning" />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="modelForm.enabled" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="modelDialog = false">取消</ElButton>
      <ElButton type="primary" :loading="modelSaving" @click="submitModel">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.config-alert {
  margin-bottom: 24px;
}
.model-subpanel {
  padding: 4px 8px 12px;
}
.model-subpanel .section-title {
  margin-bottom: 12px;
}
.model-subpanel .section-title h3 {
  font-size: 14px;
  font-weight: 600;
}
</style>
