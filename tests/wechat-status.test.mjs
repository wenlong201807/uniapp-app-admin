import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getWechatStatus
const originalFetch = globalThis.fetch
const response = (body, status = 200) => new Response(JSON.stringify(body), { status })
const statusPayload = {
  wechat: { configured: true },
  wecom: { configured: false, customerMoments: false },
  origins: { wechat: ['https://h5.example.com'], wecom: [] },
  checkedAt: '2026-10-24T00:00:00.000Z',
}

before(async () => {
  // mode: 'test' keeps the suite hermetic (see tests/http.test.mjs for the pitfall).
  server = await createServer({
    mode: 'test',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  ;({ getWechatStatus } = await server.ssrLoadModule('/src/services/admin-system.ts'))
})
after(async () => {
  globalThis.fetch = originalFetch
  await server?.close()
})

test('wechat status hits the admin endpoint with bearer token and unwraps the envelope', async () => {
  let seen
  globalThis.fetch = async (url, options) => {
    seen = { url: String(url), options }
    return response({ data: statusPayload })
  }
  const result = await getWechatStatus('admin-token')
  assert.deepEqual(result, statusPayload)
  assert.equal(seen.url, '/api/v1/admin/wechat/status')
  assert.equal(seen.options.headers.get('Authorization'), 'Bearer admin-token')
})

test('empty origin lists survive the unwrap so the panel renders 未配置', async () => {
  globalThis.fetch = async () =>
    response({ data: { ...statusPayload, origins: { wechat: [], wecom: [] } } })
  const result = await getWechatStatus('t')
  assert.deepEqual(result.origins.wechat, [])
  assert.deepEqual(result.origins.wecom, [])
})

test('a permission failure rejects with status instead of rendering partial state', async () => {
  globalThis.fetch = async () => response({ message: '需要系统设置权限' }, 403)
  await assert.rejects(getWechatStatus('t'), (error) => {
    assert.equal(error.status, 403)
    assert.equal(error.message, '需要系统设置权限')
    return true
  })
})
