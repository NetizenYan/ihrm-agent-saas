<template>
  <div class="page">
    <PageHeader title="员工导入" subtitle="敏感导入能力 · 待后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="员工批量导入为敏感写操作，模板下载与上传已禁用，待后端安全修复后开放。" />
    <PageCard title="导入流程">
      <el-steps :active="0" finish-status="wait" align-center>
        <el-step title="下载模板" description="Excel 模板下载（已禁用）" />
        <el-step title="填写数据" description="按模板填写员工信息" />
        <el-step title="上传导入" description="批量上传（已禁用）" />
      </el-steps>
      <div class="actions">
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Download" disabled>下载导入模板</el-button></span>
        </el-tooltip>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="success" :icon="Upload" disabled>上传员工数据</el-button></span>
        </el-tooltip>
      </div>
    </PageCard>
    <PageCard title="已封装接口">
      <el-tag size="small" class="api-tag">/employees/export/{month}</el-tag>
      <el-tag size="small" class="api-tag">/employees/import</el-tag>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { Download, Upload } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
.actions { margin-top: 20px; display: flex; gap: 12px; }
.api-tag { margin: 0 8px 8px 0; }
</style>
