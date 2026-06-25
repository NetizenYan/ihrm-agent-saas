<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>员工列表</span>
          <el-button type="primary" :icon="Upload" @click="$router.push('/employees/import')">导入员工</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="username" label="姓名" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="140" />
        <el-table-column prop="timeOfEntry" label="入职时间" width="130" />
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="formOfEmployment" label="聘用形式" width="110" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="$router.push(`/employees/details/${row.id}`)">详情</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import * as employeeApi from '@/api/base/employees'
const loading = ref(false)
const tableData = ref<any[]>([])
async function load() { loading.value = true; try { const res = await employeeApi.list(); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false } }
onMounted(load)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
