import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/permission', 'get', params) }
export function add(data: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/permission', 'post', data) }
export function update(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/sys/permission/${id}`, 'put', data) }
export function remove(id: string) { return createAPI<ApiEnvelope>(`/sys/permission/${id}`, 'delete') }
export function detail(id: string) { return createAPI<ApiEnvelope>(`/sys/permission/${id}`, 'get') }
export function saveOrUpdate(data: Record<string, any>, id?: string) { return id ? update(id, data) : add(data) }
