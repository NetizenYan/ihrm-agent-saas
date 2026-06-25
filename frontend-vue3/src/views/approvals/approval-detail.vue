<template>
  <div class="page">
    <PageHeader title="审批详情" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="审批通过/驳回为写操作，已禁用，待后端安全修复后开放。" />
    <PageCard title="审批信息">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!hasData" title="未找到审批信息" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="审批名称">{{ data.processName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起人">{{ data.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ data.processStatuStr || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起时间">{{ data.start_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="流程标识">{{ data.processKey || '-' }}</el-descriptions-item>
      </el-descriptions>
    </PageCard>
    <PageCard title="审批历史">
      <LoadingState v-if="loadingFlow" />
      <ErrorState v-else-if="errorFlow" :message="errorFlow" @retry="loadFlow" />
      <EmptyState v-else-if="!flow.length" title="暂无审批历史" />
      <el-table v-else :data="flow" border stripe>
        <el-table-column prop="approvalTime" label="时间" width="160" />
        <el-table-column prop="approverName" label="审批人" width="120" />
        <el-table-column prop="approvalStatuStr" label="动作" width="100" />
        <el-table-column prop="opinion" label="意见" min-width="200" />
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as approvalsApi from '@/api/hrm/approvalsApi'
import { extractObject, extractList } from '@/utils/data'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const data = ref<Record<string, any>>({})
const flow = ref<any[]>([])
const loading = ref(false); const error = ref('')
const loadingFlow = ref(false); const errorFlow = ref('')
const hasData = computed(() => Object.keys(data.value).length > 0)

async function load() {
  if (!id.value) { error.value = '缺少审批 ID'; return }
  loading.value = true; error.value = ''
  try { data.value = extractObject(await approvalsApi.approvalsDetail(id.value)) }
  catch (e: any) { error.value = e?.message || '加载审批详情失败' }
  finally { loading.value = false }
}
async function loadFlow() {
  if (!id.value) return
  loadingFlow.value = true; errorFlow.value = ''
  try { flow.value = extractList(await approvalsApi.reviewHistory(id.value)) }
  catch (e: any) { errorFlow.value = e?.message || '加载审批历史失败' }
  finally { loadingFlow.value = false }
}
onMounted(() => { load(); loadFlow() })
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
