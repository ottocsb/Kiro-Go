// 统一的 admin API 客户端。对齐原 app.js 的 api()：注入 X-Admin-Password 头、
// 自动 Content-Type、不做全局 401 拦截（由调用方按需处理）。
import { getPassword } from './auth'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface ApiOpts extends Omit<RequestInit, 'body'> {
  body?: unknown
}

/** 底层请求：返回原始 Response（与旧版 api() 等价） */
export function apiFetch(path: string, opts: ApiOpts = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'X-Admin-Password': getPassword(),
    ...(opts.headers as Record<string, string> | undefined),
  }
  const { body, ...rest } = opts
  const init: RequestInit = { ...rest, headers }
  if (body !== undefined) {
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  return fetch('/admin/api' + path, init)
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (data && typeof data.error === 'string') return data.error
  } catch {
    /* 非 JSON 错误体 */
  }
  return `HTTP ${res.status}`
}

/** 解析 JSON 并在 !ok 时抛出 ApiError */
export async function request<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const res = await apiFetch(path, opts)
  if (!res.ok) throw new ApiError(await parseError(res), res.status)
  return (await res.json()) as T
}

export const apiGet = <T = unknown>(path: string) => request<T>(path)
export const apiPost = <T = unknown>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body })
export const apiPut = <T = unknown>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body })
export const apiDelete = <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' })
