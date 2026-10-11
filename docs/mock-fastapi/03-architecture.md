# 三端架构与迁移方案

本文件是实施建议，不是已确认接口或已实施数据库设计。确定范围后，在对应功能分支落实 DTO、迁移和测试。

## 技术适配

| 参考实现                         | 目标方案                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| FastAPI、SQLAlchemy、Python      | NestJS 模块/Controller/Service、Prisma、TypeScript                       |
| MySQL/PostgreSQL 脚本            | 现有 MySQL + Prisma 有序迁移；不新增第二数据库                           |
| RuoYi JS 页面、混用组件/格式工具 | Vue3 script setup + TS、Element Plus、Pinia、Oxfmt/Oxlint                |
| APScheduler                      | Node 调度方案；持久化配置、注册任务函数、多实例锁；选型在 F16 开始时记录 |
| Python/SQL/Vue/JS 生成模板       | Nest/TS/Prisma 或 SQL 迁移/Vue3+TS 模板                                  |
| Python 插件自动发现              | Nest 可注册插件模块，编译/部署约束明确；不承诺任意运行时加载 Python 包   |
| Python 进程或 Java 风格监控展示  | Node 运行时、OS/容器指标与 Prisma/MySQL 健康                             |
| AI Python SDK                    | Node Provider 适配；首批供应商待确认，凭证仅服务端保存                   |

参考代码若复制或改编，保留 MIT 所要求的版权及许可；优先按功能重建，避免引入参考项目不需要的依赖与旧格式化工具。

## 身份模型：建议统一用户，区分管理身份与会话

复用现有 User UUID、邮箱登录和密码 hash，增加组织与管理属性，不迁移成参考自增 user_id。角色授予属于服务端受控操作，不能由注册表单赋予。

建议新建管理成员资料/关系（如 AdminMembership），与现有 User 关联：普通账户可没有管理成员资格；禁用、撤销成员资格与角色时，管理会话立即失效。保留账号本身与客户端业务身份。

管理登录通过独立端点创建带管理终端标识的会话；即使使用同一 User，普通客户端 token 也不能调用管理接口。JWT claim 与 Redis session 都验证终端/用途，不能只信请求中的 clientType。

F01 先提供最小管理员成员、bootstrap 权限与静态权限目录，保证首个分支可验收。F05～F08 再逐步加入组织、角色、菜单编辑；不在 F01 提前实现后续全部 CRUD，也不等待完整菜单系统才有可验证登录。

另一个可选方案是独立 AdminUser 表、独立账号密码。隔离更清晰，但会重复用户、资料与安全生命周期；需要用户确认后再选择。

## 认证兼容

保留现有 /api/v1/auth/* 和客户端密码/Passkey/设备密钥/OAuth 的已选用能力。当前未提交认证代码在确定基线之前不改写。

管理认证建议 /api/v1/admin/auth/*，包括 login、refresh、logout、me、captcha、unlock；登录响应保持 data 封装，返回用户、终端、权限摘要与现有 token 生命周期信息。

禁止将普通注册视为创建管理员。首次管理员通过一次性 CLI/bootstrap 流程设定，无固定共享默认密码。最后一个有效超级管理员不可被误删/停用/撤销。

前端使用 Pinia 会话与共享刷新 Promise，处理刷新 token 轮换、401 单次重试、退出/身份改变时丢弃旧响应；失败刷新区分网络异常和确切撤销。

管理端持久登录方案需确认。建议先内存 token，不保存密码；需要刷新页面保持登录时再采用受控 cookie/BFF 或明确的 token 存储方案。参考“记住密码”不直接复制为本项目默认行为。

注册开关、验证码开关等策略先由启动配置支撑 F01，F11 统一接管可动态调整的业务参数。

## RBAC 与数据范围

权限 key 可沿用参考风格，例如 system:user:list、system:user:add、system:role:edit、monitor:online:forceLogout；最终注册在受控目录中，与 API guard 和菜单按钮关联。

建议提供权限装饰器、管理域 guard 和有效权限解析服务。前端路由/按钮只是展示控制，所有查询与写入都由服务端授权。

角色停用、用户禁用、关系变化时更新权限版本并清理缓存/撤销管理会话；不能等 JWT 自然过期。批量分配防止管理员授予超过自己授权范围的能力。

数据范围支持参考的五类：全部、自定义部门、本部门、本部门及下级、仅本人。多角色按有效授权合并；无匹配授权默认拒绝。范围用于列表、详情、统计、更新、删除、批量和导出，不能只过滤列表。

Task/Media 的普通客户端 owner 隔离不因 RBAC 改变。若增加管理任务/媒体端点，要同时满足明确功能权限与业务数据范围。部门下的文件如何归属需固定为记录部门还是当前所有者部门，F09/F23 开始前写入规则。

目录/菜单/按钮、显隐与权限应分离：隐藏菜单不等于禁止 API；停用角色/权限须影响授权。Web 组件采用编译期白名单映射，外链限定协议，不能由数据库任意指定可执行模块。

## 建议模型分组

实际名称在迁移中确定；以下说明责任边界。

| 分组          | 候选实体或存储                                                                 | 注意事项                                                        |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 身份与组织    | User 扩展、AdminMembership、Department、Post、UserPost                         | 保留 UUID/邮箱/已有关系；用户名是否新增待确认；禁用与软删除规则 |
| RBAC          | Role、UserRole、Menu、RoleMenu、RoleDepartment、权限目录                       | 唯一编码、关系事务、版本、系统角色保护                          |
| 字典与参数    | DictType、DictItem、SystemConfig                                               | schema 校验、读取白名单、缓存版本                               |
| 公告          | Notice、NoticeRead                                                             | 用户读状态唯一；草稿/发布/撤回；XSS 清理                        |
| 审计          | OperationLog、LoginLog；可复用基础审计服务                                     | actor、终端、requestId、结果、脱敏摘要、时间、保留期            |
| 会话          | Redis session 与用户/终端索引                                                  | TTL、最近活跃、撤销；不暴露 refreshHash                         |
| 调度          | ScheduledJob、JobExecutionLog、Redis 分布式锁                                  | 配置持久、handler 白名单、幂等、运行实例与恢复                  |
| 文件          | ManagedFile、FileAcl、FileReference、FileAccessLog                             | 保留 Media owner 私密语义；元数据与存储双写一致性               |
| 生命周期/对账 | FileRetentionPolicy、FileRetentionNotice、FileReconcileRun、FileReconcileIssue | 游标、幂等、隔离、不可重复释放配额                              |
| 生成器        | GenTable、GenColumn、模板版本                                                  | schema/表白名单、命名校验、输出路径、生成结果可构建             |
| 插件          | Plugin、PluginMigration、PluginConfig、PluginOperationLog                      | 生命周期、依赖、schema、敏感配置加密、失败恢复                  |
| AI            | AiModel、AiSession、AiMessage、AiUserPreference                                | Provider key 加密、用户隔离、能力与限额；AI 可作为首个内置插件  |

每个功能分支新增自己的迁移与种子。主线应用后迁移不可改写；有关联依赖时基于已集成先决功能创建。已有数据库不能靠重新执行参考初始化 SQL 或重置现有数据库完成升级。

## API 约定

建议继续使用 /api/v1 前缀，并分开管理域与用户域。

| 能力                 | 建议前缀                                                                       | 谁可使用                   |
| -------------------- | ------------------------------------------------------------------------------ | -------------------------- |
| 既有认证/任务/媒体   | /auth、/tasks、/media                                                          | 保留当前客户端契约         |
| 管理认证与菜单       | /admin/auth、/admin/routers                                                    | 有效管理会话               |
| 系统管理             | /admin/system/users、roles、menus、departments、posts、dicts、configs、notices | 对应管理权限               |
| 监控                 | /admin/monitor/*                                                               | 对应运维权限               |
| 工具                 | /admin/tools/*                                                                 | 工具权限                   |
| 文件管理             | /admin/files/*                                                                 | 文件管理权限和数据范围     |
| 用户公告/资料/文件   | /notices、/profile、/files/*                                                   | 当前用户允许范围           |
| 插件管理             | /admin/plugins/*                                                               | 插件管理权限               |
| AI 模型管理/用户对话 | /admin/ai/models、/ai/*                                                        | 管理配置权限/用户使用资格  |
| 传输策略与监控       | /transport/_、/admin/monitor/transport/_                                       | 公钥策略公开限流；统计受权 |

这是接口命名建议，不要求兼容参考所有原始 URL。参考端点清单用于查漏，不把已有服务端响应改为参考 code/msg/rows/total。

继续成功 JSON { data: T }、错误 { statusCode, message, path, timestamp }。列表建议 data 包含 items、total、page、pageSize；树与批量结果有明确 DTO。下载/ZIP/Excel/媒体/SSE 走相应流协议，不强套 JSON envelope。

新增文件上传与流式请求不能直接复用只处理 JSON 的 request<T>；补齐独立 upload/download/stream 模块，保持错误、超时、授权和取消一致。

## 审计基础与依赖顺序

F01 建立登录事件产生机制；F04 起使用共用审计写入能力。完整日志查询/清理/导出页面仍在 F13/F14 独立分支，避免一开始全部塞进认证分支。

参数/字典、RBAC 缓存只在明确命名空间管理；Redis session 和防重放空间不提供普通缓存清空功能。在线模块用分页索引，不用 KEYS 全库扫描。

定时任务区分“用户 Task”和“运维 ScheduledJob”，禁止重用私人任务表做 Cron。

## 文件与私人媒体迁移

现有 Media 只支持私人图片和短视频，不等于参考通用文件库。建议增加 ManagedFile，通过明确关联适配 Media，分阶段登记已有媒体；先验证元数据、quota 和下载契约，再启用新管理功能。

不自动将私人文件设置为公开。回收站、引用、保留、转移、永久清理要定义配额何时计数，使用幂等状态机处理数据库/存储失败。公开附件与受保护附件下载策略分开；实际存储路径从不直接下发。

## 插件、AI 与加密边界

插件前端视图通常由 Vite 编译打包，Nest 模块也有编译与依赖图约束。建议可信插件在发布阶段安装依赖、生成构建清单；运行时可以启停已注册插件，新增代码版本需重建/重启。若要求完全热装热卸，需另设计隔离进程/远程模块，不把菜单开关冒充热加载。

代码生成建议优先预览和 ZIP；建表/写到服务端本地目录需独立受控能力。参考这些行为都已列出，实施范围不可静默删掉，需确认所选策略。

应用层加密在 HTTPS 基础上增加。明确版本、公钥缓存、轮换窗口、请求时间/nonce 防重放；现有 Passkey/设备签名/OAuth callback、multipart、二进制和 SSE 按协议分别处理。uni-app 各平台密码学/流式 API 可用性须验证，不直接假定 Web Crypto 全平台可用。

AI 先实现已确认 Provider 的真实调用；本轮不指定供应商、不读取已有秘密、不调用付费模型。若选用 AI 插件方式，F30/F31 依赖 F27～F29。

## 三端发布

先发布可向后兼容的服务端迁移和 API，再发布管理端/客户端；需要破坏性变更时提供兼容窗口。所有仓库在功能交付记录中写 commit、依赖、迁移及最低服务端版本。

客户端 Android/iOS/HarmonyOS 真机验证受设备、签名和平台 API 影响。App 资源构建成功与真机功能通过分别记录；不能以 H5 测试代替全部原生验收。
