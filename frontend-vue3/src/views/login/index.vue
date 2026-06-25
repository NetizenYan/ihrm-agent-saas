<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h2>IHRM 管理系统</h2>
        <p>Vue3 前端 · Phase 3 迁移</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="手机号" prop="mobile">
          <el-input
            v-model="form.mobile"
            placeholder="请输入手机号"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>
      <p class="login-tip">
        登录凭证为 Shiro Session ID，前端以 Authorization: Bearer 方式携带。
      </p>
      <p v-if="demoLoginEnabled" class="login-demo-tip">
        演示账号已预填（来自本地 env，仅限开发环境）。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

// 登录表单默认留空。仅在 VITE_USE_DEMO_LOGIN 显式开启时，
// 从 VITE_DEMO_MOBILE / VITE_DEMO_PASSWORD 读取演示账号（值由本地 env 提供，不写入源码）。
// 这样生产构建不会预填任何真实测试账号。
const demoLoginEnabled = import.meta.env.VITE_USE_DEMO_LOGIN === 'true' || import.meta.env.VITE_USE_DEMO_LOGIN === '1'
const demoMobile = demoLoginEnabled ? (import.meta.env.VITE_DEMO_MOBILE || '') : ''
const demoPassword = demoLoginEnabled ? (import.meta.env.VITE_DEMO_PASSWORD || '') : ''

const form = reactive({
  mobile: demoMobile,
  password: demoPassword
})

const rules: FormRules = {
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await authStore.login({ mobile: form.mobile, password: form.password })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (e: any) {
    // Error message already surfaced by the axios interceptor.
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2b3a4d 0%, #1f2d3d 100%);
}
.login-card {
  width: 380px;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 24px;
}
.login-header h2 {
  margin: 0 0 6px;
  color: #303133;
}
.login-header p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}
.login-btn {
  width: 100%;
  margin-top: 8px;
}
.login-tip {
  margin-top: 16px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
}
.login-demo-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
  text-align: center;
}
</style>
