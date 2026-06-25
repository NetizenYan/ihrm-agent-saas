import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/company/department', 'get', params) }
export function save(data: Record<string, any>) { return createAPI<ApiEnvelope>('/company/department', 'post', data) }
export function find(id: string) { return createAPI<ApiEnvelope>(`/company/department/${id}`, 'get') }
export function deleteById(id: string) { return createAPI<ApiEnvelope>(`/company/department/${id}`, 'delete') }
export function update(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/company/department/${id}`, 'put', data) }
export function saveOrupdate(data: Record<string, any>, id?: string) { return id ? update(id, data) : save(data) }
export function attendanceSave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/atte', 'put', data) }
export function getAttendance(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/atte/item', 'post', data) }
export function leaveSave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/leave', 'put', data) }
export function getLeave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/leave/list', 'post', data) }
export function deductionsSave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/deduction', 'put', data) }
export function getDeductions(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/ded/list', 'post', data) }
export function overtimeSave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/extDuty', 'put', data) }
export function getOvertime(data: Record<string, any>) { return createAPI<ApiEnvelope>('/cfg/extDuty/item', 'post', data) }
export function archive(data: Record<string, any>) { return createAPI<ApiEnvelope>('archive/item', 'post', data) }
