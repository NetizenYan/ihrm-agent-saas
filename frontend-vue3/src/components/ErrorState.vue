<template>
  <div class="error-state">
    <el-icon class="es-icon"><WarningFilled /></el-icon>
    <p class="es-message">{{ message || '加载失败' }}</p>
    <el-button type="primary" size="small" @click="$emit('retry')"><el-icon><Refresh /></el-icon> 重试</el-button>
  </div>
</template>

<script setup lang="ts">
import { WarningFilled, Refresh } from '@element-plus/icons-vue'
defineProps<{ message?: string }>()
defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped>
.error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; color: #909399; }
.es-icon { font-size: 28px; color: #f56c6c; margin-bottom: 10px; }
.es-message { margin: 0 0 12px; font-size: 13px; color: #606266; }
</style>
