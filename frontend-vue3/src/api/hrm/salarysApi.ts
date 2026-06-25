import { createAPI, createDownload } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function getSalarysList(data?: Record<string, any>) { return createAPI<ApiEnvelope>('/salarys/list', 'post', data) }
export function getCompanySettings() { return createAPI<ApiEnvelope>('/salarys/company-settings', 'get') }
export function saveCompanySettings(data: Record<string, any>) { return createAPI<ApiEnvelope>('/salarys/company-settings', 'post', data) }
export function getTips(yearMonth: string) { return createAPI<ApiEnvelope>(`/salarys/tips/${yearMonth}`, 'get') }
export function getSettings() { return createAPI<ApiEnvelope>('/salarys/settings', 'get') }
export function saveSettings(data: Record<string, any>) { return createAPI<ApiEnvelope>('/salarys/settings', 'post', data) }
export function initSalary(userId: string) { return createAPI<ApiEnvelope>(`/salarys/init/${userId}`, 'post') }
export function changeSalary(userId: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/salarys/modify/${userId}`, 'post', data) }
export function getSalary(userId: string) { return createAPI<ApiEnvelope>(`/salarys/modify/${userId}`, 'get') }
export function getDetail(userId: string) { return createAPI<ApiEnvelope>(`/salarys/${userId}`, 'get') }
export function getArchivingCont(yearMonth: string) { return createAPI<ApiEnvelope>(`/salarys/reports/${yearMonth}`, 'get') }
export function newReport(yearMonth: string, data?: Record<string, any>) { return createAPI<ApiEnvelope>(`/salarys/reports/${yearMonth}/newReport`, 'put', data) }
export function getArchivingExport(yearMonth: string) { return createDownload(`/salarys/reports/${yearMonth}/export`, 'get') }
export function getArchivingFirst(yearMonth: string) { return createAPI<ApiEnvelope>(`/salarys/reports/${yearMonth}/first`, 'get') }
export function getArchivingArchive(yearMonth: string, data?: Record<string, any>) { return createAPI<ApiEnvelope>(`/salarys/reports/${yearMonth}/archive`, 'post', data) }
export function getArchivingList(year: string) { return createAPI<ApiEnvelope>(`/salarys/reports/${year}/list`, 'get') }
export function dimission(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/dimission', 'put', data) }
export function applyOvertime(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/overtime', 'put', data) }
export function applyLeave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/apply/leave', 'put', data) }
export function approvalsList(params?: Record<string, any>) { return createAPI<ApiEnvelope>('/user/approvals', 'get', params) }
export function regularWorker(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/user/approvals/${id}/regularWorker`, 'put', data) }
