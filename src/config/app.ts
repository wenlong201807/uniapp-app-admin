export const appConfig = {
  name: '此刻',
  version: '0.1.0',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, ''),
  apiDocsUrl: `${(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/docs`,
} as const
