<template>
  <div class="page">
    <PagePlaceholder title="社保管理" description="社保主页包含城市/档位配置与归档报表，复杂页面后续迁移。列表接口已封装。" :todos="['迁移社保设置表单', '迁移历史归档 / 月报表（xlsx 导出）', '接入 /social_securitys/* 接口']" :api-list="['/social_securitys/list', '/social_securitys/settings', '/social_securitys/{userId}', '/social_securitys/historys/{year}/list']" />
    <el-card shadow="never" style="margin-top: 16px">
      <template #header><span>社保列表（实时接口）</span></template>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="username" label="姓名" min-width="120" />
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="socialSecurityType" label="社保类型" width="120" />
        <el-table-column prop="participatingInTheCity" label="参保城市" width="120" />
      </el-table>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PagePlaceholder from '@/components/PagePlaceholder.vue'
import * as socialApi from '@/api/hrm/socialSecuritys'
const loading = ref(false)
const tableData = ref<any[]>([])
async function load() { loading.value = true; try { const res = await socialApi.list(); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false } }
onMounted(load)
</script>
