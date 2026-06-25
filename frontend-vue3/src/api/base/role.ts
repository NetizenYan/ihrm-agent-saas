import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/role', 'get', params) }
export function simple() { return createAPI<ApiEnvelope>('/sys/role/simple', 'get') }
export function add(data: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/role', 'post', data) }
export function update(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/sys/role/${id}`, 'put', data) }
export function remove(id: string) { return createAPI<ApiEnvelope>(`/sys/role/${id}`, 'delete') }
export function detail(id: string) { return createAPI<ApiEnvelope>(`/sys/role/${id}`, 'get') }
export function assignPrem(data: Record<string, any>) { return createAPI<ApiEnvelope>('/sys/role/assignPrem', 'put', data) }
export function findAll() { return createAPI<ApiEnvelope>('/sys/role/list', 'get') }
