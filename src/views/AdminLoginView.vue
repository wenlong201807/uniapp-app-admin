<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTabs,
  ElTabPane,
} from 'element-plus'
import { Lock, Message, Right, User } from '@element-plus/icons-vue'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { safeAdminRedirect } from '@/services/admin-routes'
import { useAdminRoutesStore } from '@/stores/admin-routes'

const router = useRouter()
const route = useRoute()
const auth = useAdminAuthStore()
const loading = ref(false)
const activeTab = ref<'login' | 'bootstrap'>('login')
const loginForm = reactive({ email: '', password: '' })
const bootstrapForm = reactive({ email: '', displayName: '', password: '', bootstrapToken: '' })

async function finishAuthentication(message: string) {
  ElMessage.success(`${message}，${auth.admin?.displayName || '管理员'}`)
  useAdminRoutesStore().reset()
  loginForm.password = ''
  bootstrapForm.password = ''
  bootstrapForm.bootstrapToken = ''
  await router.replace(safeAdminRedirect(route.query.redirect))
}

async function submitLogin() {
  if (loading.value) return
  if (!loginForm.email || !loginForm.password) {
    ElMessage.warning('请输入管理员邮箱和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(loginForm)
    await finishAuthentication('欢迎回来')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function submitBootstrap() {
  if (loading.value) return
  if (
    !bootstrapForm.email ||
    !bootstrapForm.displayName ||
    !bootstrapForm.password ||
    !bootstrapForm.bootstrapToken
  ) {
    ElMessage.warning('请完整填写初始化信息')
    return
  }
  loading.value = true
  try {
    await auth.bootstrap(bootstrapForm)
    await finishAuthentication('管理员初始化完成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '初始化失败，请检查一次性 token')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-intro">
      <img src="/favicon.svg" alt="" width="44" height="44" />
      <p class="eyebrow">MOMENT / ADMIN</p>
      <h1>让每一个此刻，<br /><em>都有条不紊。</em></h1>
      <p class="login-intro-copy">独立的管理员空间，管理应用、用户与内容。</p>
      <span class="login-watermark">A MOMENT, WELL ORGANIZED.</span>
    </section>
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-card-heading">
        <p class="eyebrow">SECURE ACCESS</p>
        <h2 id="login-title">管理员入口</h2>
        <p>使用独立管理员账号进入管理控制台。</p>
      </div>
      <ElTabs v-model="activeTab" stretch>
        <ElTabPane label="登录" name="login">
          <ElForm :model="loginForm" label-position="top" @submit.prevent="submitLogin">
            <ElFormItem label="邮箱地址"
              ><ElInput
                v-model="loginForm.email"
                type="email"
                autocomplete="username"
                placeholder="admin@example.com"
                :prefix-icon="Message"
            /></ElFormItem>
            <ElFormItem label="密码"
              ><ElInput
                v-model="loginForm.password"
                type="password"
                autocomplete="current-password"
                show-password
                placeholder="请输入管理员密码"
                :prefix-icon="Lock"
            /></ElFormItem>
            <ElButton class="login-submit" type="primary" native-type="submit" :loading="loading"
              >进入控制台 <el-icon><Right /></el-icon
            ></ElButton>
          </ElForm>
        </ElTabPane>
        <ElTabPane label="首次初始化" name="bootstrap">
          <ElAlert
            class="bootstrap-alert"
            title="仅首个管理员可使用"
            description="Bootstrap token 由服务端环境变量提供，创建成功后应立即删除或轮换。"
            type="warning"
            :closable="false"
            show-icon
          />
          <ElForm :model="bootstrapForm" label-position="top" @submit.prevent="submitBootstrap">
            <ElFormItem label="显示名称"
              ><ElInput
                v-model="bootstrapForm.displayName"
                autocomplete="name"
                placeholder="系统管理员"
                :prefix-icon="User"
            /></ElFormItem>
            <ElFormItem label="邮箱地址"
              ><ElInput
                v-model="bootstrapForm.email"
                type="email"
                autocomplete="username"
                placeholder="admin@example.com"
                :prefix-icon="Message"
            /></ElFormItem>
            <ElFormItem label="密码"
              ><ElInput
                v-model="bootstrapForm.password"
                type="password"
                autocomplete="new-password"
                show-password
                placeholder="至少 8 位"
                :prefix-icon="Lock"
            /></ElFormItem>
            <ElFormItem label="一次性 bootstrap token"
              ><ElInput
                v-model="bootstrapForm.bootstrapToken"
                type="password"
                autocomplete="off"
                show-password
                placeholder="从服务端环境变量读取"
                :prefix-icon="Lock"
            /></ElFormItem>
            <ElButton class="login-submit" type="primary" native-type="submit" :loading="loading"
              >创建管理员 <el-icon><Right /></el-icon
            ></ElButton>
          </ElForm>
        </ElTabPane>
      </ElTabs>
      <p class="login-security-note">
        登录会话仅保存在当前浏览器内存中，关闭或刷新页面后需要重新登录。
      </p>
    </section>
  </main>
</template>
