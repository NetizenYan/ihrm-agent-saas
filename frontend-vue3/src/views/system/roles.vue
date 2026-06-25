<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" :icon="Plus" @click="openAdd">新增角色</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openPerm(row)">分配权限</el-button>
            <el-popconfirm title="确定删除该角色吗？" @confirm="handleDelete(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="permVisible" title="分配权限（只读预览）" width="480px">
      <el-alert type="warning" :closable="false" title="权限分配为写操作，已禁用保存，待后端安全修复后开放。" />
      <div class="perm-tree-wrap">
        <LoadingState v-if="permLoading" tip="加载权限树…" />
        <ErrorState v-else-if="permError" :message="permError" @retry="loadPermTree" />
        <EmptyState v-else-if="!permTree.length" title="暂无权限数据" />
        <el-tree v-else :data="permTree" :props="{ label: 'name', children: 'children' }" node-key="id" default-expand-all disabled>
          <template #default="{ data: node }">
            <span>{{ node.name }}<el-tag v-if="node.code" size="small" type="info" effect="plain" class="perm-code">{{ node.code }}</el-tag></span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="permVisible = false">关闭</el-button>
        <el-tooltip content="安全修复后开放" placement="top">
          <span><el-button type="primary" disabled>保存分配</el-button></span>
        </el-tooltip>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as roleApi from '@/api/base/role'
import * as permissionApi from '@/api/base/permissions'
import { extractList } from '@/utils/data'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'

interface PermNode { id: string; pid?: string; name: string; code?: string; children?: PermNode[] }

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const permVisible = ref(false)
const permLoading = ref(false)
const permError = ref('')
const permTree = ref<PermNode[]>([])
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', name: '', description: '' })
const rules: FormRules = { name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] }

async function load() { loading.value = true; try { const res = await roleApi.list(); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false } }
function openAdd() { isEdit.value = false; Object.assign(form, { id: '', name: '', description: '' }); dialogVisible.value = true }
function openEdit(row: any) { isEdit.value = true; Object.assign(form, { id: row.id, name: row.name, description: row.description || '' }); dialogVisible.value = true }
function openPerm(row: any) { form.id = row.id; permVisible.value = true; loadPermTree() }
function buildPermTree(list: any[]): PermNode[] {
  const map = new Map<string, PermNode>()
  const roots: PermNode[] = []
  list.forEach((it) => map.set(String(it.id), { id: String(it.id), pid: it.pid ? String(it.pid) : undefined, name: it.name || it.title || '-', code: it.code, children: [] }))
  map.forEach((node) => { if (node.pid && map.has(node.pid)) (map.get(node.pid)!.children as PermNode[]).push(node); else roots.push(node) })
  return roots
}
async function loadPermTree() {
  permLoading.value = true; permError.value = ''
  try { permTree.value = buildPermTree(extractList(await permissionApi.list())) }
  catch (e: any) { permError.value = e?.message || '加载权限树失败' }
  finally { permLoading.value = false }
}
async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value) { await roleApi.update(form.id, { name: form.name, description: form.description }) }
    else { await roleApi.add({ name: form.name, description: form.description }) }
    ElMessage.success('保存成功'); dialogVisible.value = false; load()
  } catch {} finally { saving.value = false }
}
async function handleDelete(id: string) { try { await roleApi.remove(id); ElMessage.success('删除成功'); load() } catch {} }
onMounted(load)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.perm-tree-wrap { margin-top: 12px; max-height: 360px; overflow: auto; }
.perm-code { margin-left: 8px; }
</style>
