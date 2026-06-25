<template>
  <div class="sidebar">
    <div class="sidebar-logo">
      <span v-if="!collapsed" class="logo-title">IHRM 管理系统</span>
      <span v-else class="logo-mini">IHRM</span>
    </div>
    <el-scrollbar class="sidebar-scroll">
      <el-menu :default-active="activeMenu" :collapse="collapsed" :collapse-transition="false" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff" router>
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu v-if="route.children && route.children.length > 1" :index="route.path">
            <template #title>
              <el-icon v-if="iconOf(route)"><component :is="iconOf(route)" /></el-icon>
              <span>{{ titleOf(route) }}</span>
            </template>
            <el-menu-item v-for="child in visibleChildren(route)" :key="child.path" :index="resolvePath(route.path, child.path)">
              <el-icon v-if="iconOf(child)"><component :is="iconOf(child)" /></el-icon>
              <span>{{ titleOf(child) }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else-if="route.children && route.children.length === 1" :index="resolvePath(route.path, route.children[0].path)">
            <el-icon v-if="iconOf(route.children[0])"><component :is="iconOf(route.children[0])" /></el-icon>
            <span>{{ titleOf(route.children[0]) }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { constantRoutes } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const collapsed = computed(() => !appStore.sidebarOpened)
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path)
const menuRoutes = computed<RouteRecordRaw[]>(() => {
  const shell = constantRoutes.filter((r) => r.path === '/')
  return [...shell, ...permissionStore.routes].filter((r) => !(r.meta as any)?.hidden)
})

function visibleChildren(parent: RouteRecordRaw): RouteRecordRaw[] {
  return (parent.children || []).filter((c) => !(c.meta as any)?.hidden)
}
function titleOf(r: RouteRecordRaw): string {
  return (r.meta as any)?.title || r.name?.toString() || ''
}
function iconOf(r: RouteRecordRaw): string | null {
  const icon = (r.meta as any)?.icon
  return icon || null
}
function resolvePath(parent: string, child: string): string {
  if (child.startsWith('/')) return child
  if (parent === '/') return '/' + child
  return parent + '/' + child
}
</script>

<style scoped>
.sidebar { height: 100%; display: flex; flex-direction: column; }
.sidebar-logo { height: 50px; line-height: 50px; text-align: center; color: #fff; background: #2b3a4d; overflow: hidden; }
.logo-title { font-size: 16px; font-weight: 600; }
.logo-mini { font-size: 18px; font-weight: 700; }
.sidebar-scroll { flex: 1; }
.el-menu { border-right: none; }
</style>
