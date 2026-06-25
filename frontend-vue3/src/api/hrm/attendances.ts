import { createAPI } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(month: string) { return createAPI<ApiEnvelope>(`/attendances/${month}`, 'get') }
export function attendancesList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances', 'get', params) }
export function importFill(data: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/import', 'post', data) }
export function modify(userId: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/attendances/${userId}`, 'put', data) }
export function alert(data: Record<string, any>) { return createAPI<ApiEnvelope>('/notify/mail', 'post', data) }
export function getArchivingList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/reports/year', 'get', params) }
export function getArchivingCont(id: string) { return createAPI<ApiEnvelope>(`/attendances/reports/${id}`, 'get') }
export function reportFormList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/reports', 'get', params) }
export function importAccount(data: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/import', 'post', data) }
export function archives(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/archives', 'get', params) }
export function newReports(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/attendances/newReports', 'get', params) }
export function atteArchiveDetail(userId: string, yearMonth: string) { return createAPI<ApiEnvelope>(`/attendances/archive/${userId}/${yearMonth}`, 'get') }
export function importReport(data: Record<string, any>) { return createAPI<ApiEnvelope>('/report/atte/export', 'post', data) }
export function importArchive(data: Record<string, any>) { return createAPI<ApiEnvelope>('/archive/atte/export', 'post', data) }
