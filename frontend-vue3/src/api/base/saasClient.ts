import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/company', 'get', params) }
export function detail(id: string) { return createAPI<ApiEnvelope>(`/company/${id}`, 'get') }
