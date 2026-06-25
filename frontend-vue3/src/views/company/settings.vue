<template>
  <div class="page">
    <PageHeader title="公司设置" subtitle="只读展示 · 写操作将在后端安全修复后开放" />
    <el-alert class="readonly-notice" type="warning" :closable="false" title="角色分配/公司信息编辑为写操作，已禁用，待后端安全修复后开放。" />
    <PageCard title="角色列表（只读）">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Plus" disabled>新增角色</el-button></span>
        </el-tooltip>
      </template>
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!rows.length" title="暂无角色" />
      <el-table v-else :data="rows" border stripe>
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default>
            <el-tooltip content="安全修复后开放" placement="top">
              <span><el-button link type="primary" disabled>分配权限</el-button></span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import PageCard from '@/components/PageCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as roleApi from '@/api/base/role'
import { extractList } from '@/utils/data'

const loading = ref(false)
const error = ref('')
const rows = ref<any[]>([])

async function load() {
  loading.value = true; error.value = ''
  try { rows.value = extractList(await roleApi.simple()) }
  catch (e: any) { error.value = e?.message || '加载角色列表失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
</style>
