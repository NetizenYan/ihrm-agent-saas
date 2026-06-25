<template>
  <div class="page">
    <PageHeader title="工资详情" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="本页为只读演示，调薪/定薪等写操作已禁用，待后端安全修复后开放。" />
    <PageCard title="工资信息">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!hasData" title="未找到工资信息" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="姓名">{{ data.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ data.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ data.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="基本工资">{{ data.currentBasicSalary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="岗位工资">{{ data.currentPostWage || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工资合计">{{ data.currentSalaryTotal || '-' }}</el-descriptions-item>
        <el-descriptions-item label="定薪时间">{{ data.usingTime || '-' }}</el-descriptions-item>
      </el-descriptions>
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
import * as salaryApi from '@/api/hrm/salarysApi'
import { extractObject } from '@/utils/data'

const route = useRoute()
const userId = computed(() => String(route.params.id || ''))
const data = ref<Record<string, any>>({})
const loading = ref(false)
const error = ref('')
const hasData = computed(() => Object.keys(data.value).length > 0)

async function load() {
  if (!userId.value) { error.value = '缺少用户 ID'; return }
  loading.value = true; error.value = ''
  try { data.value = extractObject(await salaryApi.getDetail(userId.value)) }
  catch (e: any) { error.value = e?.message || '加载工资详情失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
