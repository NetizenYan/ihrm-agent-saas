import { createAPI } from '@/api/request'

export interface ApiEnvelope<T = any> {
  code: number | string
  message: string
  data: T
}

export function login(data: { mobile: string; password: string }) {
  return createAPI<ApiEnvelope>('/sys/login', 'post', data)
}

export function profile() {
  return createAPI<ApiEnvelope>('/sys/profile', 'post')
}

export function logout() {
  return createAPI<ApiEnvelope>('/frame/logout', 'post')
}

export function registerStep1(data: Record<string, any>) {
  return createAPI<ApiEnvelope>('/frame/register/step1', 'post', data)
}

export function registerStep2(data: Record<string, any>) {
  return createAPI<ApiEnvelope>('/frame/register/step2', 'post', data)
}

export function regCode(data: Record<string, any>) {
  return createAPI<ApiEnvelope>('/frame/register/verification_code', 'post', data)
}

export function passwd(data: Record<string, any>) {
  return createAPI<ApiEnvelope>('/frame/passwd', 'post', data)
}
