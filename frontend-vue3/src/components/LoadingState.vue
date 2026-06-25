<template>
  <div class="loading-state">
    <el-icon class="ls-icon is-loading"><Loading /></el-icon>
    <span class="ls-tip">{{ tip || '加载中…' }}</span>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
defineProps<{ tip?: string }>()
</script>

<style scoped>
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; color: #909399; }
.ls-icon { font-size: 28px; color: #409eff; margin-bottom: 10px; }
.ls-tip { font-size: 13px; }
</style>
