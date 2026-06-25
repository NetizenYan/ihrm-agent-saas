<template>
  <div class="page">
    <el-card v-loading="loading" shadow="never">
      <template #header><span>企业详情</span></template>
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="企业名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detail.managerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detail.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="企业地址">{{ detail.address }}</el-descriptions-item>
        <el-descriptions-item label="行业">{{ detail.industry }}</el-descriptions-item>
        <el-descriptions-item label="规模">{{ detail.companySize }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as saasApi from '@/api/base/saasClient'
const route = useRoute()
const loading = ref(false)
const detail = ref<any>(null)
async function load() { const id = route.params.id as string; if (!id) return; loading.value = true; try { const res = await saasApi.detail(id); detail.value = res?.data?.data ?? null } catch {} finally { loading.value = false } }
onMounted(load)
</script>
