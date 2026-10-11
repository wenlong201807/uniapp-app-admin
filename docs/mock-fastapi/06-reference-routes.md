# 参考控制器接口与权限索引

从本机参考源码 AST 静态提取，仅包含控制器顶层 HTTP 路由。未启动接口，不代表已运行验收；参考路径不等于目标项目将沿用的 URL。

参考提交：3ecfa3c90599928ce899e04b107e7c8e2627a9f4。路径相对于参考项目的 ruoyi-fastapi-backend/。行号对应此次检查源码。

权限列仅列路由装饰器中声明的接口权限；“未在路由装饰器声明”不表示匿名可访问，仍可能受控制器级认证、角色依赖和函数内校验保护。

## cache_controller

源码：module_admin/controller/cache_controller.py

| 方法   | 完整参考路径                                     | 摘要                 | 权限依赖                                          | 函数行号 |
| ------ | ------------------------------------------------ | -------------------- | ------------------------------------------------- | -------- |
| GET    | /monitor/cache                                   | 获取缓存监控信息接口 | UserInterfaceAuthDependency('monitor:cache:list') | 28       |
| GET    | /monitor/cache/getNames                          | 获取缓存名称列表接口 | UserInterfaceAuthDependency('monitor:cache:list') | 43       |
| GET    | /monitor/cache/getKeys/{cache_name}              | 获取缓存键列表接口   | UserInterfaceAuthDependency('monitor:cache:list') | 58       |
| GET    | /monitor/cache/getValue/{cache_name}/{cache_key} | 获取缓存值接口       | UserInterfaceAuthDependency('monitor:cache:list') | 73       |
| DELETE | /monitor/cache/clearCacheName/{cache_name}       | 清除缓存名称接口     | UserInterfaceAuthDependency('monitor:cache:list') | 93       |
| DELETE | /monitor/cache/clearCacheKey/{cache_key}         | 清除缓存键接口       | UserInterfaceAuthDependency('monitor:cache:list') | 110      |
| DELETE | /monitor/cache/clearCacheAll                     | 清除所有缓存接口     | UserInterfaceAuthDependency('monitor:cache:list') | 125      |

## captcha_controller

源码：module_admin/controller/captcha_controller.py

| 方法 | 完整参考路径  | 摘要               | 权限依赖           | 函数行号 |
| ---- | ------------- | ------------------ | ------------------ | -------- |
| GET  | /captchaImage | 获取图片验证码接口 | 未在路由装饰器声明 | 26       |

## common_controller

源码：module_admin/controller/common_controller.py

| 方法 | 完整参考路径                                    | 摘要                 | 权限依赖           | 函数行号 |
| ---- | ----------------------------------------------- | -------------------- | ------------------ | -------- |
| POST | /common/upload                                  | 通用文件上传接口     | 未在路由装饰器声明 | 31       |
| POST | /common/files/upload                            | 受保护文件上传接口   | 未在路由装饰器声明 | 50       |
| GET  | /common/files/{file_id}/download/{display_name} | 已登记文件下载接口   | 未在路由装饰器声明 | 79       |
| GET  | /common/download                                | 通用文件下载接口     | 未在路由装饰器声明 | 123      |
| GET  | /common/download/resource                       | 通用资源文件下载接口 | 未在路由装饰器声明 | 165      |

## config_controller

源码：module_admin/controller/config_controller.py

| 方法   | 完整参考路径                          | 摘要                     | 权限依赖                                            | 函数行号 |
| ------ | ------------------------------------- | ------------------------ | --------------------------------------------------- | -------- |
| GET    | /system/config/list                   | 获取参数分页列表接口     | UserInterfaceAuthDependency('system:config:list')   | 39       |
| POST   | /system/config                        | 新增参数接口             | UserInterfaceAuthDependency('system:config:add')    | 61       |
| PUT    | /system/config                        | 编辑参数接口             | UserInterfaceAuthDependency('system:config:edit')   | 87       |
| DELETE | /system/config/refreshCache           | 刷新参数缓存接口         | UserInterfaceAuthDependency('system:config:remove') | 110      |
| DELETE | /system/config/{config_ids}           | 删除参数接口             | UserInterfaceAuthDependency('system:config:remove') | 129      |
| GET    | /system/config/{config_id}            | 获取参数详情接口         | UserInterfaceAuthDependency('system:config:query')  | 149      |
| GET    | /system/config/configKey/{config_key} | 根据参数键查询参数值接口 | 未在路由装饰器声明                                  | 166      |
| POST   | /system/config/export                 | 导出参数列表接口         | UserInterfaceAuthDependency('system:config:export') | 191      |

## dept_controller

源码：module_admin/controller/dept_controller.py

| 方法   | 完整参考路径                        | 摘要                     | 权限依赖                                          | 函数行号 |
| ------ | ----------------------------------- | ------------------------ | ------------------------------------------------- | -------- |
| GET    | /system/dept/list/exclude/{dept_id} | 获取编辑部门的下拉树接口 | UserInterfaceAuthDependency('system:dept:list')   | 39       |
| GET    | /system/dept/list                   | 获取部门列表接口         | UserInterfaceAuthDependency('system:dept:list')   | 60       |
| POST   | /system/dept                        | 新增部门接口             | UserInterfaceAuthDependency('system:dept:add')    | 82       |
| PUT    | /system/dept                        | 编辑部门接口             | UserInterfaceAuthDependency('system:dept:edit')   | 108      |
| PUT    | /system/dept/updateSort             | 保存部门排序接口         | UserInterfaceAuthDependency('system:dept:edit')   | 134      |
| DELETE | /system/dept/{dept_ids}             | 删除部门接口             | UserInterfaceAuthDependency('system:dept:remove') | 160      |
| GET    | /system/dept/{dept_id}              | 获取部门详情接口         | UserInterfaceAuthDependency('system:dept:query')  | 189      |

## dict_controller

源码：module_admin/controller/dict_controller.py

| 方法   | 完整参考路径                       | 摘要                           | 权限依赖                                          | 函数行号 |
| ------ | ---------------------------------- | ------------------------------ | ------------------------------------------------- | -------- |
| GET    | /system/dict/type/list             | 获取字典类型分页列表接口       | UserInterfaceAuthDependency('system:dict:list')   | 46       |
| POST   | /system/dict/type                  | 新增字典类型接口               | UserInterfaceAuthDependency('system:dict:add')    | 70       |
| PUT    | /system/dict/type                  | 编辑字典类型接口               | UserInterfaceAuthDependency('system:dict:edit')   | 96       |
| DELETE | /system/dict/type/refreshCache     | 刷新字典缓存接口               | UserInterfaceAuthDependency('system:dict:remove') | 119      |
| DELETE | /system/dict/type/{dict_ids}       | 删除字典类型接口               | UserInterfaceAuthDependency('system:dict:remove') | 135      |
| GET    | /system/dict/type/optionselect     | 获取字典类型下拉列表接口       | 未在路由装饰器声明                                | 154      |
| GET    | /system/dict/type/{dict_id}        | 获取字典类型详情接口           | UserInterfaceAuthDependency('system:dict:query')  | 173      |
| POST   | /system/dict/type/export           | 导出字典类型列表接口           | UserInterfaceAuthDependency('system:dict:export') | 201      |
| GET    | /system/dict/data/type/{dict_type} | 获取指定字典类型的数据列表接口 | 未在路由装饰器声明                                | 222      |
| GET    | /system/dict/data/list             | 获取字典数据分页列表接口       | UserInterfaceAuthDependency('system:dict:list')   | 244      |
| POST   | /system/dict/data                  | 新增字典数据接口               | UserInterfaceAuthDependency('system:dict:add')    | 268      |
| PUT    | /system/dict/data                  | 编辑字典数据接口               | UserInterfaceAuthDependency('system:dict:edit')   | 294      |
| DELETE | /system/dict/data/{dict_codes}     | 删除字典数据接口               | UserInterfaceAuthDependency('system:dict:remove') | 317      |
| GET    | /system/dict/data/{dict_code}      | 获取字典数据详情接口           | UserInterfaceAuthDependency('system:dict:query')  | 337      |
| POST   | /system/dict/data/export           | 导出字典数据列表接口           | UserInterfaceAuthDependency('system:dict:export') | 365      |

## file_controller

源码：module_admin/controller/file_controller.py

| 方法   | 完整参考路径                                        | 摘要                             | 权限依赖                                                                                      | 函数行号 |
| ------ | --------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| GET    | /system/file/list                                   | 获取文件分页列表接口             | UserInterfaceAuthDependency('system:file:list')                                               | 81       |
| GET    | /system/file/stats                                  | 获取文件管理统计接口             | UserInterfaceAuthDependency('system:file:list')                                               | 108      |
| GET    | /system/file/reconcile/issues/list                  | 获取文件存储对账异常分页列表接口 | UserInterfaceAuthDependency('system:file:reconcile')                                          | 134      |
| GET    | /system/file/reconcile/runs/list                    | 获取文件存储对账任务分页列表接口 | UserInterfaceAuthDependency('system:file:reconcile')                                          | 158      |
| GET    | /system/file/reconcile/stats                        | 获取文件存储对账统计接口         | UserInterfaceAuthDependency('system:file:reconcile')                                          | 182      |
| POST   | /system/file/reconcile/run                          | 启动文件存储对账任务接口         | UserInterfaceAuthDependency('system:file:reconcile')                                          | 205      |
| PUT    | /system/file/reconcile/issues/{issue_id}            | 处理文件存储对账异常接口         | UserInterfaceAuthDependency('system:file:reconcile')                                          | 232      |
| GET    | /system/file/retention-policy/list                  | 获取文件业务保留策略列表接口     | UserInterfaceAuthDependency('system:file:list')                                               | 258      |
| POST   | /system/file/retention-policy                       | 新增文件业务保留策略接口         | UserInterfaceAuthDependency('system:file:edit')                                               | 280      |
| PUT    | /system/file/retention-policy                       | 修改文件业务保留策略接口         | UserInterfaceAuthDependency('system:file:edit')                                               | 308      |
| DELETE | /system/file/retention-policy/{business_type}       | 删除文件业务保留策略接口         | UserInterfaceAuthDependency('system:file:edit')                                               | 336      |
| GET    | /system/file/retention-reminder/list                | 获取文件保留期限提醒分页列表接口 | UserInterfaceAuthDependency('system:file:list')                                               | 357      |
| POST   | /system/file/retention-reminder/scan                | 执行文件保留期限提醒扫描接口     | UserInterfaceAuthDependency('system:file:edit')                                               | 389      |
| PUT    | /system/file/retention-reminder/{notice_ids}/read   | 标记文件保留期限提醒已读接口     | UserInterfaceAuthDependency('system:file:list')                                               | 419      |
| PUT    | /system/file/retention-reminder/{notice_id}/extend  | 延长文件保留期限接口             | UserInterfaceAuthDependency('system:file:edit')                                               | 452      |
| PUT    | /system/file/retention-reminder/{notice_id}/dispose | 处置到期文件接口                 | UserInterfaceAuthDependency('system:file:remove')                                             | 485      |
| GET    | /system/file/acl/subjects                           | 查询文件授权主体选项接口         | UserInterfaceAuthDependency(['system:file:list', 'system:file:edit', 'system:file:transfer']) | 516      |
| GET    | /system/file/acl/dept-tree                          | 获取文件授权部门树接口           | UserInterfaceAuthDependency(['system:file:list', 'system:file:edit', 'system:file:transfer']) | 545      |
| PUT    | /system/file/acl/batch                              | 批量保存文件访问控制接口         | UserInterfaceAuthDependency('system:file:edit')                                               | 565      |
| GET    | /system/file/{file_id}/acl/list                     | 获取文件访问控制列表接口         | UserInterfaceAuthDependency('system:file:edit')                                               | 598      |
| PUT    | /system/file/{file_id}/acl                          | 保存文件访问控制接口             | UserInterfaceAuthDependency('system:file:edit')                                               | 630      |
| GET    | /system/file/{file_id}/reference/list               | 获取文件业务引用列表接口         | UserInterfaceAuthDependency('system:file:query')                                              | 665      |
| GET    | /system/file/{file_id}/access-log/list              | 获取文件访问审计分页列表接口     | UserInterfaceAuthDependency('system:file:query')                                              | 691      |
| GET    | /system/file/download/{file_id}/{display_name}      | 文件管理下载接口                 | UserInterfaceAuthDependency('system:file:download')                                           | 732      |
| PUT    | /system/file/{file_ids}/transfer                    | 转移文件接口                     | UserInterfaceAuthDependency('system:file:transfer')                                           | 775      |
| DELETE | /system/file/{file_ids}                             | 删除文件接口                     | UserInterfaceAuthDependency('system:file:remove')                                             | 812      |
| PUT    | /system/file/{file_ids}/restore                     | 恢复文件接口                     | UserInterfaceAuthDependency('system:file:restore')                                            | 843      |
| DELETE | /system/file/purge/{file_ids}                       | 永久清理回收站文件接口           | UserInterfaceAuthDependency('system:file:purge')                                              | 874      |
| GET    | /system/file/{file_id}                              | 获取文件详情接口                 | UserInterfaceAuthDependency('system:file:query')                                              | 903      |

## job_controller

源码：module_admin/controller/job_controller.py

| 方法   | 完整参考路径                  | 摘要                             | 权限依赖                                                | 函数行号 |
| ------ | ----------------------------- | -------------------------------- | ------------------------------------------------------- | -------- |
| GET    | /monitor/job/list             | 获取定时任务分页列表接口         | UserInterfaceAuthDependency('monitor:job:list')         | 48       |
| POST   | /monitor/job                  | 新增定时任务接口                 | UserInterfaceAuthDependency('monitor:job:add')          | 70       |
| PUT    | /monitor/job                  | 编辑定时任务接口                 | UserInterfaceAuthDependency('monitor:job:edit')         | 96       |
| PUT    | /monitor/job/changeStatus     | 修改定时任务状态接口             | UserInterfaceAuthDependency('monitor:job:changeStatus') | 119      |
| PUT    | /monitor/job/run              | 执行定时任务接口                 | UserInterfaceAuthDependency('monitor:job:changeStatus') | 148      |
| DELETE | /monitor/job/{job_ids}        | 删除定时任务接口                 | UserInterfaceAuthDependency('monitor:job:remove')       | 169      |
| GET    | /monitor/job/{job_id}         | 获取定时任务详情接口             | UserInterfaceAuthDependency('monitor:job:query')        | 189      |
| POST   | /monitor/job/export           | 导出定时任务列表接口             | UserInterfaceAuthDependency('monitor:job:export')       | 217      |
| GET    | /monitor/jobLog/list          | 获取定时任务调度日志分页列表接口 | UserInterfaceAuthDependency('monitor:job:list')         | 237      |
| DELETE | /monitor/jobLog/clean         | 清空定时任务调度日志接口         | UserInterfaceAuthDependency('monitor:job:remove')       | 260      |
| DELETE | /monitor/jobLog/{job_log_ids} | 删除定时任务调度日志接口         | UserInterfaceAuthDependency('monitor:job:remove')       | 279      |
| POST   | /monitor/jobLog/export        | 导出定时任务调度日志列表接口     | UserInterfaceAuthDependency('monitor:job:export')       | 308      |

## log_controller

源码：module_admin/controller/log_controller.py

| 方法   | 完整参考路径                           | 摘要                     | 权限依赖                                                 | 函数行号 |
| ------ | -------------------------------------- | ------------------------ | -------------------------------------------------------- | -------- |
| GET    | /monitor/operlog/list                  | 获取操作日志分页列表接口 | UserInterfaceAuthDependency('monitor:operlog:list')      | 42       |
| DELETE | /monitor/operlog/clean                 | 清空操作日志接口         | UserInterfaceAuthDependency('monitor:operlog:remove')    | 65       |
| DELETE | /monitor/operlog/{oper_ids}            | 删除操作日志接口         | UserInterfaceAuthDependency('monitor:operlog:remove')    | 83       |
| POST   | /monitor/operlog/export                | 导出操作日志接口         | UserInterfaceAuthDependency('monitor:operlog:export')    | 114      |
| GET    | /monitor/logininfor/list               | 获取登录日志分页列表接口 | UserInterfaceAuthDependency('monitor:logininfor:list')   | 138      |
| DELETE | /monitor/logininfor/clean              | 清空登录日志接口         | UserInterfaceAuthDependency('monitor:logininfor:remove') | 161      |
| DELETE | /monitor/logininfor/{info_ids}         | 删除登录日志接口         | UserInterfaceAuthDependency('monitor:logininfor:remove') | 179      |
| GET    | /monitor/logininfor/unlock/{user_name} | 解锁账户接口             | UserInterfaceAuthDependency('monitor:logininfor:unlock') | 200      |
| POST   | /monitor/logininfor/export             | 导出登录日志接口         | UserInterfaceAuthDependency('monitor:logininfor:export') | 229      |

## login_controller

源码：module_admin/controller/login_controller.py

| 方法 | 完整参考路径  | 摘要             | 权限依赖           | 函数行号 |
| ---- | ------------- | ---------------- | ------------------ | -------- |
| POST | /login        | 登录接口         | 未在路由装饰器声明 | 45       |
| GET  | /getInfo      | 获取用户信息接口 | 未在路由装饰器声明 | 106      |
| GET  | /getRouters   | 获取用户路由接口 | 未在路由装饰器声明 | 121      |
| POST | /unlockscreen | 解锁屏幕接口     | 未在路由装饰器声明 | 139      |
| POST | /register     | 注册接口         | 未在路由装饰器声明 | 159      |
| POST | /logout       | 退出登录接口     | 未在路由装饰器声明 | 207      |

## menu_controller

源码：module_admin/controller/menu_controller.py

| 方法   | 完整参考路径                              | 摘要               | 权限依赖                                          | 函数行号 |
| ------ | ----------------------------------------- | ------------------ | ------------------------------------------------- | -------- |
| GET    | /system/menu/treeselect                   | 获取菜单树接口     | 未在路由装饰器声明                                | 36       |
| GET    | /system/menu/roleMenuTreeselect/{role_id} | 获取角色菜单树接口 | 未在路由装饰器声明                                | 54       |
| GET    | /system/menu/list                         | 获取菜单列表接口   | UserInterfaceAuthDependency('system:menu:list')   | 74       |
| POST   | /system/menu                              | 新增菜单接口       | UserInterfaceAuthDependency('system:menu:add')    | 96       |
| PUT    | /system/menu                              | 编辑菜单接口       | UserInterfaceAuthDependency('system:menu:edit')   | 122      |
| PUT    | /system/menu/updateSort                   | 保存菜单排序接口   | UserInterfaceAuthDependency('system:menu:edit')   | 145      |
| DELETE | /system/menu/{menu_ids}                   | 删除菜单接口       | UserInterfaceAuthDependency('system:menu:remove') | 165      |
| GET    | /system/menu/{menu_id}                    | 获取菜单详情接口   | UserInterfaceAuthDependency('system:menu:query')  | 185      |

## notice_controller

源码：module_admin/controller/notice_controller.py

| 方法   | 完整参考路径                  | 摘要                         | 权限依赖                                            | 函数行号 |
| ------ | ----------------------------- | ---------------------------- | --------------------------------------------------- | -------- |
| GET    | /system/notice/list           | 获取通知公告分页列表接口     | UserInterfaceAuthDependency('system:notice:list')   | 43       |
| GET    | /system/notice/listTop        | 获取首页顶部通知公告接口     | 未在路由装饰器声明                                  | 61       |
| POST   | /system/notice/markRead       | 标记通知公告已读接口         | 未在路由装饰器声明                                  | 78       |
| GET    | /system/notice/readUsers/list | 获取公告已读用户分页列表接口 | UserInterfaceAuthDependency('system:notice:list')   | 97       |
| POST   | /system/notice/markReadAll    | 批量标记通知公告已读接口     | 未在路由装饰器声明                                  | 116      |
| POST   | /system/notice                | 新增通知公告接口             | UserInterfaceAuthDependency('system:notice:add')    | 139      |
| PUT    | /system/notice                | 编辑通知公告接口             | UserInterfaceAuthDependency('system:notice:edit')   | 165      |
| DELETE | /system/notice/{notice_ids}   | 删除通知公告接口             | UserInterfaceAuthDependency('system:notice:remove') | 188      |
| GET    | /system/notice/{notice_id}    | 获取通知公告详情接口         | 未在路由装饰器声明                                  | 207      |

## online_controller

源码：module_admin/controller/online_controller.py

| 方法   | 完整参考路径                | 摘要                     | 权限依赖                                                  | 函数行号 |
| ------ | --------------------------- | ------------------------ | --------------------------------------------------------- | -------- |
| GET    | /monitor/online/list        | 获取在线用户分页列表接口 | UserInterfaceAuthDependency('monitor:online:list')        | 32       |
| DELETE | /monitor/online/{token_ids} | 强退在线用户接口         | UserInterfaceAuthDependency('monitor:online:forceLogout') | 54       |

## post_controller

源码：module_admin/controller/post_controller.py

| 方法   | 完整参考路径            | 摘要                 | 权限依赖                                          | 函数行号 |
| ------ | ----------------------- | -------------------- | ------------------------------------------------- | -------- |
| GET    | /system/post/list       | 获取岗位分页列表接口 | UserInterfaceAuthDependency('system:post:list')   | 39       |
| POST   | /system/post            | 新增岗位接口         | UserInterfaceAuthDependency('system:post:add')    | 61       |
| PUT    | /system/post            | 编辑岗位接口         | UserInterfaceAuthDependency('system:post:edit')   | 87       |
| DELETE | /system/post/{post_ids} | 删除岗位接口         | UserInterfaceAuthDependency('system:post:remove') | 110      |
| GET    | /system/post/{post_id}  | 获取岗位详情接口     | UserInterfaceAuthDependency('system:post:query')  | 130      |
| POST   | /system/post/export     | 导出岗位列表接口     | UserInterfaceAuthDependency('system:post:export') | 158      |

## role_controller

源码：module_admin/controller/role_controller.py

| 方法   | 完整参考路径                          | 摘要                                 | 权限依赖                                          | 函数行号 |
| ------ | ------------------------------------- | ------------------------------------ | ------------------------------------------------- | -------- |
| GET    | /system/role/deptTree/{role_id}       | 获取自定义数据权限时可见的部门树接口 | UserInterfaceAuthDependency('system:role:query')  | 52       |
| GET    | /system/role/list                     | 获取角色分页列表接口                 | UserInterfaceAuthDependency('system:role:list')   | 74       |
| POST   | /system/role                          | 新增角色接口                         | UserInterfaceAuthDependency('system:role:add')    | 98       |
| PUT    | /system/role                          | 编辑角色接口                         | UserInterfaceAuthDependency('system:role:edit')   | 124      |
| PUT    | /system/role/dataScope                | 编辑角色数据权限接口                 | UserInterfaceAuthDependency('system:role:edit')   | 151      |
| DELETE | /system/role/{role_ids}               | 删除角色接口                         | UserInterfaceAuthDependency('system:role:remove') | 184      |
| GET    | /system/role/{role_id}                | 获取角色详情接口                     | UserInterfaceAuthDependency('system:role:query')  | 212      |
| POST   | /system/role/export                   | 导出角色列表接口                     | UserInterfaceAuthDependency('system:role:export') | 244      |
| PUT    | /system/role/changeStatus             | 修改角色状态接口                     | UserInterfaceAuthDependency('system:role:edit')   | 269      |
| GET    | /system/role/authUser/allocatedList   | 获取已分配用户分页列表接口           | UserInterfaceAuthDependency('system:role:list')   | 300      |
| GET    | /system/role/authUser/unallocatedList | 获取未分配用户分页列表接口           | UserInterfaceAuthDependency('system:role:list')   | 322      |
| PUT    | /system/role/authUser/selectAll       | 分配用户给角色接口                   | UserInterfaceAuthDependency('system:role:edit')   | 346      |
| PUT    | /system/role/authUser/cancel          | 取消分配用户给角色接口               | UserInterfaceAuthDependency('system:role:edit')   | 371      |
| PUT    | /system/role/authUser/cancelAll       | 批量取消分配用户给角色接口           | UserInterfaceAuthDependency('system:role:edit')   | 392      |

## server_controller

源码：module_admin/controller/server_controller.py

| 方法 | 完整参考路径    | 摘要                   | 权限依赖                                           | 函数行号 |
| ---- | --------------- | ---------------------- | -------------------------------------------------- | -------- |
| GET  | /monitor/server | 获取服务器监控信息接口 | UserInterfaceAuthDependency('monitor:server:list') | 27       |

## transport_crypto_controller

源码：module_admin/controller/transport_crypto_controller.py

| 方法 | 完整参考路径                      | 摘要                         | 权限依赖                                                    | 函数行号 |
| ---- | --------------------------------- | ---------------------------- | ----------------------------------------------------------- | -------- |
| GET  | /transport/crypto/frontend-config | 获取前端传输加密配置接口     | 未在路由装饰器声明                                          | 28       |
| GET  | /transport/crypto/public-key      | 获取传输加密公钥接口         | 未在路由装饰器声明                                          | 48       |
| GET  | /transport/crypto/monitor         | 获取传输层加解密监控信息接口 | UserInterfaceAuthDependency('monitor:transportCrypto:list') | 68       |

## user_controller

源码：module_admin/controller/user_controller.py

| 方法   | 完整参考路径                    | 摘要                       | 权限依赖                                            | 函数行号 |
| ------ | ------------------------------- | -------------------------- | --------------------------------------------------- | -------- |
| GET    | /system/user/deptTree           | 获取部门树接口             | UserInterfaceAuthDependency('system:user:list')     | 67       |
| GET    | /system/user/list               | 获取用户分页列表接口       | UserInterfaceAuthDependency('system:user:list')     | 86       |
| POST   | /system/user                    | 新增用户接口               | UserInterfaceAuthDependency('system:user:add')      | 111      |
| PUT    | /system/user                    | 编辑用户接口               | UserInterfaceAuthDependency('system:user:edit')     | 146      |
| DELETE | /system/user/{user_ids}         | 删除用户接口               | UserInterfaceAuthDependency('system:user:remove')   | 179      |
| PUT    | /system/user/resetPwd           | 重置用户密码接口           | UserInterfaceAuthDependency('system:user:resetPwd') | 212      |
| PUT    | /system/user/changeStatus       | 修改用户状态接口           | UserInterfaceAuthDependency('system:user:edit')     | 248      |
| GET    | /system/user/profile            | 获取用户个人信息接口       | 未在路由装饰器声明                                  | 278      |
| GET    | /system/user/{user_id}          | 获取用户详情接口           | UserInterfaceAuthDependency('system:user:query')    | 304      |
| GET    | /system/user/                   | 获取用户岗位和角色列表接口 | UserInterfaceAuthDependency('system:user:query')    | 304      |
| POST   | /system/user/profile/avatar     | 修改用户头像接口           | 未在路由装饰器声明                                  | 328      |
| PUT    | /system/user/profile            | 修改用户个人信息接口       | 未在路由装饰器声明                                  | 369      |
| PUT    | /system/user/profile/updatePwd  | 修改用户密码接口           | 未在路由装饰器声明                                  | 399      |
| POST   | /system/user/importData         | 批量导入用户接口           | UserInterfaceAuthDependency('system:user:import')   | 434      |
| POST   | /system/user/importTemplate     | 获取用户导入模板接口       | UserInterfaceAuthDependency('system:user:import')   | 466      |
| POST   | /system/user/export             | 导出用户列表接口           | UserInterfaceAuthDependency('system:user:export')   | 492      |
| GET    | /system/user/authRole/{user_id} | 获取用户已分配角色列表接口 | UserInterfaceAuthDependency('system:user:query')    | 515      |
| PUT    | /system/user/authRole           | 给用户分配角色接口         | UserInterfaceAuthDependency('system:user:edit')     | 538      |

## gen_controller

源码：module_generator/controller/gen_controller.py

| 方法   | 完整参考路径                   | 摘要                       | 权限依赖                                        | 函数行号 |
| ------ | ------------------------------ | -------------------------- | ----------------------------------------------- | -------- |
| GET    | /tool/gen/list                 | 获取代码生成表分页列表接口 | UserInterfaceAuthDependency('tool:gen:list')    | 45       |
| GET    | /tool/gen/db/list              | 获取数据库表分页列表接口   | UserInterfaceAuthDependency('tool:gen:list')    | 65       |
| POST   | /tool/gen/importTable          | 导入数据库表接口           | UserInterfaceAuthDependency('tool:gen:import')  | 91       |
| PUT    | /tool/gen                      | 编辑代码生成表接口         | UserInterfaceAuthDependency('tool:gen:edit')    | 115      |
| DELETE | /tool/gen/{table_ids}          | 删除代码生成表接口         | UserInterfaceAuthDependency('tool:gen:remove')  | 139      |
| POST   | /tool/gen/createTable          | 创建数据库表接口           | RoleInterfaceAuthDependency('admin')            | 165      |
| GET    | /tool/gen/batchGenCode         | 生成代码文件接口           | UserInterfaceAuthDependency('tool:gen:code')    | 198      |
| GET    | /tool/gen/genCode/{table_name} | 生成代码文件到本地接口     | UserInterfaceAuthDependency('tool:gen:code')    | 224      |
| GET    | /tool/gen/{table_id}           | 获取代码生成表详情接口     | UserInterfaceAuthDependency('tool:gen:query')   | 246      |
| GET    | /tool/gen/preview/{table_id}   | 预览生成的代码接口         | UserInterfaceAuthDependency('tool:gen:preview') | 268      |
| GET    | /tool/gen/synchDb/{table_name} | 同步数据库接口             | UserInterfaceAuthDependency('tool:gen:edit')    | 289      |

## plugin_controller

源码：module_plugin/controller/plugin_controller.py

| 方法   | 完整参考路径                                       | 摘要                             | 权限依赖                                            | 函数行号 |
| ------ | -------------------------------------------------- | -------------------------------- | --------------------------------------------------- | -------- |
| GET    | /system/plugin/list                                | 获取插件分页列表接口             | UserInterfaceAuthDependency('system:plugin:list')   | 106      |
| GET    | /system/plugin/plan                                | 生成插件批量操作计划接口         | UserInterfaceAuthDependency('system:plugin:query')  | 136      |
| GET    | /system/plugin/{plugin_id}/precheck                | 执行插件操作预检接口             | UserInterfaceAuthDependency('system:plugin:query')  | 164      |
| POST   | /system/plugin/batch                               | 批量执行插件操作接口             | UserInterfaceAuthDependency('system:plugin:edit')   | 194      |
| GET    | /system/plugin/operation-log/list                  | 获取插件操作审计日志分页列表接口 | UserInterfaceAuthDependency('system:plugin:query')  | 223      |
| POST   | /system/plugin/operation-log/export                | 导出插件操作审计日志接口         | UserInterfaceAuthDependency('system:plugin:export') | 262      |
| DELETE | /system/plugin/operation-log/retention             | 执行插件操作审计日志保留策略接口 | UserInterfaceAuthDependency('system:plugin:edit')   | 297      |
| GET    | /system/plugin/operation-log/{operation_id}        | 获取插件操作审计日志详情接口     | UserInterfaceAuthDependency('system:plugin:query')  | 324      |
| GET    | /system/plugin/{plugin_id}/migrations              | 获取插件 migration 历史接口      | UserInterfaceAuthDependency('system:plugin:query')  | 353      |
| POST   | /system/plugin/{plugin_id}/migrations/mark-success | 人工标记插件 migration 成功接口  | UserInterfaceAuthDependency('system:plugin:edit')   | 383      |
| POST   | /system/plugin/{plugin_id}/migrations/mark-failed  | 人工标记插件 migration 失败接口  | UserInterfaceAuthDependency('system:plugin:edit')   | 414      |
| GET    | /system/plugin/{plugin_id}                         | 获取插件详情接口                 | UserInterfaceAuthDependency('system:plugin:query')  | 444      |
| PUT    | /system/plugin/{plugin_id}/enable                  | 启用插件接口                     | UserInterfaceAuthDependency('system:plugin:edit')   | 474      |
| PUT    | /system/plugin/{plugin_id}/disable                 | 停用插件接口                     | UserInterfaceAuthDependency('system:plugin:edit')   | 501      |
| GET    | /system/plugin/{plugin_id}/check                   | 检查插件接口                     | UserInterfaceAuthDependency('system:plugin:query')  | 525      |
| GET    | /system/plugin/{plugin_id}/health                  | 执行插件健康检查接口             | UserInterfaceAuthDependency('system:plugin:query')  | 549      |
| GET    | /system/plugin/{plugin_id}/diagnose                | 生成插件诊断包接口               | UserInterfaceAuthDependency('system:plugin:query')  | 573      |
| GET    | /system/plugin/{plugin_id}/docs                    | 生成插件文档接口                 | UserInterfaceAuthDependency('system:plugin:query')  | 601      |
| POST   | /system/plugin/{plugin_id}/install                 | 安装插件接口                     | UserInterfaceAuthDependency('system:plugin:edit')   | 626      |
| POST   | /system/plugin/{plugin_id}/upgrade                 | 升级插件接口                     | UserInterfaceAuthDependency('system:plugin:edit')   | 659      |
| POST   | /system/plugin/{plugin_id}/uninstall               | 安全卸载插件接口                 | UserInterfaceAuthDependency('system:plugin:edit')   | 692      |
| POST   | /system/plugin/{plugin_id}/purge                   | 物理清理插件接口                 | UserInterfaceAuthDependency('system:plugin:remove') | 725      |
| GET    | /system/plugin/{plugin_id}/config                  | 获取插件配置接口                 | UserInterfaceAuthDependency('system:plugin:query')  | 757      |
| PUT    | /system/plugin/{plugin_id}/config                  | 更新插件配置接口                 | UserInterfaceAuthDependency('system:plugin:edit')   | 782      |
| GET    | /system/plugin/{plugin_id}/config/export           | 导出插件配置接口                 | UserInterfaceAuthDependency('system:plugin:export') | 811      |
| POST   | /system/plugin/{plugin_id}/config/import           | 导入插件配置接口                 | UserInterfaceAuthDependency('system:plugin:edit')   | 843      |
| GET    | /system/plugin/{plugin_id}/dependencies            | 检查插件依赖接口                 | UserInterfaceAuthDependency('system:plugin:query')  | 872      |
| POST   | /system/plugin/{plugin_id}/dependencies/install    | 插件依赖安装计划接口             | UserInterfaceAuthDependency('system:plugin:query')  | 896      |

## ai_chat_controller

源码：plugins/ai/controller/ai_chat_controller.py

| 方法   | 完整参考路径                  | 摘要             | 权限依赖           | 函数行号 |
| ------ | ----------------------------- | ---------------- | ------------------ | -------- |
| POST   | /ai/chat/send                 | 发送对话消息     | 未在路由装饰器声明 | 55       |
| GET    | /ai/chat/config               | 获取用户对话配置 | 未在路由装饰器声明 | 78       |
| PUT    | /ai/chat/config               | 保存用户对话配置 | 未在路由装饰器声明 | 98       |
| GET    | /ai/chat/session/list         | 获取会话列表     | 未在路由装饰器声明 | 117      |
| DELETE | /ai/chat/session/{session_id} | 删除会话         | 未在路由装饰器声明 | 134      |
| GET    | /ai/chat/session/{session_id} | 获取会话消息详情 | 未在路由装饰器声明 | 155      |
| POST   | /ai/chat/cancel               | 取消对话         | 未在路由装饰器声明 | 176      |

## ai_model_controller

源码：plugins/ai/controller/ai_model_controller.py

| 方法   | 完整参考路径          | 摘要                     | 权限依赖                                       | 函数行号 |
| ------ | --------------------- | ------------------------ | ---------------------------------------------- | -------- |
| GET    | /ai/model/list        | 获取AI模型分页列表接口   | UserInterfaceAuthDependency('ai:model:list')   | 42       |
| GET    | /ai/model/all         | 获取AI模型不分页列表接口 | 未在路由装饰器声明                             | 64       |
| POST   | /ai/model             | 新增AI模型接口           | UserInterfaceAuthDependency('ai:model:add')    | 94       |
| PUT    | /ai/model             | 编辑AI模型接口           | UserInterfaceAuthDependency('ai:model:edit')   | 127      |
| DELETE | /ai/model/{model_ids} | 删除AI模型接口           | UserInterfaceAuthDependency('ai:model:remove') | 153      |
| GET    | /ai/model/{model_id}  | 获取AI模型详情接口       | UserInterfaceAuthDependency('ai:model:query')  | 179      |

## 提取范围说明

共提取 212 条路由声明，来自 22 个控制器文件。未包含 CLI 子命令、插件 core 内部机制、Web 页面操作及其他动态注册路由。完整功能范围仍以功能清单和源码规则共同确定。

文件上传下载、导出、代码 ZIP 和 AI SSE 的流响应不能仅按 JSON 请求封装处理。验证码/公开公钥等公开能力仍需限流；实际授权策略须实现时逐路由核实。
