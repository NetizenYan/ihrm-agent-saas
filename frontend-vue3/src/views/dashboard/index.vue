<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ card.title }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="welcome-card">
      <template #header>
        <span>欢迎使用 IHRM 管理系统（Vue3 版）</span>
      </template>
      <p>当前用户：<strong>{{ displayName }}</strong></p>
      <p>角色菜单权限数：<strong>{{ menuCount }}</strong></p>
      <p>权限点数：<strong>{{ pointCount }}</strong></p>
      <el-alert
        type="info"
        :closable="false"
        title="本前端为 Phase 3 Vue3 迁移版本，业务页面正在逐步迁移中。点击右下角悬浮按钮可体验 Agent 流式对话（Mock 模式）。"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const displayName = computed(() => authStore.user.username || authStore.user.mobile || '用户')
const menuCount = computed(() => authStore.menus.length)
const pointCount = computed(() => authStore.permissions.length)

const statCards = computed(() => [
  { title: '当前用户', value: displayName.value },
  { title: '菜单权限', value: menuCount.value },
  { title: '功能权限点', value: pointCount.value },
  { title: '前端版本', value: 'Vue3' }
])
</script>

<style scoped>
.stat-card {
  margin-bottom: 16px;
}
.stat-title {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}
.welcome-card {
  margin-top: 8px;
}
</style>
