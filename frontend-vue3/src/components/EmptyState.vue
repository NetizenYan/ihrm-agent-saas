<template>
  <div class="empty-state">
    <el-icon class="em-icon"><Box /></el-icon>
    <p class="em-title">{{ title || '暂无数据' }}</p>
    <p v-if="description" class="em-desc">{{ description }}</p>
    <div class="em-actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { Box } from '@element-plus/icons-vue'
defineProps<{ title?: string; description?: string }>()
</script>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; color: #909399; }
.em-icon { font-size: 40px; color: #c0c4cc; margin-bottom: 10px; }
.em-title { margin: 0; font-size: 14px; color: #606266; }
.em-desc { margin: 4px 0 0; font-size: 12px; color: #c0c4cc; }
.em-actions { margin-top: 12px; }
</style>
