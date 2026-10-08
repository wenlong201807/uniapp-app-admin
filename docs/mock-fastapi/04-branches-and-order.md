# 功能分支、依赖与实施顺序

这是分支方案。用户已确认每个功能一个分支，前期分别推送、不提前合并，后续逐项审查合并；分支内可以有多个合理提交。F01 分支已开始创建。

## 分支规则

- 命名：feat/ruoyi-<功能>；同一功能在相关 A/S/C 仓库使用同名分支。
- 只在确有改动的仓库建分支；未涉及仓库标记 N/A，并做需要的兼容验证。
- 分支包含该功能的页面、API、迁移、种子、权限、必要测试和交付记录，不按“先所有前端、再所有后端”拆成无法验收的版本。
- 每个功能保持独立可审查。文件治理、插件和 AI 拆为有独立完成条件的子功能，已在清单映射其所属参考功能。
- 推荐串行集成：依赖功能确认集成后，新功能从更新的目标基线创建，避免将多个依赖混在一个未审查分支。
- 前期不合并到 main，也不创建长期 integration 分支；后续每个功能审查通过后再按用户要求合并。
- 服务端、客户端当前未提交改动保留为基线的一部分；不覆盖、擅自 stash 或将其混入功能提交。

## 逐功能分支表

A=管理端，S=服务端，C=客户端；C* 表示取决于客户端定位或功能范围，确认后更新为确定仓库。

| 顺序 | 功能                   | 分支                           | 改动仓库 | 先决功能                          |
| ---- | ---------------------- | ------------------------------ | -------- | --------------------------------- |
| 1    | F01 管理认证及最小资格 | feat/ruoyi-admin-auth          | A/S/C*   | 现有认证基线确定                  |
| 2    | F02 导航与权限展示基础 | feat/ruoyi-admin-shell         | A/S/C*   | F01；先注册菜单，F07 编辑后接入   |
| 3    | F05 部门               | feat/ruoyi-departments         | A/S/C*   | F01、F02                          |
| 4    | F06 岗位               | feat/ruoyi-posts               | A/S/C*   | F01、F02                          |
| 5    | F07 菜单               | feat/ruoyi-menus               | A/S/C*   | F01、F02                          |
| 6    | F08 角色与授权         | feat/ruoyi-roles               | A/S/C*   | F05、F07                          |
| 7    | F09 数据权限           | feat/ruoyi-data-scope          | A/S      | F05、F08                          |
| 8    | F04 用户管理           | feat/ruoyi-users               | A/S/C    | F05、F06、F08、F09                |
| 9    | F10 字典               | feat/ruoyi-dictionaries        | A/S/C*   | F08、F09                          |
| 10   | F11 参数               | feat/ruoyi-system-config       | A/S/C    | F08；接管 F01 静态业务策略        |
| 11   | F13 操作日志           | feat/ruoyi-operation-logs      | A/S      | 已有审计事件；F08、F09            |
| 12   | F14 登录日志           | feat/ruoyi-login-logs          | A/S/C*   | F01、F08；整合所有选用认证方式    |
| 13   | F15 在线用户           | feat/ruoyi-online-sessions     | A/S/C    | F01、F08、F13、F14                |
| 14   | F16 定时任务及日志     | feat/ruoyi-scheduled-jobs      | A/S      | F08、F13                          |
| 15   | F17 服务监控           | feat/ruoyi-server-monitor      | A/S      | F08                               |
| 16   | F18 缓存监控           | feat/ruoyi-cache-monitor       | A/S      | F08、F13                          |
| 17   | F21 接口文档完整化     | feat/ruoyi-api-docs            | A/S      | 前述接口；新增功能持续补文档      |
| 18   | F23 文件基础           | feat/ruoyi-files               | A/S/C    | F08、F09、F13；现有媒体基线       |
| 19   | F24 文件 ACL/引用/审计 | feat/ruoyi-file-access         | A/S/C    | F23、组织权限                     |
| 20   | F25 文件生命周期       | feat/ruoyi-file-lifecycle      | A/S/C    | F16、F23、F24                     |
| 21   | F26 文件对账           | feat/ruoyi-file-reconciliation | A/S      | F16、F23、F25                     |
| 22   | F03 个人中心           | feat/ruoyi-profile             | A/S/C    | F04、F23、F24；头像复用文件能力   |
| 23   | F12 通知公告           | feat/ruoyi-notices             | A/S/C    | F08、F09、F13；附件选用时依赖 F24 |
| 24   | F32 工作台             | feat/ruoyi-dashboard           | A/S/C*   | F02、F12、真实聚合能力            |
| 25   | F33 移动基础导航       | feat/ruoyi-mobile-shell        | C/S*     | F03、F12；需保留原有入口          |
| 26   | F19 传输加密           | feat/ruoyi-transport-crypto    | A/S/C*   | F01、F13、已确定协议与平台范围    |
| 27   | F20 表单构建器         | feat/ruoyi-form-builder        | A/S*     | F02、F08；保存作品时增加 S        |
| 28   | F22 代码生成           | feat/ruoyi-code-generator      | A/S      | F07～F11、F13、模板及 DDL 策略    |
| 29   | F27 插件运行时/脚手架  | feat/ruoyi-plugin-runtime      | A/S      | F07～F11、F13、F16、F21           |
| 30   | F28 插件生命周期       | feat/ruoyi-plugin-lifecycle    | A/S      | F27                               |
| 31   | F29 插件配置/运维      | feat/ruoyi-plugin-operations   | A/S      | F27、F28                          |
| 32   | F30 AI 模型管理        | feat/ruoyi-ai-models           | A/S/C*   | F10、F27～F29；Provider 确认      |
| 33   | F31 AI 对话            | feat/ruoyi-ai-chat             | A/S/C*   | F30、F24（图片）、流协议/平台确认 |

顺序按完整依赖安排，不代表工作量相同。认证先用最小种子授权、导航先注册菜单；角色菜单编辑完成后逐步接管。审计写入从早期管理操作开始，F13/F14 独立实现查询/维护界面，避免前期日志空白。

F19 不依赖 AI，但上线强制策略前须再次确认新增 AI SSE 与其他流式路径的排除规则。F21 不是其他功能可以遗漏 Swagger 的理由，所有新增 DTO 当分支内补齐。

## 可选分支

| 功能                 | 分支                           | 说明                                                       |
| -------------------- | ------------------------------ | ---------------------------------------------------------- |
| X01 全局任务管理     | feat/ruoyi-task-admin          | A/S；F09、F13 后；需确认产品规则                           |
| X02 移动管理员工作台 | 不建议集中一个巨型分支         | 若选择，扩展 F02、F04～F18 等对应功能的 C 范围，逐功能交付 |
| X03 AI 图片生成      | feat/ruoyi-ai-image-generation | 单独明确供应商、成本、结果存储和验收                       |

## 每个分支交付记录

实施时在 docs/mock-fastapi/deliveries/<功能 ID>.md 记录：

1. 功能 ID、范围、三仓分支、各自 base/head SHA、相关 PR/提交链接。
2. 页面路径、接口/权限 key、迁移/种子、配置与必要依赖。
3. 完成清单、验收数据、运行命令/结果、平台与真实服务版本。
4. 未完成项及原因、兼容限制、发布顺序、回滚/前滚方式。
5. 与参考差异及已确认决策。

“用户不需要的仓库无改动”“缺外部凭证”“真机待验收”应明确写明，不能通过假数据或空分支补足。

## 提交与集成

本轮梳理文档只写入工作区，不自动提交；若后续要求提交，建议独立 docs/ruoyi-feature-plan 分支。

功能开发授权后，按确认的流程提交并推送相关功能分支。合并策略须明确为逐项审查后合并、授权自动集成或保留分支；不要仅提交三个仓库中的一个就标记功能完成。

现有 main 与 feat/phase-six 的关系、服务端/客户端远程仓库和已有工作归属在基线阶段确认，不假设全部改成 main。
