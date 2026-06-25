<template>
  <div class="page">
    <PageHeader title="工资管理" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="工资为敏感能力，设置/归档/导出已禁用，待后端安全修复后开放。" />
    <PageCard title="公司工资设置">
      <LoadingState v-if="loadingSettings" />
      <ErrorState v-else-if="errorSettings" :message="errorSettings" @retry="loadSettings" />
      <EmptyState v-else-if="!hasCompanySettings" title="暂无公司工资设置" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="薪酬启用月份">{{ company.yearMonth || '-' }}</el-descriptions-item>
        <el-descriptions-item label="社保启用月份">{{ company.socialSecurityMonth || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公积金启用月份">{{ company.providentFundMonth || '-' }}</el-descriptions-item>
      </el-descriptions>
    </PageCard>
    <PageCard title="工资设置项">
      <LoadingState v-if="loadingItems" />
      <ErrorState v-else-if="errorItems" :message="errorItems" @retry="loadItems" />
      <EmptyState v-else-if="!items.length" title="暂无工资设置项" />
      <el-table v-else :data="items" border stripe>
        <el-table-column prop="name" label="项目名称" min-width="140" />
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="isComputational" label="是否计算项" width="110" />
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as salaryApi from '@/api/hrm/salarysApi'
import { extractObject, extractList } from '@/utils/data'

const company = ref<Record<string, any>>({})
const items = ref<any[]>([])
const loadingSettings = ref(false); const errorSettings = ref('')
const loadingItems = ref(false); const errorItems = ref('')
const hasCompanySettings = computed(() => Object.keys(company.value).length > 0)

async function loadSettings() {
  loadingSettings.value = true; errorSettings.value = ''
  try { company.value = extractObject(await salaryApi.getCompanySettings()) }
  catch (e: any) { errorSettings.value = e?.message || '加载公司设置失败' }
  finally { loadingSettings.value = false }
}
async function loadItems() {
  loadingItems.value = true; errorItems.value = ''
  try { items.value = extractList(await salaryApi.getSettings()) }
  catch (e: any) { errorItems.value = e?.message || '加载工资设置项失败' }
  finally { loadingItems.value = false }
}
onMounted(() => { loadSettings(); loadItems() })
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
