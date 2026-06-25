<template>
  <div class="page-header">
    <div class="ph-left">
      <h2 class="ph-title">{{ title }}</h2>
      <span v-if="subtitle" class="ph-subtitle">{{ subtitle }}</span>
    </div>
    <div class="ph-actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ph-left { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.ph-title { margin: 0; font-size: 18px; font-weight: 600; color: #303133; }
.ph-subtitle { font-size: 12px; color: #909399; }
.ph-actions { display: flex; gap: 8px; }
</style>
