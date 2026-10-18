import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let usePagedList

before(async () => {
  server = await createServer({
    mode: 'test',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  ;({ usePagedList } = await server.ssrLoadModule('/src/composables/usePagedList.ts'))
})

after(async () => {
  await server?.close()
})

test('late responses are discarded so stale data never overwrites newer results', async () => {
  const pending = []
  const list = usePagedList((page) => new Promise((resolve) => pending.push({ page, resolve })))
  const stale = list.load()
  const fresh = list.search()
  assert.equal(pending.length, 2)
  pending[1].resolve({ items: ['fresh'], total: 1 })
  pending[0].resolve({ items: ['stale'], total: 1 })
  assert.equal(await stale, null)
  assert.deepEqual(await fresh, { items: ['fresh'], total: 1 })
  assert.deepEqual(list.rows.value, ['fresh'])
  assert.equal(list.loading.value, false)
})

test('search resets page to 1 and issues exactly one request', async () => {
  const pages = []
  const list = usePagedList(async (page) => {
    pages.push(page)
    return { items: [], total: 0 }
  })
  list.page.value = 3
  await list.search()
  assert.deepEqual(pages, [1])
  assert.equal(list.page.value, 1)
})

test('prev and next refuse to move while loading or beyond page bounds', async () => {
  const pages = []
  let release
  let shouldHang = true
  const list = usePagedList((page) => {
    pages.push(page)
    if (!shouldHang) return Promise.resolve({ items: ['row'], total: 40 })
    shouldHang = false
    return new Promise((resolve) => (release = resolve))
  })
  const first = list.load()
  assert.equal(list.canPrev.value, false)
  assert.equal(list.canNext.value, false)
  await list.prev()
  await list.next()
  assert.deepEqual(pages, [1])
  release({ items: ['row'], total: 40 })
  await first
  assert.equal(list.canPrev.value, false)
  assert.equal(list.canNext.value, true)
  await list.next()
  assert.deepEqual(pages, [1, 2])
  assert.equal(list.page.value, 2)
  await list.prev()
  assert.deepEqual(pages, [1, 2, 1])
})

test('failed loads surface through onError and error clears on the next attempt', async () => {
  const failures = []
  let shouldFail = true
  const list = usePagedList(
    async () => {
      if (shouldFail) throw new Error('boom')
      return { items: ['ok'], total: 1 }
    },
    { onError: (error) => failures.push(error.message), errorFallback: '加载失败' },
  )
  assert.equal(await list.load(), null)
  assert.deepEqual(failures, ['boom'])
  assert.equal(list.error.value, 'boom')
  shouldFail = false
  await list.load()
  assert.deepEqual(list.rows.value, ['ok'])
  assert.equal(list.error.value, '')
})

test('enabled gate skips the request without entering loading state', async () => {
  const list = usePagedList(async () => ({ items: ['row'], total: 1 }), { enabled: () => false })
  assert.equal(await list.load(), null)
  assert.equal(list.loading.value, false)
  assert.deepEqual(list.rows.value, [])
})
