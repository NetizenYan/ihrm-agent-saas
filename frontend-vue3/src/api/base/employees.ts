import { createAPI, createDownload } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/employees', 'get', params) }
export function add(data: Record<string, any>) { return createAPI<ApiEnvelope>('/employees', 'post', data) }
export function employeesSimpleList() { return createAPI<ApiEnvelope>('/employees/simple', 'get') }
export function jobnumber() { return createAPI<ApiEnvelope>('/employees/jobnumber', 'get') }
export function accountStatus(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/accountStatus`, 'put', data) }
export function leave(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/leave`, 'put', data) }
export function leaveDetail(id: string) { return createAPI<ApiEnvelope>(`/employees/${id}/leave`, 'get') }
export function adjustPost(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/transferPosition`, 'put', data) }
export function adjustDetail(id: string) { return createAPI<ApiEnvelope>(`/employees/${id}/transferPosition`, 'get') }
export function personalDetail(id: string) { return createAPI<ApiEnvelope>(`/employees/${id}/personalInfo`, 'get') }
export function personal(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/personalInfo`, 'put', data) }
export function jobsDetail(id: string) { return createAPI<ApiEnvelope>(`/employees/${id}/jobs`, 'get') }
export function postDetail(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/jobs`, 'put', data) }
export function positiveDetail(id: string) { return createAPI<ApiEnvelope>(`/employees/${id}/positive`, 'get') }
export function positive(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}/positive`, 'put', data) }
export function edit(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/${id}`, 'put', data) }
export function importDown(month: string) { return createDownload(`/employees/export/${month}`, 'get') }
export function settDetail() { return createAPI<ApiEnvelope>('/employees/setting', 'get') }
export function settSave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/employees/setting', 'put', data) }
export function refort(month: string) { return createAPI<ApiEnvelope>(`/employees/archives/${month}`, 'get') }
export function getArchivingList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/employees/archives', 'get', params) }
export function fileUpdate(month: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/employees/archives/${month}`, 'put', data) }
