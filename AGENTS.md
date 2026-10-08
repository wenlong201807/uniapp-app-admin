# 管理端项目约定

- 本项目是管理端；关联服务端为 `../uniapp-app-server`，客户端为 `../uniapp-app`。
- 主技术栈固定为 Vue 3、Element Plus、Pinia、Vite、TypeScript。
- Vue 页面和组件使用 `<script setup lang="ts">`；保持 TypeScript 严格模式。
- 格式化使用 `oxfmt`，代码检查使用 `oxlint`。不要额外引入 ESLint 或 Prettier。
- 使用 pnpm；提交依赖变更时更新 `pnpm-lock.yaml`。
- API 模块放在 `src/services/`，复用请求层和服务端 `{ data }` 响应协议。
- 管理员权限必须由服务端验证，不能把普通用户登录视为管理员授权。
- 不展示虚构业务数据。尚未支持的模块应明确标注状态。
- 完成代码变更后运行 `pnpm check` 和 `pnpm build`。
