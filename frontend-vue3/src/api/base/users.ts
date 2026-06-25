import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/user', 'get', params) }
export function simple() { return createAPI<ApiEnvelope>('/sys/user/simple', 'get') }
export function add(data: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/user', 'post', data) }
export function update(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/sys/user/${id}`, 'put', data) }
export function updateSelf(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/sys/user/${id}/self`, 'put', data) }
export function remove(id: string) { return createAPI<ApiEnvelope>(`/sys/user/${id}`, 'delete') }
export function detail(id: string) { return createAPI<ApiEnvelope>(`/sys/user/${id}`, 'get') }
export function assignRoles(data: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/user/assignRoles', 'put', data) }
