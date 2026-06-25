<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="hamburger" @click="appStore.toggleSidebar()">
        <component :is="collapsed ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
    <div class="navbar-right">
      <el-dropdown @command="onCommand">
        <span class="user-info">
          <el-avatar :size="28" :src="avatarSrc" class="avatar" />
          <span class="username">{{ displayName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { resetRouter } from '@/router'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const collapsed = computed(() => !appStore.sidebarOpened)
const displayName = computed(() => authStore.user.username || authStore.user.mobile || '用户')
const avatarSrc = computed(() => authStore.user.avatar || '')

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    } catch { return }
    await authStore.logout()
    resetRouter()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.navbar { display: flex; align-items: center; justify-content: space-between; height: 50px; padding: 0 16px; }
.hamburger { cursor: pointer; font-size: 20px; vertical-align: middle; }
.user-info { display: flex; align-items: center; cursor: pointer; outline: none; }
.avatar { margin-right: 8px; }
.username { margin-right: 4px; font-size: 14px; }
</style>
