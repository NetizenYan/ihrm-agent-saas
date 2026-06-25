<template>
  <div class="page">
    <PageHeader title="社保个人详情" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="本页为只读演示，保存等写操作已禁用，待后端安全修复后开放。" />
    <PageCard title="参保信息">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!hasData" title="未找到社保信息" />
      <el-descriptions v-else :column="3" border>
        <el-descriptions-item label="姓名">{{ data.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ data.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="社保类型">{{ data.socialSecurityType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="参保城市">{{ data.participatingInTheCity || '-' }}</el-descriptions-item>
        <el-descriptions-item label="缴费基数">{{ data.enterTheSalaryBase || '-' }}</el-descriptions-item>
        <el-descriptions-item label="缴纳方式">{{ data.payType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="起缴月份">{{ data.startingMonth || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ data.remark || '-' }}</el-descriptions-item>
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
import * as socialApi from '@/api/hrm/socialSecuritys'
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
  try { data.value = extractObject(await socialApi.getContent(userId.value)) }
  catch (e: any) { error.value = e?.message || '加载社保详情失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
