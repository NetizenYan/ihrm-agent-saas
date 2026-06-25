import { login as loginReq, profile as profileReq, logout as logoutReq } from '@/api/base/frame'

export interface LoginPayload {
  mobile: string
  password: string
}

export function loginApi(payload: LoginPayload) {
  return loginReq(payload)
}

export function profileApi() {
  return profileReq()
}

export function logoutApi() {
  return logoutReq().catch(() => null)
}
