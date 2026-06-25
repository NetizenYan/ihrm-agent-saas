<template>
  <div class="page">
    <PageHeader title="审批管理" subtitle="只读展示 · 写操作将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Plus" disabled>发起审批</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-alert class="readonly-notice" type="warning" :closable="false" title="审批发起/通过/驳回为写操作，已禁用，待后端安全修复后开放。" />
    <PageCard title="审批列表">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无审批记录" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="processName" label="审批名称" min-width="150" />
        <el-table-column prop="username" label="发起人" width="120" />
        <el-table-column prop="processKey" label="流程标识" width="140" />
        <el-table-column prop="start_time" label="发起时间" width="160" />
        <el-table-column prop="processStatuStr" label="状态" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="goDetail(row)">详情</el-button></template>
        </el-table-column>
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as approvalsApi from '@/api/hrm/approvalsApi'
import { extractList } from '@/utils/data'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const rows = ref<any[]>([])

async function load() {
  loading.value = true; error.value = ''
  try { rows.value = extractList(await approvalsApi.approvalsList({ page: 1, pageSize: 20 })) }
  catch (e: any) { error.value = e?.message || '加载审批列表失败' }
  finally { loading.value = false }
}
function goDetail(row: any) { if (row?.processId || row?.id) router.push(`/approvals/approval/${row.processId || row.id}`) }
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
