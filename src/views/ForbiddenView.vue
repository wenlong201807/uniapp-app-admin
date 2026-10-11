<script setup lang="ts">
import { ElButton, ElResult } from 'element-plus'
import { useAdminRoutesStore } from '@/stores/admin-routes'

const navigation = useAdminRoutesStore()
</script>

<template>
  <ElResult icon="warning" title="无访问权限" sub-title="当前管理员没有此页面的访问权限。">
    <template #extra>
      <RouterLink v-if="navigation.visibleRoutes[0]" :to="navigation.visibleRoutes[0].path">
        <ElButton type="primary">返回可用页面</ElButton>
      </RouterLink>
    </template>
  </ElResult>
</template>
