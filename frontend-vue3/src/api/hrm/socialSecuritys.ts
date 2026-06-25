import { createAPI, createDownload } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(data?: Record<string, any>) { return createAPI<ApiEnvelope>('/social_securitys/list', 'post', data) }
export function getSettings() { return createAPI<ApiEnvelope>('/social_securitys/settings', 'get') }
export function saveSettings(data: Record<string, any>) { return createAPI<ApiEnvelope>('/social_securitys/settings', 'post', data) }
export function getTips(yearMonth: string) { return createAPI<ApiEnvelope>(`/social_securitys/tips/${yearMonth}`, 'get') }
export function getContent(userId: string) { return createAPI<ApiEnvelope>(`/social_securitys/${userId}`, 'get') }
export function saveContent(userId: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/social_securitys/${userId}`, 'put', data) }
export function importFill(data: Record<string, any>) { return createAPI<ApiEnvelope>('/social_securitys/import', 'post', data) }
export function paymentItemList(id: string) { return createAPI<ApiEnvelope>(`/social_securitys/payment_item/${id}`, 'get') }
export function getArchivingList(year: string) { return createAPI<ApiEnvelope>(`/social_securitys/historys/${year}/list`, 'get') }
export function getArchivingCont(yearMonth: string) { return createAPI<ApiEnvelope>(`/social_securitys/historys/${yearMonth}`, 'get') }
export function getArchivingExport(yearMonth: string) { return createDownload(`/social_securitys/historys/${yearMonth}/export`, 'get') }
export function getArchivingFirst(yearMonth: string) { return createAPI<ApiEnvelope>(`/social_securitys/historys/${yearMonth}/first`, 'get') }
export function getArchivingArchive(yearMonth: string, data?: Record<string, any>) { return createAPI<ApiEnvelope>(`/social_securitys/historys/${yearMonth}/archive`, 'post', data) }
export function newReport(yearMonth: string, data?: Record<string, any>) { return createAPI<ApiEnvelope>(`/social_securitys/historys/${yearMonth}/newReport`, 'put', data) }
export function historysData(userId: string, yearMonth: string) { return createAPI<ApiEnvelope>(`/social_securitys/historys/archiveDetail/${userId}/${yearMonth}`, 'get') }
