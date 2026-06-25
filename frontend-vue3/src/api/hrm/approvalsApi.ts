import { createAPI, createDownload } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function list(page: number, pageSize: number, data?: Record<string, any>) { return createAPI<ApiEnvelope>(`/user/process/instance/${page}/${pageSize}`, 'put', data) }
export function information(id: string) { return createAPI<ApiEnvelope>(`/user/process/instance/getById/${id}`, 'get') }
export function reviewHistory(id: string) { return createAPI<ApiEnvelope>(`/approvals/flows/${id}`, 'get') }
export function processOvertime(id: string) { return createAPI<ApiEnvelope>(`/user/process_overtime/getByProcessId/${id}`, 'get') }
export function processDimission(id: string) { return createAPI<ApiEnvelope>(`/user/process_dimission/getByProcessId/${id}`, 'get') }
export function processLeave(id: string) { return createAPI<ApiEnvelope>(`/user/process_leave/getByProcessId/${id}`, 'get') }
export function updateDeploy(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process/deploy', 'post', data) }
export function approvalsTypes() { return createAPI<ApiEnvelope>('/user/process/getFlowList', 'get') }
export function getFlowList() { return createAPI<ApiEnvelope>('/user/process/definition', 'get') }
export function suspend(key: string) { return createAPI<ApiEnvelope>(`/user/process/suspend/${key}`, 'get') }
export function getSetState() { return createAPI<ApiEnvelope>('/approvals/setting', 'get') }
export function saveSetState(data: Record<string, any>) { return createAPI<ApiEnvelope>('/approvals/setting', 'put', data) }
export function submitApprovals(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/approvals/${id}`, 'put', data) }
export function importApprovals(data: Record<string, any>) { return createAPI<ApiEnvelope>('/approvals/import', 'post', data) }
export function exportApprovals(month: string) { return createDownload(`/approvals/export/${month}`, 'get') }
export function process(data: Record<string, any>) { return createAPI<ApiEnvelope>('/approvals/process', 'post', data) }
export function applyOvertime(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process_overtime/startProcess', 'post', data) }
export function applyDimission(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process_dimission/startProcess', 'post', data) }
export function applyLeave(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process_leave/startProcess', 'post', data) }
export function approvalsList(data?: Record<string, any>) { return createAPI<ApiEnvelope>('/user/approvals', 'post', data) }
export function approvalsDetail(id: string) { return createAPI<ApiEnvelope>(`/user/process/instance/${id}`, 'get') }
export function approvalsTaskDetail(id: string) { return createAPI<ApiEnvelope>(`/user/process/instance/tasks/${id}`, 'get') }
export function approvalsDel(id: string) { return createAPI<ApiEnvelope>(`/user/approvals/${id}`, 'delete') }
export function approvalsPass(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process/instance/commit', 'put', data) }
export function approvalsReject(id: string, data: Record<string, any>) { return createAPI<ApiEnvelope>(`/user/approvals/${id}/reject`, 'put', data) }
export function startProcess(data: Record<string, any>) { return createAPI<ApiEnvelope>('/user/process/startProcess', 'post', data) }
