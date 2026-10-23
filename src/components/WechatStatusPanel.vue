<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { ElAlert, ElButton, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { useAdminAuthStore } from '@/stores/admin-auth'
import { getWechatStatus, type WechatStatus } from '@/services/admin-system'
const auth = useAdminAuthStore()
const status = ref<WechatStatus | null>(null)
const error = ref('')
const loading = ref(false)
let epoch = 0
async function load() {
  if (!auth.accessToken || loading.value) return
  const current = ++epoch
  loading.value = true
  error.value = ''
  status.value = null
  try {
    const result = await getWechatStatus(auth.accessToken)
    if (current === epoch) status.value = result
  } catch (cause) {
    if (current === epoch)
      error.value = cause instanceof Error ? cause.message : '微信配置状态加载失败'
  } finally {
    if (current === epoch) loading.value = false
  }
}
onMounted(load)
onBeforeUnmount(() => {
  epoch++
})
</script>
<template>
  <section class="panel wechat-status">
    <div class="status-heading">
      <h2>微信与企业微信 H5</h2>
      <ElButton :loading="loading" @click="load">刷新配置状态</ElButton>
    </div>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <ElDescriptions v-if="status" :column="1" border>
      <ElDescriptionsItem label="微信好友 / 朋友圈分享">
        <ElTag :type="status.wechat.configured ? 'success' : 'info'">{{
          status.wechat.configured ? '服务端已配置' : '未配置完整'
        }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="企业微信 H5">
        <ElTag :type="status.wecom.configured ? 'success' : 'info'">{{
          status.wecom.configured ? '服务端已配置' : '未配置完整'
        }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="客户朋友圈">
        <ElTag :type="status.wecom.customerMoments ? 'success' : 'info'">{{
          status.wecom.customerMoments ? '已开启入口' : '未开启'
        }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="微信 H5 域名">{{
        status.origins.wechat.join('、') || '未配置'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="企业微信 H5 域名">{{
        status.origins.wecom.join('、') || '未配置'
      }}</ElDescriptionsItem>
    </ElDescriptions>
    <p class="muted">
      状态仅表示服务端配置是否完整。域名校验、应用权限及真机授权 /
      分享仍需在微信平台验收；应用密钥由服务器环境变量维护。
    </p>
  </section>
</template>
<style scoped>
.wechat-status {
  margin-bottom: 20px;
}
.status-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.status-heading h2 {
  margin: 0;
  font-size: 18px;
}
</style>
