<template>
  <div class="page">
    <PageHeader title="权限设置" subtitle="只读展示 · 写操作将在后端安全修复后开放">
      <template #actions>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" :icon="Plus" disabled>新增权限</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-alert class="readonly-notice" type="warning" :closable="false" title="权限/菜单增删改与角色分配为写操作，已禁用，待后端安全修复后开放。" />
    <PageCard title="菜单与权限点（只读树）">
      <LoadingState v-if="loading" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="!treeData.length" title="暂无权限数据" />
      <el-tree v-else :data="treeData" :props="{ label: 'name', children: 'children' }" node-key="id" default-expand-all>
        <template #default="{ data: node }">
          <span class="tree-node">
            <span>{{ node.name }}</span>
            <el-tag size="small" :type="typeTag(node.type)" class="type-tag">{{ typeText(node.type) }}</el-tag>
            <el-tag v-if="node.code" size="small" type="info" effect="plain" class="type-tag">{{ node.code }}</el-tag>
          </span>
        </template>
      </el-tree>
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
import * as permissionApi from '@/api/base/permissions'
import { extractList } from '@/utils/data'

interface PermNode { id: string; pid?: string; name: string; type: number; code?: string; children?: PermNode[] }

const loading = ref(false)
const error = ref('')
const treeData = ref<PermNode[]>([])

function buildTree(list: any[]): PermNode[] {
  const map = new Map<string, PermNode>()
  const roots: PermNode[] = []
  list.forEach((it) => map.set(String(it.id), { id: String(it.id), pid: it.pid ? String(it.pid) : undefined, name: it.name || it.title || '-', type: it.type, code: it.code, children: [] }))
  map.forEach((node) => {
    if (node.pid && map.has(node.pid)) (map.get(node.pid)!.children as PermNode[]).push(node)
    else roots.push(node)
  })
  return roots
}
function typeText(t: number) { return t === 1 ? '菜单' : t === 2 ? '权限点' : t === 3 ? 'API' : '其他' }
function typeTag(t: number): 'success' | 'warning' | 'info' | '' { return t === 1 ? 'success' : t === 2 ? 'warning' : 'info' }

async function load() {
  loading.value = true; error.value = ''
  try { treeData.value = buildTree(extractList(await permissionApi.list())) }
  catch (e: any) { error.value = e?.message || '加载权限数据失败' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readonly-notice { margin-bottom: 16px; }
.tree-node { display: flex; align-items: center; gap: 8px; }
.type-tag { margin-left: 4px; }
</style>
