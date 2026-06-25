<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>系统用户</span>
          <el-button type="primary" :icon="Plus" @click="openAdd">新增用户</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="mobile" label="手机号" width="150" />
        <el-table-column prop="timeOfEntry" label="入职时间" width="140" />
        <el-table-column prop="enableFlag" label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.enableFlag ? 'success' : 'info'">{{ row.enableFlag ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该用户吗？" @confirm="handleDelete(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="username"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="手机号" prop="mobile"><el-input v-model="form.mobile" /></el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="入职时间"><el-date-picker v-model="form.timeOfEntry" type="date" value-format="YYYY-MM-DD" /></el-form-item>
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
import * as userApi from '@/api/base/users'

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', username: '', mobile: '', password: '', timeOfEntry: '' })
const rules: FormRules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }] }

async function load() { loading.value = true; try { const res = await userApi.list(); tableData.value = res?.data?.data ?? [] } catch {} finally { loading.value = false } }
function openAdd() { isEdit.value = false; Object.assign(form, { id: '', username: '', mobile: '', password: '', timeOfEntry: '' }); dialogVisible.value = true }
function openEdit(row: any) { isEdit.value = true; Object.assign(form, { id: row.id, username: row.username, mobile: row.mobile, password: '', timeOfEntry: row.timeOfEntry }); dialogVisible.value = true }
async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value) { await userApi.update(form.id, { username: form.username, mobile: form.mobile, timeOfEntry: form.timeOfEntry }) }
    else { await userApi.add({ username: form.username, mobile: form.mobile, password: form.password, timeOfEntry: form.timeOfEntry }) }
    ElMessage.success('保存成功'); dialogVisible.value = false; load()
  } catch {} finally { saving.value = false }
}
async function handleDelete(id: string) { try { await userApi.remove(id); ElMessage.success('删除成功'); load() } catch {} }
onMounted(load)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
