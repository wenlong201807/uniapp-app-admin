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
const originalSessionStorage = globalThis.sessionStorage
// Node has no sessionStorage global; emulate the tab-scoped Web storage.
const storageMap = new Map()
globalThis.sessionStorage = {
  getItem: (key) => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, String(value)),
  removeItem: (key) => storageMap.delete(key),
}
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
    mode: 'test',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  authModule = await server.ssrLoadModule('/src/stores/admin-auth.ts')
  routesModule = await server.ssrLoadModule('/src/stores/admin-routes.ts')
  catalog = await server.ssrLoadModule('/src/services/admin-routes.ts')
  ;({ ApiError } = await server.ssrLoadModule('/src/services/http.ts'))
})
beforeEach(() => {
  storageMap.clear()
  const pinia = createPinia()
  auth = authModule.useAdminAuthStore(pinia)
  navigation = routesModule.useAdminRoutesStore(pinia)
})
after(async () => {
  globalThis.fetch = originalFetch
  globalThis.sessionStorage = originalSessionStorage
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
  // Since the 401 self-heal wiring, a failed identity check first attempts a
  // single-flight refresh; when that also fails the session is cleared and
  // ensureSession resolves false (state changed) instead of rejecting. The
  // router guard sends the admin to the login page either way.
  assert.equal(await auth.ensureSession(), false)
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
  assert.deepEqual(
    navigation.routes,
    catalog.staticAdminRoutes.filter((route) => ['/overview', '/system'].includes(route.path)),
  )
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
  assert.deepEqual(navigation.routes, [])
  assert.equal(navigation.loaded, false)
  assert.equal(navigation.hasRemoteRoutes, false)
})

test('risk review requests keep their explicit action and never transmit a trusted verdict', async () => {
  const risk = await server.ssrLoadModule('/src/services/admin-integrity.ts')
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    return response({ verification: 'UNVERIFIED' })
  }
  await risk.reviewIntegrityReport('access-one', 'report-one', 'FOLLOW_UP')
  assert.ok(calls[0].url.endsWith('/admin/integrity/reports/report-one/review'))
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), { review: 'FOLLOW_UP' })
  await risk.deleteIntegrityReport('access-one', 'report-one')
  assert.equal(calls[1].options.method, 'DELETE')
  await risk.listIntegrityReports('access-one', { page: 1, q: 'example@local', review: 'PENDING' })
  const url = new URL(calls[2].url, 'http://localhost')
  assert.equal(url.searchParams.get('q'), 'example@local')
  assert.equal(url.searchParams.get('review'), 'PENDING')
})

test('a reloaded store restores the session from the tab-scoped refresh token', async () => {
  await login()
  assert.equal(storageMap.get('moment-admin-refresh-token'), session.refreshToken)
  const reloaded = authModule.useAdminAuthStore(createPinia())
  assert.equal(reloaded.isAuthenticated, false)
  let requests = 0
  globalThis.fetch = async () => {
    requests += 1
    return requests === 1 ? response({ ...session, accessToken: 'access-two' }) : response(admin)
  }
  assert.equal(await reloaded.ensureSession(), true)
  assert.equal(requests, 2)
  assert.equal(reloaded.accessToken, 'access-two')
  assert.equal(storageMap.get('moment-admin-refresh-token'), session.refreshToken)
})

test('an invalid stored refresh token clears storage and falls back to login', async () => {
  storageMap.set('moment-admin-refresh-token', 'stale-token')
  const reloaded = authModule.useAdminAuthStore(createPinia())
  globalThis.fetch = async () => response(null, 401)
  assert.equal(await reloaded.ensureSession(), false)
  assert.equal(storageMap.get('moment-admin-refresh-token'), undefined)
})

test('clear removes the tab-scoped refresh token', async () => {
  await login()
  assert.notEqual(storageMap.get('moment-admin-refresh-token'), undefined)
  auth.clear()
  assert.equal(storageMap.get('moment-admin-refresh-token'), undefined)
})

test('department options exclude the entire edited subtree and disabled nodes; search preserves ancestors', async () => {
  const organization = await server.ssrLoadModule('/src/services/admin-organization.ts')
  const rows = [
    { id: 'root', parentId: null, name: '总部', enabled: true },
    { id: 'child', parentId: 'root', name: '研发', enabled: true },
    { id: 'leaf', parentId: 'child', name: '客户端', enabled: true },
    { id: 'other', parentId: null, name: '运营', enabled: true },
    { id: 'disabled', parentId: null, name: '历史', enabled: false },
  ]
  assert.deepEqual(
    organization.departmentOptions(rows, 'child').map((row) => row.id),
    ['root', 'other'],
  )
  const tree = organization.departmentTree(rows, '客户端')
  assert.equal(tree.length, 1)
  assert.equal(tree[0].children[0].children[0].id, 'leaf')
  assert.deepEqual(
    organization.departmentTree(rows, '', 'false').map((row) => row.id),
    ['disabled'],
  )
})

test('organization and system writes transmit revisions and explicit nullable assignments', async () => {
  const organization = await server.ssrLoadModule('/src/services/admin-organization.ts')
  const system = await server.ssrLoadModule('/src/services/admin-system.ts')
  const rbac = await server.ssrLoadModule('/src/services/admin-rbac.ts')
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    return response({})
  }
  await organization.deleteDepartment('access', 'department', 3)
  await rbac.updateAdminMember('access', 'admin', {
    departmentId: null,
    positionIds: [],
    roleId: null,
  })
  await system.updateSystemMenu('access', {
    path: '/media',
    title: '媒体',
    orderNum: 1,
    enabled: false,
    expectedRevision: 2,
  })
  assert.equal(calls[0].options.method, 'DELETE')
  assert.deepEqual(JSON.parse(calls[0].options.body), { expectedRevision: 3 })
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    departmentId: null,
    positionIds: [],
    roleId: null,
  })
  assert.equal(JSON.parse(calls[2].options.body).expectedRevision, 2)
})
