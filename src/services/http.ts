import { appConfig } from '@/config/app'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string
  timeoutMs?: number
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, timeoutMs = 10000, ...init } = options
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const abort = () => controller.abort()
  if (init.signal?.aborted) abort()
  else init.signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, timeoutMs)

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message = isRecord(payload) ? payload.message : undefined
      throw new ApiError(
        typeof message === 'string'
          ? message
          : Array.isArray(message) && message.every((item) => typeof item === 'string')
            ? message.join('；')
            : `请求失败（${response.status}）`,
        response.status,
      )
    }
    if (!isRecord(payload) || !('data' in payload)) {
      throw new ApiError('服务响应格式异常，请检查 API 地址', response.status)
    }
    return payload.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) throw new ApiError('请求已取消或超时，请重试', 0)
    throw new ApiError('无法连接服务，请检查服务是否启动', 0)
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', abort)
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
