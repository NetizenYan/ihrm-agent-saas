<template>
  <div class="page">
    <el-card shadow="never">
      <template #header><span>SAAS 企业列表</span></template>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="name" label="企业名称" min-width="200" />
        <el-table-column prop="managerName" label="负责人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="150" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="$router.push(`/saas-clients/details/${row.id}`)">详情</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as saasApi from '@/api/base/saasClient'
const loading = ref(false)
const tableData = ref<any[]>([])
async function load() { loading.value = true; try { const res = await saasApi.list(); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false } }
onMounted(load)
</script>
