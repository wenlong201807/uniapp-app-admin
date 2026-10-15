import { request } from './http'
export interface Department {
  id: string
  parentId: string | null
  name: string
  orderNum: number
  leader: string
  phone: string
  email: string
  enabled: boolean
  revision: number
}
export interface Position {
  id: string
  code: string
  name: string
  orderNum: number
  enabled: boolean
  revision: number
  _count?: { accounts: number }
}
export type DepartmentInput = Omit<Department, 'id' | 'revision'>
export type PositionInput = Omit<Position, 'id' | 'revision' | '_count'>
export const getDepartments = (token: string, q = '') =>
  request<{ items: Department[]; total: number }>(
    `/admin/departments${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    { token },
  )
export const createDepartment = (token: string, body: DepartmentInput) =>
  request<Department>('/admin/departments', { method: 'POST', token, body })
export const updateDepartment = (
  token: string,
  id: string,
  body: DepartmentInput & { expectedRevision: number },
) => request<Department>(`/admin/departments/${id}`, { method: 'PATCH', token, body })
export const deleteDepartment = (token: string, id: string, expectedRevision: number) =>
  request<{ deleted: boolean }>(`/admin/departments/${id}`, {
    method: 'DELETE',
    token,
    body: { expectedRevision },
  })
export const getPositions = (token: string, q = '') =>
  request<{ items: Position[]; total: number }>(
    `/admin/positions${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    { token },
  )
export const createPosition = (token: string, body: PositionInput) =>
  request<Position>('/admin/positions', { method: 'POST', token, body })
export const updatePosition = (
  token: string,
  id: string,
  body: PositionInput & { expectedRevision: number },
) => request<Position>(`/admin/positions/${id}`, { method: 'PATCH', token, body })
export const deletePosition = (token: string, id: string, expectedRevision: number) =>
  request<{ deleted: boolean }>(`/admin/positions/${id}`, {
    method: 'DELETE',
    token,
    body: { expectedRevision },
  })

export function departmentOptions(rows: Department[], excludeId?: string): Department[] {
  const excluded = new Set(excludeId ? [excludeId] : [])
  let changed = true
  while (changed) {
    changed = false
    for (const row of rows)
      if (row.parentId && excluded.has(row.parentId) && !excluded.has(row.id)) {
        excluded.add(row.id)
        changed = true
      }
  }
  return rows.filter((row) => row.enabled && !excluded.has(row.id))
}
export interface DepartmentNode extends Department {
  children: DepartmentNode[]
}
export function departmentTree(rows: Department[], q = '', state = ''): DepartmentNode[] {
  const nodes = new Map(rows.map((row) => [row.id, { ...row, children: [] as DepartmentNode[] }]))
  const visible = new Set<string>()
  for (const row of rows) {
    if (
      !row.name.toLowerCase().includes(q.trim().toLowerCase()) ||
      (state && String(row.enabled) !== state)
    )
      continue
    let cursor: Department | undefined = row
    while (cursor && !visible.has(cursor.id)) {
      visible.add(cursor.id)
      cursor = cursor.parentId ? nodes.get(cursor.parentId) : undefined
    }
  }
  const roots: DepartmentNode[] = []
  for (const node of nodes.values()) {
    if (!visible.has(node.id)) continue
    const parent = node.parentId ? nodes.get(node.parentId) : undefined
    if (parent && visible.has(parent.id)) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}
