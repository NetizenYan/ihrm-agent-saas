<template>
  <el-card shadow="never" class="placeholder-card">
    <div class="placeholder-head">
      <el-icon class="ph-icon"><InfoFilled /></el-icon>
      <span class="ph-title">{{ title }}</span>
    </div>
    <el-alert :type="alertType" :closable="false" :title="`该页面为 Vue3 迁移骨架（${title}），业务功能尚未完整迁移。`" />
    <div class="placeholder-body">
      <p v-if="description">{{ description }}</p>
      <div class="ph-todo">
        <strong>TODO:</strong>
        <ul>
          <li v-for="item in todos" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div class="ph-api" v-if="apiList.length">
        <strong>已迁移 API 封装：</strong>
        <el-tag v-for="a in apiList" :key="a" size="small" class="api-tag">{{ a }}</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
withDefaults(defineProps<{ title: string; description?: string; todos?: string[]; apiList?: string[]; alertType?: 'info' | 'warning' | 'success' | 'error' }>(), { description: '', todos: () => [], apiList: () => [], alertType: 'info' })
</script>

<style scoped>
.placeholder-card { max-width: 900px; }
.placeholder-head { display: flex; align-items: center; margin-bottom: 12px; }
.ph-icon { font-size: 18px; color: #409eff; margin-right: 6px; }
.ph-title { font-size: 16px; font-weight: 600; }
.placeholder-body { margin-top: 12px; color: #606266; }
.ph-todo ul { margin: 4px 0 12px; padding-left: 20px; }
.api-tag { margin: 0 6px 6px 0; }
</style>
