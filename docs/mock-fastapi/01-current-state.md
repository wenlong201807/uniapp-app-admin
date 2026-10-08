# 源码依据与三端现状

## 检查基线

| 项目     | 本机路径                                                         | 检查时状态                                                             |
| -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 参考     | /Users/zhuwenlong/Desktop/ai-study/python-sys/RuoYi-Vue3-FastAPI | 提交 3ecfa3c90599928ce899e04b107e7c8e2627a9f4；前端 1.10.0；工作区干净 |
| 管理端 A | /Users/zhuwenlong/Desktop/ai-study/uniapp-app-admin              | main，9c3f42c；写文档前干净                                            |
| 服务端 S | /Users/zhuwenlong/Desktop/ai-study/uniapp-app-server             | feat/phase-six，已提交 HEAD 1f5c288；有修改和未跟踪文件                |
| 客户端 C | /Users/zhuwenlong/Desktop/ai-study/uniapp-app                    | feat/phase-six，已提交 HEAD 7702683；有修改和未跟踪文件                |

读取 README、路由、页面、API 模块、控制器、权限实现、数据库结构、包配置及部分验证记录。不读取客户端 secrets/，不改关联仓库，不执行参考项目的安装、启动或迁移。未用默认账号访问服务。

## 参考源码依据

路径相对于参考项目根目录。

| 路径                                                                        | 核实内容                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| README.md 的“内置功能”                                                      | 全部 21 类功能口径                                         |
| ruoyi-fastapi-frontend/src/views/system/                                    | 用户、角色、部门、岗位、菜单、字典、参数、公告、文件、插件 |
| ruoyi-fastapi-frontend/src/views/monitor/                                   | 日志、在线用户、调度、服务、缓存、传输加密                 |
| ruoyi-fastapi-frontend/src/views/tool/                                      | 表单构建、Swagger、代码生成                                |
| ruoyi-fastapi-frontend/src/router/index.js、src/store/modules/permission.js | 动态路由、组件映射、页面权限、个人中心、锁屏               |
| ruoyi-fastapi-frontend/src/layout/components/Navbar.vue、src/settings.js    | 页面搜索、布局、主题、全屏、通知、锁屏                     |
| ruoyi-fastapi-backend/module_admin/controller/                              | 核心管理与监控接口，详见接口索引                           |
| ruoyi-fastapi-backend/common/aspect/data_scope.py                           | 五类数据范围、多角色范围合并                               |
| ruoyi-fastapi-backend/module_generator/                                     | 生成配置、字段、模板                                       |
| ruoyi-fastapi-backend/module_plugin/、plugins/core/                         | 插件生命周期、依赖、诊断、脚手架                           |
| ruoyi-fastapi-backend/plugins/ai/README.md、controller/                     | 模型、用户对话配置、历史、SSE、图片与推理                  |
| ruoyi-fastapi-backend/sql/ruoyi-fastapi.sql                                 | 组织、RBAC、日志、公告、文件、生成器、插件表               |
| ruoyi-fastapi-backend/docs/transport_crypto_config.md                       | 三种加密模式、轮换、防重放、排除范围                       |
| ruoyi-fastapi-app/src/pages.json、src/api/、src/pages/work/index.vue        | 移动页面、认证、资料与实际占位入口                         |
| ruoyi-fastapi-backend/tests/、ruoyi-fastapi-test/                           | 可参考的规则测试、浏览器场景；本轮未运行                   |

monitor/druid 有页面文件，但不属于 README 中单独列出的功能，不据此承诺移植 Java Druid；监控按 Node/Prisma 实际环境适配。

## 管理端现状

已完成基础工程、中文 Element Plus、Pinia、路由、布局、工作台、服务连接和 404。健康检查适配真实 data 响应。端口 5174，开发代理指向 8086。

尚无管理员登录、动态菜单、路由鉴权、权限指令、系统管理 CRUD 和业务统计。工作台用户、任务、媒体为明确标注的规划项。

基础工程此前通过 pnpm check 与 pnpm build；不是未来管理功能的验收证据。

## 服务端现状

已提交基础包含邮箱注册登录、JWT access token、Redis session、refresh token 轮换、退出即时撤销、限流、邮箱验证、找回/修改密码、私人任务、私人图片/视频、配额、授权下载与 Range、健康检查和 Swagger。

工作区还存在 Passkey、原生设备密钥、OAuth 相关源码/迁移、HTTPS 配置、客户端集成副本等。原生生物识别文档保留真机待验收项；OAuth 有源码不代表供应商配置和端到端验收完成。README 与工作区进度存在差异，须分别记录“已提交”“工作区实现”“已验收”。

AuthGuard 校验 Bearer 和有效会话，没有管理员、部门、岗位、权限标识或数据范围。User 未含完整组织/RBAC 模型。Task.ownerId、Media.ownerId 是现有私人隔离边界。

现有 auth:session:<id> 保存用户、refresh 摘要和认证版本，尚无在线管理所需终端、IP、设备说明、最近活跃及分页索引。健康检查只表示数据库可访问，不等于服务器指标监控。

## 客户端现状

单页 pages/index/index.vue 通过组件提供离线计数、备忘、账户、云任务和个人影像。凭证在内存中；共享并发刷新，服务地址改变后清理会话并拒绝旧响应。

没有独立“首页/工作台/我的”导航、资料编辑/头像页面、公告中心和移动管理员权限工作台。原生设备密钥/Passkey 部分工作尚未提交。

客户端有 Android、iOS、HarmonyOS 配置。三端仓库是 A/S/C，客户端平台是 H5 与上述原生平台，二者不是同一维度。

## 差距摘要

| 能力                                 | A        | S                      | C                            |
| ------------------------------------ | -------- | ---------------------- | ---------------------------- |
| 普通认证、私人业务                   | 尚未接入 | 已有基础               | 已有基础                     |
| 管理身份及会话隔离                   | 缺失     | 缺失                   | 缺失，是否加入移动管理待确认 |
| 菜单/按钮/API 权限                   | 缺失     | 缺失                   | 缺失                         |
| 组织、岗位、角色、数据范围           | 缺失     | 缺失                   | 本人资料待扩展               |
| 系统管理和运维                       | 缺失     | 缺失                   | 相关消费入口缺失             |
| 公开文件、ACL、回收站、保留、对账    | 缺失     | 只有私人媒体，不能替代 | 只有私人影像                 |
| 插件、AI、生成器、构建器、应用层加密 | 缺失     | 缺失                   | 相关能力缺失                 |

## 基线处理

两关联仓库有大量未提交工作，包括认证、迁移、页面和原生发布链路。不得直接 git add . 混入新功能，也不得擅自 reset、stash 或替用户提交已有变更。

开始实施前重新读取状态与规范，确认基于已提交 HEAD，或先由用户确认当前工作区形成新基线。随后用独立工作区/工作树隔离功能，在交付记录中记录三个基线 SHA 和迁移顺序。本轮仅记录，不自动处理。
