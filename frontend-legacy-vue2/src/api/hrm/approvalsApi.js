import {createAPI, createFormAPI, createImgAPI} from '@/utils/request'

export const list = data => createAPI(`/user/process/instance/${data.page}/${data.pageSize}`, 'put', data)
export const information = data => createAPI(`/user/process/instance/getById/${data.processInstanceId}`, 'get', data)
export const reviewHistory = data => createAPI(`/approvals/flows/${data.id}`, 'get', data)
export const processOvertime = data => createAPI(`/user/process_overtime/getByProcessId/${data.process_id}`, 'get', data)
// 离职
export const processDimission = data => createAPI(`/user/process_dimission/getByProcessId/${data.process_id}`, 'get', data)
// 请假
export const processLeave = data => createAPI(`/user/process_leave/getByProcessId/${data.process_id}`, 'get', data)
// 图片下载
export const downImg = data => createImgAPI(`/user/process/buss/showBussImgById/${data.picture_id}`, 'get', data)
export const updateDeploy = data => createAPI(`/user/process/deploy`, 'post', data)

export const approvalsTypes = data => createAPI(`/user/process/getFlowList`, 'get', data)
export const getFlowList = data => createAPI(`/user/process/definition`, 'get', data)
export const suspend = data => createAPI(`/user/process/suspend/${data.processKey}`, 'get', data)

export const getSetState = data => createAPI(`/approvals/setting`, 'get', data)
export const saveSetState = data => createAPI(`/approvals/setting`, 'put', data)
export const submitApprovals = data => createAPI('/approvals/:id', 'put', data)
export const importApprovals = data => createAPI('/approvals/import', 'post', data)
export const exportApprovals = data => createAPI(`/approvals/export/${data.month}`, 'get', data)
export const process = data => createAPI('/approvals/process', 'post', data)
export const applyOvertime = data => createAPI('/user/process_overtime/startProcess', 'post', data)
export const applyDimission = data => createAPI('/user/process_dimission/startProcess', 'post', data)
export const applyeLave = data => createAPI('/user/process_leave/startProcess', 'post', data)
export const approvalsList = data => createAPI('/user/approvals', 'post', data)
export const approvalsDetail = data => createAPI(`/user/process/instance/${data.id}`, 'get', data)
export const approvalsTaskDetail = data => createAPI(`/user/process/instance/tasks/${data.id}`, 'get', data)
export const approvalsDel = data => createAPI(`/user/approvals/${data.id}`, 'delete', data)

export const approvalsPass = data => createAPI(`/user/process/instance/commit`, 'put', data)
export const approvalsReject = data => createAPI(`/user/approvals/${data.id}/reject`, 'put', data)
export const startProcess = data => createAPI('/user/process/startProcess', 'post', data)
