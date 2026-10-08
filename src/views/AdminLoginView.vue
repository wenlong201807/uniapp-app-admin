<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { Lock, Message, Right } from '@element-plus/icons-vue'
import { useAdminAuthStore } from '@/stores/admin-auth'

const router = useRouter()
const route = useRoute()
const auth = useAdminAuthStore()
const loading = ref(false)
const form = reactive({ email: '', password: '' })

async function submit() {
  if (!form.email || !form.password) {
    ElMessage.warning('请输入管理员邮箱和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(form)
    ElMessage.success(`欢迎回来，${auth.admin?.displayName || '管理员'}`)
    await router.replace(
      typeof route.query.redirect === 'string' ? route.query.redirect : '/overview',
    )
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
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
        <h2 id="login-title">管理员登录</h2>
        <p>使用独立管理员账号进入管理控制台。</p>
      </div>
      <ElForm :model="form" label-position="top" @submit.prevent="submit">
        <ElFormItem label="邮箱地址"
          ><ElInput
            v-model="form.email"
            type="email"
            autocomplete="username"
            placeholder="admin@example.com"
            :prefix-icon="Message"
            @keyup.enter="submit"
        /></ElFormItem>
        <ElFormItem label="密码"
          ><ElInput
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            show-password
            placeholder="请输入管理员密码"
            :prefix-icon="Lock"
            @keyup.enter="submit"
        /></ElFormItem>
        <ElButton class="login-submit" type="primary" native-type="submit" :loading="loading"
          >进入控制台 <el-icon><Right /></el-icon
        ></ElButton>
      </ElForm>
      <p class="login-security-note">
        登录会话仅保存在当前浏览器内存中，关闭或刷新页面后需要重新登录。
      </p>
    </section>
  </main>
</template>
