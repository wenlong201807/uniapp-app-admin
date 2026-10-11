# F05 部门管理技术方案

状态：方案已形成，功能代码尚未实施。依赖 F01 独立管理员身份和 F02 导航。三仓写权限及 Git 审批故障未解决前，不把 F05 代码混入当前 F01 工作区。

## 参考与适配

参考本机 `python-sys/RuoYi-Vue3-FastAPI` 的 `module_admin/service/dept_service.py`、`entity/do/dept_do.py` 和前端 `views/system/dept/index.vue`。保留树、搜索、排序、负责人/电话/邮箱、启停和上级排除子树规则；适配 NestJS/Prisma/MySQL、UUID、ACTIVE/DISABLED 及 `{ data }` 协议，不复制 Python DTO、数字 ID 或 ancestors 字符串。

## 三端范围和分支

| 仓库   | 分支                   | 范围                                                               |
| ------ | ---------------------- | ------------------------------------------------------------------ |
| 服务端 | feat/ruoyi-departments | 模型、迁移、管理员 CRUD、树约束、自身部门 DTO、审计、Swagger、测试 |
| 管理端 | feat/ruoyi-departments | `/organization/departments` 树表、筛选、编辑、启停、排序、受控删除 |
| 客户端 | feat/ruoyi-departments | 账户信息消费自己的可选部门，不提供部门维护或全局组织目录           |

从各仓已完成的依赖分支本地 HEAD 创建同名功能分支，记录 base/head 和迁移；仅本地提交，不推送、不合并 main。客户端保留离线功能、普通认证、私人任务/媒体、版本与应用标识，不读取 `secrets/`。

## 数据模型

Department 使用 UUID 主键、可空 parentId 自引用、name（1–50 字符）、orderNum（0–999999 整数）、leader（可空，最大 50）、phone（可空，最大 30）、email（可空，最大 254）、status、createdAt、updatedAt 和 revision。parentId 索引；按 orderNum、createdAt、id 稳定排序。不填入虚构初始部门。

User 和 AdminAccount 分别增加可空 departmentId，外键 RESTRICT；默认 null，保留既有登录响应兼容。F04 实现成员分配入口；本阶段用户不能通过普通资料接口自行指定部门。普通 `/auth/me` 仅增加可选 `department: { id, name } | null`，原字段不变；已禁用部门仍可作为历史所属部门显示。

同级重名以 trim、Unicode NFC、固定小写规则后的名称判定，包括根部门。保存父作用域和规范名称计算的 siblingKey，使用唯一索引覆盖根节点，避免 MySQL 复合唯一键含 null 时根部门重复。父变更或更名同步更新 siblingKey；规范化规则固定版本并写入测试。

另设单行 DepartmentTreeLock，在迁移中初始化。所有组织写事务首先锁定此行，再查询与校验，避免两个并发移动形成环、添加子节点与删除竞态、停用父级与新增启用子级竞态。数据库锁覆盖多个服务实例，不能用进程内互斥代替。写入 revision 作乐观并发检查，过期更新返回 409；事务失败不留下部分排序或层级变更。

## API 和授权

所有路径以 `/api/v1` 为前缀，响应继续由现有 interceptor 包装 `{ data }`。所有 `/admin/departments` 使用 `@Public()` 跳过普通用户 guard 后再显式绑定 AdminAuthGuard；AuthModule 导出 guard 所需 provider，由部门模块导入。普通用户 token 和匿名请求必须拒绝。F08 之前使用固定管理员权限目录；F08 接入角色后按同一权限 key 筛选。

| 方法与路径                    | 请求/结果                                          | 权限               |
| ----------------------------- | -------------------------------------------------- | ------------------ |
| GET /admin/departments        | q/status 筛选，返回树；保留命中节点的祖先用于定位  | system:dept:list   |
| GET /admin/departments/:id    | 单项及 revision                                    | system:dept:query  |
| POST /admin/departments       | 创建输入，parentId 可空；返回节点                  | system:dept:add    |
| PATCH /admin/departments/:id  | 完整编辑输入与 expectedRevision；返回新节点        | system:dept:edit   |
| DELETE /admin/departments/:id | expectedRevision；无子节点/成员才删除              | system:dept:remove |
| PUT /admin/departments/order  | 同父级 id/orderNum/expectedRevision 数组，原子更新 | system:dept:edit   |

DTO 使用 class-validator、Swagger，拒绝未知属性、非法 UUID、重复 ID、负数或小数排序、无效邮箱；q 最大 50 字符，批量排序最多 100 项。404 表示节点不存在；409 表示并发或业务约束冲突；不能由前端传入权限、祖先链或审计主体。

## 树约束

1. 上级必须存在且启用；禁止自身或任何后代作为上级。逐级遍历以 visited 集合和深度限制验证，深度最多 32，损坏数据返回受控错误。
2. 新建启用节点、启用既有节点或移动至新上级时，要求祖先链均启用；移动禁用子树同样不可挂入禁用上级。
3. 有启用后代时拒绝停用，返回明确冲突；同父级包括根节点不可重名。
4. 含任意状态子节点或 User/AdminAccount 成员时拒绝删除；外键是最终保障。部门删除不删除用户、任务或媒体。
5. 排序仅允许同父级节点；重复 ID、重复 orderNum、缺失 ID、revision 冲突全部拒绝，整批事务回滚。
6. 所有新增/修改/排序/删除记录真实管理员、对象 ID、时间、变更字段和结果；F13 接管查询。审计不记录 token、密码或无关私人数据。

## 管理端行为

API 模块放 `src/services/admin-departments.ts`，复用请求层；写请求不自动重试，避免重复操作。默认树表按真实服务数据展示，空库显示“暂无部门”，未上线 API 明确显示“部门管理尚未支持”并禁用维护入口。

搜索支持名称和状态、重置、展开/收起。新增/编辑使用 Element Plus 表单、树选择器、状态开关和数字输入；上级候选排除自己及整棵后代树，禁用节点不可选。删除有确认及失败反馈，冲突刷新数据。排序采用数字编辑与一次保存；提交期间禁用重复操作，失败保留输入。后台规则始终再校验。

字段和操作在窄屏可滚动，编辑对话框不溢出。权限按钮只消费服务端目录/权限，不能凭普通用户登录显示管理能力；未知导航组件不加载。部门页导航须加入 F02 编译期目录及服务端同一权限目录。

## 验证和交付

服务端在隔离 MySQL 数据库验证迁移与管理员 API：匿名/普通用户拒绝、空树、同级重名（含根及并发）、跨级重名、过滤保留祖先、自身/后代/深度约束、禁用约束、子节点/成员删除限制、批量排序原子性、过期 revision、并发相互移动和新增/删除竞态。审计只查本次产生的事件；测试不清理实际业务账号。

管理端运行 `pnpm test`、`pnpm check`、`pnpm build`，浏览器检查真实 API 的创建/编辑/移动/排序/删除、空态/错误态、权限直达和桌面/窄屏。客户端运行 `pnpm check`、`pnpm test` 及相关 H5 构建，验证 department 字段存在/缺失/null 均不破坏原账户信息，私人任务/媒体保持 owner 隔离。受控 HTTP 测试不能代替真实三端联调。

先在隔离环境应用迁移并部署服务端，再更新管理端与客户端。回滚应用代码时保留新增表/可空字段，不直接 DROP 包含实际组织信息的数据；恢复旧页面不暴露维护入口。交付记录列出真实 SHA、迁移、权限、命令和未完成项，不将本方案记作已部署功能。
