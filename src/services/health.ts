import { ApiError, isRecord, request } from './http'

export interface HealthStatus {
  status: 'ok'
  mysql: 'up'
  redis: 'up'
}

export async function getHealth(): Promise<HealthStatus> {
  const data = await request<unknown>('/health')
  if (!isRecord(data) || data.status !== 'ok' || data.mysql !== 'up' || data.redis !== 'up') {
    throw new ApiError('健康检查返回异常，服务依赖可能未就绪', 503)
  }
  return { status: 'ok', mysql: 'up', redis: 'up' }
}
