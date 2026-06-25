<template>
  <el-container class="layout-root">
    <el-aside :width="collapsed ? '64px' : '210px'" class="layout-aside">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <Navbar />
      </el-header>
      <el-main class="layout-main">
        <Breadcrumb />
        <AppMain />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()
const collapsed = computed(() => !appStore.sidebarOpened)
</script>

<style scoped>
.layout-root { height: 100vh; }
.layout-aside { background: #304156; transition: width 0.28s; overflow: hidden; }
.layout-header { background: #fff; border-bottom: 1px solid #e6e6e6; padding: 0; height: 50px; line-height: 50px; }
.layout-main { background: #f0f2f5; padding: 16px; overflow: auto; }
</style>
