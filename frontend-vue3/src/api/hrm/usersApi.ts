import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function usersInfo() { return createAPI<ApiEnvelope>('/user/myinfo', 'get') }
export function dimission(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/dimission', 'put', data) }
export function applyOvertime(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/overtime', 'put', data) }
export function applyLeave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/leave', 'put', data) }
export function approvalsList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/user/approvals', 'get', params) }
export function recruitsList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/user/recruits', 'get', params) }
export function recruitsInfo(id: string) { return createAPI<ApiEnvelope>(`/user/recruits/${id}`, 'get') }
export function recruitsFlow(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/user/recruits/${id}/flow`, 'put', data) }
