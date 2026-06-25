import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

const SUCCESS_CODE = '10000'
const TOKEN_INVALID_CODES = ['50008', '50012', '50014']

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => {
    ElMessage.error('请求发送失败')
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    const res = response.data
    const code = res?.code
    if (code !== undefined) {
      if (TOKEN_INVALID_CODES.includes(String(code))) {
        ElMessage.error('登录状态已失效，请重新登录')
        return Promise.reject(new Error('token expired'))
      }
      if (String(code) !== SUCCESS_CODE) {
        ElMessage.error(res?.message || '请求失败')
        return Promise.reject(new Error(res?.message || '请求失败'))
      }
    }
    return response
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      ElMessage.error('登录状态已失效，请重新登录')
    } else {
      ElMessage.error(error?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export function createAPI<T = any>(
  url: string,
  method: AxiosRequestConfig['method'],
  data?: any
): Promise<T> {
  const config: AxiosRequestConfig = { url, method }
  if (method === 'get' || method === 'GET') {
    config.params = data
  } else {
    config.data = data
  }
  return instance.request(config).then((r) => r.data as T)
}

export function createFormAPI<T = any>(
  url: string,
  method: AxiosRequestConfig['method'],
  data?: Record<string, any>
): Promise<T> {
  const params = new URLSearchParams()
  if (data) {
    Object.keys(data).forEach((k) => params.append(k, data[k]))
  }
  return instance
    .request({
      url,
      method,
      data: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then((r) => r.data as T)
}

export function createDownload<T = any>(
  url: string,
  method: AxiosRequestConfig['method'],
  data?: any
): Promise<T> {
  const config: AxiosRequestConfig = { url, method, responseType: 'blob' }
  if (method === 'get' || method === 'GET') {
    config.params = data
  } else {
    config.data = data
  }
  return instance.request(config).then((r) => r.data as T)
}

export default instance
export { instance as axiosInstance }
