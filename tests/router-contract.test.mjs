import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let catalog

before(async () => {
  server = await createServer({
    mode: 'test',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  catalog = await server.ssrLoadModule('/src/services/admin-routes.ts')
})

after(async () => {
  await server?.close()
})

test('every requiresPermission route path is registered in staticAdminRoutes', async () => {
  // The router module itself calls createWebHistory at import time, which needs
  // a DOM; instead extract the guarded child paths from the route source. The
  // guard (router/index.ts) compares to.path against visibleRoutes paths, and
  // visibleRoutes is the intersection with staticAdminRoutes — so a guarded
  // route missing from the catalog would be permanently "/forbidden".
  const source = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
  const guarded = [...source.matchAll(/path:\s*'([^']+)'[^}]*?requiresPermission:\s*true/g)].map(
    (match) => `/${match[1]}`,
  )
  assert.ok(guarded.length >= 20, `expected the full route table, found ${guarded.length}`)
  const catalogPaths = new Set(catalog.staticAdminRoutes.map((route) => route.path))
  const missing = guarded.filter((path) => !catalogPaths.has(path))
  assert.deepEqual(
    missing,
    [],
    'requiresPermission routes missing from staticAdminRoutes become unreachable (/forbidden)',
  )
  // Both lists should stay in lockstep: no dead catalog entries either.
  const guardedSet = new Set(guarded)
  const dead = [...catalogPaths].filter((path) => !guardedSet.has(path))
  assert.deepEqual(dead, [], 'staticAdminRoutes entries without a router page are dead weight')
})
