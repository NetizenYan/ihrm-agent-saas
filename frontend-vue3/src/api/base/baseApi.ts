import { createAPI, createDownload } from '@/api/request'
import type { ApiEnvelope } from '@/api/base/frame'

export function imgUpload(data: FormData) { return createAPI<ApiEnvelope>('/system/upfile', 'post', data) }
export function imgDownload(id: string) { return createDownload(`/system/upfile/${id}`, 'get') }
export function cityList() { return createAPI<ApiEnvelope>('/sys/city', 'get') }
