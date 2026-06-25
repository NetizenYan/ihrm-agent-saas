<template>
  <div class="error-page">
    <h1>401</h1>
    <p>抱歉，您没有权限访问此页面。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
// 401 page
</script>

<style scoped>
.error-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}
.error-page h1 {
  font-size: 80px;
  margin: 0;
  color: #c0c4cc;
}
</style>
