<template>
  <div class="page">
    <PageHeader title="考勤报表" subtitle="只读展示 · 导出将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button :icon="Download" disabled>导出报表</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-alert class="readonly-notice" type="warning" :closable="false" title="考勤报表含 xlsx 导出（敏感导出能力），已禁用，待后端安全修复后开放。" />
    <PageCard title="月度考勤报表">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无报表数据" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="username" label="姓名" min-width="110" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="departmentName" label="部门" width="130" />
        <el-table-column prop="adtStatuStr" label="考勤状态" width="110" />
        <el-table-column prop="day" label="日期" width="120" />
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
  try { rows.value = extractList(await attendancesApi.reportFormList({} as any)) }
  catch (e: any) { error.value = e?.message || '加载考勤报表失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
