import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/base/menus', 'get', params) }
export function add(data: Record<string, any>) { return createAPI<ApiEnvelope>('/base/menus', 'post', data) }
export function update(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/base/menus/${id}`, 'put', data) }
export function remove(id: string) { return createAPI<ApiEnvelope>(`/base/menus/${id}`, 'delete') }
export function detail(id: string) { return createAPI<ApiEnvelope>(`/base/menus/${id}`, 'get') }
