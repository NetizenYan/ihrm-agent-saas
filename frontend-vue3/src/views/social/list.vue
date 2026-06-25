<template>
  <div class="page">
    <PageHeader title="社保列表" subtitle="只读展示 · 写操作将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Plus" disabled>新增社保</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <PageCard>
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无社保数据" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="username" label="姓名" min-width="110" />
        <el-table-column prop="departmentName" label="部门" width="130" />
        <el-table-column prop="socialSecurityType" label="社保类型" width="100" />
        <el-table-column prop="participatingInTheCity" label="参保城市" width="110" />
        <el-table-column prop="enterTheSalaryBase" label="缴费基数" width="110" />
        <el-table-column prop="payType" label="缴纳方式" width="100" />
        <el-table-column label="操作" width="100" fixed="right">
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
import * as socialApi from '@/api/hrm/socialSecuritys'
import { extractList } from '@/utils/data'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const rows = ref<any[]>([])

async function load() {
  loading.value = true; error.value = ''
  try { rows.value = extractList(await socialApi.list({ page: 1, pageSize: 20 })) }
  catch (e: any) { error.value = e?.message || '加载社保列表失败' }
  finally { loading.value = false }
}
function goDetail(row: any) { if (row?.userId) router.push(`/social-securitys/detail/${row.userId}`) }
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
