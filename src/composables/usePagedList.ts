import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface PagedResult<T> {
  items: T[]
  total: number
}

export interface UsePagedListOptions {
  /** 为 false 时 load 静默跳过（不请求、不进入 loading），用于未登录守卫。 */
  enabled?: () => boolean
  /** 加载失败回调（仅当本请求仍是最新一次时触发），常用于 ElMessage 提示。 */
  onError?: (error: unknown) => void
  /** 失败且 error 不是 Error 实例时写入 error 的兜底文案。 */
  errorFallback?: string
  pageSize?: number
}

export interface UsePagedListReturn<R extends PagedResult<unknown>> {
  rows: Ref<R['items']>
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  loading: Ref<boolean>
  error: Ref<string>
  canPrev: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
  load: () => Promise<R | null>
  search: () => Promise<R | null>
  goTo: (target: number) => Promise<R | null>
  prev: () => Promise<R | null>
  next: () => Promise<R | null>
}

/**
 * 分页列表样板封装：rows/page/pageSize/total/loading 状态、revision 守卫的 load
 * （迟到响应直接丢弃，旧结果不会覆盖新请求）、loading 期间禁用的 prev/next
 * （防连点跳页），以及 search（重置 page=1 后只发一次请求）。
 *
 * page 不带 watcher：手动 load 与 ElPagination 的 current-change 不会互相触发，
 * 分页组件请用 v-model:current-page 绑 page、@current-change 调 goTo/load。
 */
export function usePagedList<R extends PagedResult<unknown>>(
  fetcher: (page: number, pageSize: number) => Promise<R>,
  options: UsePagedListOptions = {},
): UsePagedListReturn<R> {
  const { enabled, onError, errorFallback, pageSize: initialPageSize = 20 } = options
  const rows = ref<R['items']>([]) as Ref<R['items']>
  const page = ref(1)
  const pageSize = ref(initialPageSize)
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  const canPrev = computed(() => page.value > 1 && !loading.value)
  const canNext = computed(() => page.value * pageSize.value < total.value && !loading.value)
  let revision = 0

  async function load(): Promise<R | null> {
    if (enabled && !enabled()) return null
    const current = ++revision
    error.value = ''
    loading.value = true
    try {
      const result = await fetcher(page.value, pageSize.value)
      if (current !== revision) return null
      rows.value = result.items
      total.value = result.total
      return result
    } catch (cause) {
      if (current === revision) {
        error.value = cause instanceof Error ? cause.message : (errorFallback ?? '')
        onError?.(cause)
      }
      return null
    } finally {
      if (current === revision) loading.value = false
    }
  }

  async function search(): Promise<R | null> {
    page.value = 1
    return load()
  }

  function goTo(target: number): Promise<R | null> {
    page.value = target
    return load()
  }

  function prev(): Promise<R | null> {
    if (!canPrev.value) return Promise.resolve(null)
    return goTo(page.value - 1)
  }

  function next(): Promise<R | null> {
    if (!canNext.value) return Promise.resolve(null)
    return goTo(page.value + 1)
  }

  return {
    rows,
    page,
    pageSize,
    total,
    loading,
    error,
    canPrev,
    canNext,
    load,
    search,
    goTo,
    prev,
    next,
  }
}
