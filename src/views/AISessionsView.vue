<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Refresh, Search, View } from '@element-plus/icons-vue'
import {
  getAdminAiConversations,
  getAdminAiMessages,
  type AdminAiConversation,
  type AdminAiMessage,
} from '@/services/admin-ai'
import { useAdminAuthStore } from '@/stores/admin-auth'

const auth = useAdminAuthStore()

function toastError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback)
}

const loading = ref(false)
const query = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = ref<AdminAiConversation[]>([])
let revision = 0

async function load() {
  if (!auth.accessToken) return
  loading.value = true
  const current = ++revision
  const token = auth.accessToken
  try {
    const result = await getAdminAiConversations(token, {
      page: page.value,
      pageSize: pageSize.value,
      q: query.value,
    })
    if (current !== revision || token !== auth.accessToken) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    toastError(error, '会话列表加载失败')
  } finally {
    if (current === revision) loading.value = false
  }
}

async function search() {
  page.value = 1
  await load()
}

async function previousPage() {
  page.value -= 1
  await load()
}

async function nextPage() {
  page.value += 1
  await load()
}

const detailDialog = ref(false)
const detailLoading = ref(false)
const detail = ref<{
  conversation: { title: string; user: { email: string; displayName: string } }
  messages: AdminAiMessage[]
} | null>(null)
const activeReasoning = ref<string[]>([])
let detailRevision = 0

async function openConversation(row: AdminAiConversation) {
  if (!auth.accessToken) return
  detailDialog.value = true
  detail.value = null
  activeReasoning.value = []
  detailLoading.value = true
  const current = ++detailRevision
  const token = auth.accessToken
  try {
    const result = await getAdminAiMessages(token, row.id)
    if (current !== detailRevision || token !== auth.accessToken) return
    detail.value = result
  } catch (error) {
    toastError(error, '会话消息加载失败')
  } finally {
    if (current === detailRevision) detailLoading.value = false
  }
}

function roleTagType(role: string): 'primary' | 'success' | 'info' {
  if (role === 'user') return 'primary'
  if (role === 'assistant') return 'success'
  return 'info'
}

const statusLabels: Record<string, string> = {
  COMPLETED: '完成',
  ABORTED: '中止',
  FAILED: '失败',
}

function messageNote(message: AdminAiMessage) {
  const parts = [
    statusLabels[message.status] ?? message.status,
    ...(message.model ? [message.model] : []),
    `输入 ${message.promptTokens}`,
    `输出 ${message.completionTokens}`,
    `耗时 ${message.durationMs}ms`,
    new Date(message.createdAt).toLocaleString('zh-CN'),
  ]
  return parts.join(' · ')
}

onMounted(load)
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">AI SESSIONS</p>
      <h1>AI 会话</h1>
      <p class="page-description">按用户检索 AI 对话会话并查阅消息明细。</p>
    </div>
    <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
  </div>
  <ElAlert
    class="sessions-alert"
    type="warning"
    show-icon
    :closable="false"
    title="隐私提示"
    description="会话内容属用户隐私，仅限管理必要查阅。"
  />
  <section class="panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">CONVERSATIONS</p>
        <h2>会话记录</h2>
      </div>
      <ElInput
        v-model="query"
        clearable
        placeholder="用户邮箱或昵称"
        style="max-width: 260px"
        @keyup.enter="search"
      />
      <ElButton type="primary" :icon="Search" :loading="loading" @click="search">查询</ElButton>
    </div>
    <ElTable v-loading="loading" :data="rows" stripe>
      <template #empty>暂无会话</template>
      <ElTableColumn prop="title" label="标题" min-width="220" />
      <ElTableColumn label="用户" min-width="220"
        ><template #default="scope"
          ><strong>{{ (scope.row as AdminAiConversation).user.displayName }}</strong
          ><br /><span class="muted">{{
            (scope.row as AdminAiConversation).user.email
          }}</span></template
        ></ElTableColumn
      >
      <ElTableColumn label="更新时间" min-width="180"
        ><template #default="scope">{{
          new Date((scope.row as AdminAiConversation).updatedAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" fixed="right"
        ><template #default="scope"
          ><ElButton text :icon="View" @click="openConversation(scope.row as AdminAiConversation)"
            >查看</ElButton
          ></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="table-footer">
      <span>共 {{ total }} 个会话</span
      ><ElButton text :disabled="page <= 1" @click="previousPage">上一页</ElButton
      ><ElButton text :disabled="page * pageSize >= total" @click="nextPage">下一页</ElButton>
    </div>
  </section>

  <ElDialog
    v-model="detailDialog"
    :title="detail ? detail.conversation.title : '会话明细'"
    width="720px"
    :close-on-click-modal="false"
  >
    <div v-loading="detailLoading" class="session-body">
      <template v-if="detail">
        <div class="conversation-heading">
          <h3>{{ detail.conversation.title }}</h3>
          <p class="muted">
            {{ detail.conversation.user.displayName }} · {{ detail.conversation.user.email }}
          </p>
        </div>
        <ol class="message-list">
          <li v-for="message in detail.messages" :key="message.id" class="message-item">
            <div class="message-meta">
              <ElTag size="small" effect="plain" :type="roleTagType(message.role)">{{
                message.role
              }}</ElTag>
              <span class="muted message-note">{{ messageNote(message) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
            <ElCollapse
              v-if="message.reasoning"
              v-model="activeReasoning"
              class="reasoning-collapse"
            >
              <ElCollapseItem :name="message.id" title="推理过程">
                <div class="message-content">{{ message.reasoning }}</div>
              </ElCollapseItem>
            </ElCollapse>
          </li>
        </ol>
        <p v-if="!detail.messages.length" class="muted">该会话暂无消息。</p>
      </template>
    </div>
    <template #footer>
      <ElButton @click="detailDialog = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.sessions-alert {
  margin-bottom: 24px;
}
.session-body {
  max-height: 60vh;
  overflow-y: auto;
}
.conversation-heading h3 {
  margin: 0 0 4px;
}
.conversation-heading p {
  margin: 0 0 12px;
}
.message-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.message-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
}
.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.message-note {
  font-size: 12px;
}
.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.6;
}
.reasoning-collapse {
  margin-top: 8px;
}
</style>
