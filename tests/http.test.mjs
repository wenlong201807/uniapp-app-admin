import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let request
let ApiError
const originalFetch = globalThis.fetch
const response = (body, status = 200) => new Response(JSON.stringify(body), { status })
// Mimics native fetch abort semantics: a pending request rejects once its signal
// aborts, and an already-aborted signal rejects immediately.
const hangingFetch = () => (url, options) =>
  new Promise((_, reject) => {
    if (options.signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }
    options.signal.addEventListener('abort', () =>
      reject(new DOMException('aborted', 'AbortError')),
    )
  })

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  ;({ request, ApiError } = await server.ssrLoadModule('/src/services/http.ts'))
})
after(async () => {
  globalThis.fetch = originalFetch
  await server?.close()
})

test('unwraps the {data} envelope and sends JSON headers with bearer token', async () => {
  let seen
  globalThis.fetch = async (url, options) => {
    seen = { url: String(url), options }
    return response({ data: { ok: true } })
  }
  const result = await request('/admin/routes', { body: { page: 1 }, token: 'token-one' })
  assert.deepEqual(result, { ok: true })
  assert.equal(seen.url, '/api/v1/admin/routes')
  assert.equal(seen.options.headers.get('Authorization'), 'Bearer token-one')
  assert.equal(seen.options.headers.get('Content-Type'), 'application/json')
  assert.equal(seen.options.body, JSON.stringify({ page: 1 }))
})

test('server error messages are normalized into ApiError with status', async () => {
  globalThis.fetch = async () => response({ message: 'nope' }, 403)
  await assert.rejects(request('/admin/routes'), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 403)
    assert.equal(error.message, 'nope')
    return true
  })
})

test('array validation messages are joined with a Chinese semicolon', async () => {
  globalThis.fetch = async () => response({ message: ['first', 'second'] }, 422)
  await assert.rejects(request('/admin/routes'), (error) => {
    assert.equal(error.status, 422)
    assert.equal(error.message, 'first；second')
    return true
  })
})

test('responses without the {data} envelope are rejected', async () => {
  globalThis.fetch = async () => response({ something: 'else' })
  await assert.rejects(request('/admin/routes'), (error) => {
    assert.ok(error instanceof ApiError)
    assert.match(error.message, /格式异常/)
    return true
  })
})

test('network failures collapse to ApiError with status 0', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed')
  }
  await assert.rejects(request('/admin/routes'), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 0)
    assert.match(error.message, /无法连接/)
    return true
  })
})

test('requests time out and surface a retry hint', async () => {
  globalThis.fetch = hangingFetch()
  await assert.rejects(request('/admin/routes', { timeoutMs: 20 }), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 0)
    assert.match(error.message, /超时/)
    return true
  })
})

test('a pre-aborted caller signal rejects immediately', async () => {
  globalThis.fetch = hangingFetch()
  await assert.rejects(request('/admin/routes', { signal: AbortSignal.abort() }), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 0)
    assert.match(error.message, /取消或超时/)
    return true
  })
})
