<template>
  <div class="page">
    <PagePlaceholder title="考勤管理" description="考勤列表与归档报表，含 xlsx 导出，复杂页面后续迁移。" :todos="['迁移考勤列表与修改', '迁移归档 / 报表（xlsx 导出）', '接入 /attendances/* 接口']" :api-list="['/attendances/{month}', '/attendances', '/attendances/reports', '/attendances/archives']" />
    <el-card shadow="never" style="margin-top: 16px">
      <template #header><span>考勤记录（实时接口）</span></template>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="username" label="姓名" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="140" />
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="adtStatuStr" label="考勤状态" width="120" />
      </el-table>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PagePlaceholder from '@/components/PagePlaceholder.vue'
import * as attendancesApi from '@/api/hrm/attendances'
const loading = ref(false)
const tableData = ref<any[]>([])
async function load() {
  loading.value = true
  try { const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; const res = await attendancesApi.list(month); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false }
}
onMounted(load)
</script>
