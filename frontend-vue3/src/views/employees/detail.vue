<template>
  <div class="page">
    <PageHeader title="员工详情" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="本页为只读演示，编辑/上传等写操作已禁用，待后端安全修复后开放。" />
    <PageCard title="基本信息">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!hasPersonal" title="未找到员工基本信息" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="姓名">{{ personal.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ personal.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入职时间">{{ personal.timeOfEntry || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ personal.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="聘用形式">{{ personal.formOfEmployment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ personal.jobNumber || '-' }}</el-descriptions-item>
      </el-descriptions>
    </PageCard>
    <PageCard title="岗位信息">
      <LoadingState v-if="loadingJobs" />
      <ErrorState v-else-if="errorJobs" :message="errorJobs" @retry="loadJobs" />
      <EmptyState v-else-if="!hasJobs" title="暂无岗位信息" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="岗位">{{ jobs.post || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职级">{{ jobs.rank || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作城市">{{ jobs.workingCity || '-' }}</el-descriptions-item>
        <el-descriptions-item label="转正时间">{{ jobs.correctionTime || '-' }}</el-descriptions-item>
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
import * as employeeApi from '@/api/base/employees'
import { extractObject } from '@/utils/data'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))

const personal = ref<Record<string, any>>({})
const jobs = ref<Record<string, any>>({})
const loading = ref(false)
const error = ref('')
const loadingJobs = ref(false)
const errorJobs = ref('')
const hasPersonal = computed(() => Object.keys(personal.value).length > 0)
const hasJobs = computed(() => Object.keys(jobs.value).length > 0)

async function load() {
  if (!id.value) { error.value = '缺少员工 ID'; return }
  loading.value = true; error.value = ''
  try { personal.value = extractObject(await employeeApi.personalDetail(id.value)) }
  catch (e: any) { error.value = e?.message || '加载基本信息失败' }
  finally { loading.value = false }
}
async function loadJobs() {
  if (!id.value) return
  loadingJobs.value = true; errorJobs.value = ''
  try { jobs.value = extractObject(await employeeApi.jobsDetail(id.value)) }
  catch (e: any) { errorJobs.value = e?.message || '加载岗位信息失败' }
  finally { loadingJobs.value = false }
}
onMounted(() => { load(); loadJobs() })
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
