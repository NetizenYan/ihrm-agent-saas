<template>
  <div class="breadcrumb">
    <el-breadcrumb :separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item v-for="item in items" :key="item.path">
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()

const items = computed(() => {
  return route.matched
    .filter((r) => r.meta && (r.meta as any).title && r.path !== '/')
    .map((r) => ({ path: r.path, title: (r.meta as any).title as string }))
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 12px;
}
</style>
