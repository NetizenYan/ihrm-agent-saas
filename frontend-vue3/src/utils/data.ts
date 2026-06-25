// 统一接口数据抽取：兼容后端多种返回结构（envelope.data 为数组 / {rows} / {data} / {list}）。
// createAPI 返回的是 HTTP body（即 {code,message,data} 信封），payload = res.data。
type Indexed = { [k: string]: any }

function payloadOf(res: any): any {
  if (res == null) return undefined
  if (Array.isArray(res)) return res
  const r = res as Indexed
  if (r && typeof r === 'object' && 'data' in r) return r.data
  return r
}

export function extractList(res: any): any[] {
  const p = payloadOf(res)
  if (Array.isArray(p)) return p
  if (p && typeof p === 'object') {
    for (const k of ['rows', 'data', 'list', 'items', 'records']) {
      if (Array.isArray((p as Indexed)[k])) return (p as Indexed)[k]
    }
  }
  return []
}

export function extractObject(res: any): Record<string, any> {
  const p = payloadOf(res)
  if (Array.isArray(p) || p == null) return {}
  if (typeof p === 'object') {
    const inner = (p as Indexed).data
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner
    return p as Record<string, any>
  }
  return {}
}

export function extractTotal(res: any): number {
  const p = payloadOf(res)
  if (p && typeof p === 'object') {
    for (const k of ['total', 'counts', 'count', 'totalCount']) {
      const v = (p as Indexed)[k]
      if (typeof v === 'number') return v
    }
  }
  return 0
}
