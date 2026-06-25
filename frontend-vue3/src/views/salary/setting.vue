<template>
  <div class="page">
    <PageHeader title="工资设置" subtitle="只读展示 · 写操作将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Check" disabled>保存设置</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-alert class="readonly-notice" type="warning" :closable="false" title="工资设置为敏感能力，保存已禁用，待后端安全修复后开放。" />
    <PageCard title="工资设置项（只读）">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无工资设置项" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="name" label="项目名称" min-width="140" />
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="isComputational" label="是否计算项" width="120" />
        <el-table-column prop="isDefault" label="是否默认项" width="120" />
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as salaryApi from '@/api/hrm/salarysApi'
import { extractList } from '@/utils/data'

const loading = ref(false)
const error = ref('')
const rows = ref<any[]>([])

async function load() {
  loading.value = true; error.value = ''
  try { rows.value = extractList(await salaryApi.getSettings()) }
  catch (e: any) { error.value = e?.message || '加载工资设置失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
