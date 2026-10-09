import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createServer } from 'vite'
import { createPinia } from 'pinia'

let server
let authModule
let routesModule
let catalog
let ApiError
let auth
let navigation
const originalFetch = globalThis.fetch
const admin = { id: 'admin-one', email: 'admin@example.com', displayName: '管理员', createdAt: '' }
const session = {
  admin,
  accessToken: 'access-one',
  refreshToken: 'refresh-one',
  tokenType: 'Bearer',
  expiresIn: 3600,
  refreshExpiresIn: 7200,
}
const response = (data, status = 200) =>
  new Response(JSON.stringify(status < 400 ? { data } : { message: 'denied' }), { status })
function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}
async function login() {
  globalThis.fetch = async () => response(session)
  await auth.login({ email: admin.email, password: 'test-only' })
}

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  authModule = await server.ssrLoadModule('/src/stores/admin-auth.ts')
  routesModule = await server.ssrLoadModule('/src/stores/admin-routes.ts')
  catalog = await server.ssrLoadModule('/src/services/admin-routes.ts')
  ;({ ApiError } = await server.ssrLoadModule('/src/services/http.ts'))
})
beforeEach(() => {
  const pinia = createPinia()
  auth = authModule.useAdminAuthStore(pinia)
  navigation = routesModule.useAdminRoutesStore(pinia)
})
after(async () => {
  globalThis.fetch = originalFetch
  await server?.close()
})

test('navigation accepts only registered path/name/permission pairs and removes duplicates', () => {
  const known = catalog.staticAdminRoutes[0]
  assert.deepEqual(
    catalog.normalizeAdminRoutes([
      known,
      known,
      { ...known, path: '//example.com' },
      { ...known, permission: 'admin:all' },
      { ...known, name: 'unexpected-component' },
      { ...known, children: [catalog.staticAdminRoutes[1]] },
    ]),
    [known],
  )
  for (const value of ['https://example.com', '//example.com', '/login', '/unknown', ['/system']]) {
    assert.equal(catalog.safeAdminRedirect(value), '/overview')
  }
  assert.equal(catalog.safeAdminRedirect('/system'), '/system')
})

test('late login cannot restore a cleared session', async () => {
  const pending = deferred()
  globalThis.fetch = () => pending.promise
  const result = auth.login({ email: admin.email, password: 'test-only' })
  const rejected = assert.rejects(result, /取消/)
  auth.clear()
  pending.resolve(response(session))
  await rejected
  assert.equal(auth.isAuthenticated, false)
})

test('logout clears local credentials before an unsuccessful server request', async () => {
  await login()
  const pending = deferred()
  globalThis.fetch = () => pending.promise
  const result = auth.logout()
  const rejected = assert.rejects(result, ApiError)
  assert.equal(auth.isAuthenticated, false)
  pending.resolve(response(null, 503))
  await rejected
  assert.equal(auth.accessToken, null)
})

test('concurrent refresh rotates once and a late result cannot undo logout', async () => {
  await login()
  const pending = deferred()
  let requests = 0
  globalThis.fetch = () => {
    requests += 1
    return pending.promise
  }
  const first = auth.refresh()
  const second = auth.refresh()
  const rejected = Promise.all([assert.rejects(first), assert.rejects(second)])
  assert.equal(requests, 1)
  auth.clear()
  pending.resolve(response({ ...session, accessToken: 'late-token' }))
  await rejected
  assert.equal(auth.isAuthenticated, false)
})

test('transient refresh failure retains the session for retry', async () => {
  await login()
  globalThis.fetch = async () => response(null, 503)
  await assert.rejects(auth.refresh(), ApiError)
  assert.equal(auth.isAuthenticated, true)
  globalThis.fetch = async () => response({ ...session, accessToken: 'access-two' })
  await auth.refresh()
  assert.equal(auth.accessToken, 'access-two')
})

test('revoked refresh invalidates the session', async () => {
  await login()
  globalThis.fetch = async () => response(null, 401)
  await assert.rejects(auth.refresh(), ApiError)
  assert.equal(auth.isAuthenticated, false)
})

test('navigation revalidates identity and concurrent checks share one request', async () => {
  await login()
  const pending = deferred()
  let requests = 0
  globalThis.fetch = () => {
    requests += 1
    return pending.promise
  }
  const first = auth.ensureSession()
  const second = auth.ensureSession()
  assert.equal(requests, 1)
  pending.resolve(response(admin))
  assert.deepEqual(await Promise.all([first, second]), [true, true])
  globalThis.fetch = async () => response(null, 401)
  await assert.rejects(auth.ensureSession(), ApiError)
  assert.equal(auth.isAuthenticated, false)
})

test('late identity check does not overwrite a new login', async () => {
  await login()
  const pending = deferred()
  globalThis.fetch = () => pending.promise
  const check = auth.ensureSession()
  globalThis.fetch = async () => response({ ...session, admin: { ...admin, id: 'admin-two' } })
  await auth.login({ email: 'second@example.com', password: 'test-only' })
  pending.resolve(response(admin))
  assert.equal(await check, false)
  assert.equal(auth.admin.id, 'admin-two')
})

test('missing navigation API permits only the existing basic pages', async () => {
  globalThis.fetch = async () => response(null, 404)
  await navigation.load('access')
  assert.deepEqual(navigation.routes, catalog.staticAdminRoutes)
  assert.equal(navigation.hasRemoteRoutes, false)
  assert.match(navigation.error, /尚未支持/)
})

test('empty remote grants and forbidden responses never enable fallback pages', async () => {
  globalThis.fetch = async () => response([])
  await navigation.load('access')
  assert.deepEqual(navigation.routes, [])
  assert.equal(navigation.hasRemoteRoutes, true)
  navigation.reset()
  globalThis.fetch = async () => response(null, 403)
  await navigation.load('access')
  assert.deepEqual(navigation.routes, [])
})

test('unauthorized or malformed navigation responses fail without fallback', async () => {
  for (const value of [response(null, 401), response({ routes: [] })]) {
    navigation.reset()
    globalThis.fetch = async () => value
    await assert.rejects(navigation.load('access'), ApiError)
    assert.deepEqual(navigation.routes, [])
    assert.equal(navigation.loaded, false)
  }
})

test('navigation shares in-flight loads and ignores responses after reset', async () => {
  const pending = deferred()
  let requests = 0
  globalThis.fetch = () => {
    requests += 1
    return pending.promise
  }
  const first = navigation.load('access')
  const second = navigation.load('access')
  assert.equal(requests, 1)
  navigation.reset()
  pending.resolve(response([catalog.staticAdminRoutes[1]]))
  await Promise.all([first, second])
  assert.deepEqual(navigation.routes, catalog.staticAdminRoutes)
  assert.equal(navigation.loaded, false)
  assert.equal(navigation.hasRemoteRoutes, false)
})
