<template>
  <div class="page">
    <PageHeader title="考勤归档" subtitle="只读展示 · 导出将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button :icon="Download" disabled>导出归档</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-alert class="readonly-notice" type="warning" :closable="false" title="考勤归档含 xlsx 导出（敏感导出能力），已禁用，待后端安全修复后开放。" />
    <PageCard title="归档列表（按年）">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无归档记录" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="yearMonth" label="归档月份" min-width="120" />
        <el-table-column prop="totalPeopleNum" label="应出勤人数" width="120" />
        <el-table-column prop="actualPeopleNum" label="实际出勤人数" width="130" />
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="adtStatuStr" label="状态" width="100" />
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as attendancesApi from '@/api/hrm/attendances'
import { extractList } from '@/utils/data'

const loading = ref(false)
const error = ref('')
const rows = ref<any[]>([])

async function load() {
  loading.value = true; error.value = ''
  try { rows.value = extractList(await attendancesApi.getArchivingList({} as any)) }
  catch (e: any) { error.value = e?.message || '加载归档列表失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
