<template>
  <el-card shadow="never" class="page-card">
    <template v-if="title || $slots.header" #header>
      <div class="pc-header">
        <span class="pc-title">{{ title }}</span>
        <div class="pc-actions"><slot name="actions" /></div>
      </div>
    </template>
    <slot />
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped>
.page-card { margin-bottom: 16px; }
.pc-header { display: flex; align-items: center; justify-content: space-between; }
.pc-title { font-weight: 600; color: #303133; }
.pc-actions { display: flex; gap: 8px; }
</style>
