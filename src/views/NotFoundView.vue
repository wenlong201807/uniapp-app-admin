<script setup lang="ts">
import { ElButton, ElResult } from 'element-plus'
</script>

<template>
  <ElResult icon="warning" title="页面未找到" sub-title="请检查访问地址，或返回工作台。"
    ><template #extra
      ><RouterLink to="/overview"
        ><ElButton type="primary">返回工作台</ElButton></RouterLink
      ></template
    ></ElResult
  >
</template>
