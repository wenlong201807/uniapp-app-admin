# 此刻 · 管理端

此仓库是应用的 Web 管理端，使用 Vue 3、Element Plus、Pinia、Vite 和 TypeScript。代码格式化使用 Oxc 官方工具 **Oxfmt（`oxfmt`）**，代码检查使用 **Oxlint（`oxlint`）**。

关联项目：

- 服务端：`/Users/zhuwenlong/Desktop/ai-study/uniapp-app-server`（NestJS、MySQL、Redis）
- 客户端：`/Users/zhuwenlong/Desktop/ai-study/uniapp-app`（uni-app Vue 3）

## 开发

要求 Node.js >= 22.12.0、pnpm 10.33.0。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

访问 `http://127.0.0.1:5174`。管理端使用 5174，避免与客户端 5173 冲突。开发时 `/api` 默认代理到服务端 Nginx 入口 `http://127.0.0.1:8086`。

如需调整，复制 `.env.example` 为 `.env.local` 并修改：

```dotenv
VITE_API_BASE_URL=/api/v1
API_PROXY_TARGET=http://127.0.0.1:8086
```

Vite 开发代理避免浏览器跨域；如果直接连接其他 API 域名，需要在服务端 `CORS_ORIGINS` 中配置管理端来源。所有 `VITE_` 变量会进入浏览器构建产物，不应包含密钥。

## 命令

| 命令            | 用途                            |
| --------------- | ------------------------------- |
| `pnpm dev`      | 启动开发服务                    |
| `pnpm check`    | 格式、Lint、TypeScript 检查     |
| `pnpm format`   | 使用 Oxfmt 格式化               |
| `pnpm lint:fix` | 使用 Oxlint 自动修复            |
| `pnpm build`    | 类型检查并构建到 `dist/`        |
| `pnpm preview`  | 预览构建产物（不提供 API 代理） |

## 目录

```text
src/
  config/       应用与 API 配置
  layouts/      后台布局
  router/       路由与页面标题
  services/     HTTP 请求与接口模块
  stores/       Pinia 状态
  styles/       全局主题与响应式样式
  views/        工作台、服务连接与 404 页面
```

请求层适配服务端成功响应 `{ data: T }` 和错误响应 `{ statusCode, message, path, timestamp }`，支持超时、取消请求与可选 Bearer Token。

## 当前范围

已实现基础工程、后台布局、路由、Pinia、中文 Element Plus、真实服务健康检查和接口文档入口。管理员登录支持服务端一次性 bootstrap 初始化；工作台不展示虚构业务统计。

服务端已提供独立管理员账号、bootstrap、登录、刷新、退出和 me 接口；管理端只在内存中保存管理员会话，刷新页面需重新登录。任务和媒体接口仍只操作当前用户的数据，尚无管理员角色、全局用户管理、全局任务管理或审核接口，因此业务模块继续明确标注为待接入。

## 部署

`pnpm build` 生成静态资源。Web 服务需支持 SPA 路由回退（如 Nginx `try_files $uri $uri/ /index.html`），并将 `/api/` 反向代理至应用服务。开发代理不会进入生产构建。
