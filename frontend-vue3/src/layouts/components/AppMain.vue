<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
// Main content area hosts the matched business page.
</script>

<style scoped>
:deep(> .el-card) {
  margin-bottom: 16px;
}
</style>
