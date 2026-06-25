<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>组织架构管理</span>
          <el-button type="primary" :icon="Plus" @click="openAdd(rootId)">新增部门</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="treeData" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="managerName" label="负责人" width="120" />
        <el-table-column prop="enable" label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAdd(row.id)">新增子部门</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该部门吗？" @confirm="handleDelete(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑部门' : '新增部门'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="部门名称" prop="name"><el-input v-model="form.name" placeholder="请输入部门名称" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.managerName" placeholder="请输入负责人" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.enable" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as deptApi from '@/api/base/dept'

interface DeptNode { id: string; name: string; managerName?: string; enable?: boolean; children?: DeptNode[] }

const rootId = '0'
const loading = ref(false)
const treeData = ref<DeptNode[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', name: '', managerName: '', enable: true, pid: '' })
const rules: FormRules = { name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] }

function toTree(list: any[]): DeptNode[] {
  const map: Record<string, DeptNode> = {}
  const roots: DeptNode[] = []
  list.forEach((d) => { map[d.id] = { ...d, children: [] } })
  list.forEach((d) => { const node = map[d.id]; if (d.pid && map[d.pid]) { map[d.pid].children!.push(node) } else { roots.push(node) } })
  return roots
}

async function loadList() {
  loading.value = true
  try { const res = await deptApi.list(); const data = res?.data?.data ?? []; treeData.value = Array.isArray(data) ? toTree(data) : [] } catch {} finally { loading.value = false }
}
function openAdd(pid: string) { isEdit.value = false; Object.assign(form, { id: '', name: '', managerName: '', enable: true, pid }); dialogVisible.value = true }
function openEdit(row: DeptNode) { isEdit.value = true; Object.assign(form, { id: row.id, name: row.name, managerName: row.managerName || '', enable: row.enable ?? true, pid: '' }); dialogVisible.value = true }
async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value) { await deptApi.update(form.id, { name: form.name, managerName: form.managerName, enable: form.enable }) }
    else { await deptApi.save({ name: form.name, managerName: form.managerName, enable: form.enable, pid: form.pid }) }
    ElMessage.success('保存成功'); dialogVisible.value = false; loadList()
  } catch {} finally { saving.value = false }
}
async function handleDelete(id: string) { try { await deptApi.deleteById(id); ElMessage.success('删除成功'); loadList() } catch {} }
onMounted(loadList)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
