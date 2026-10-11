# NFC 任务入口（P2-03）

经典场景：为自己的学习任务制作书桌 NFC 标签，主动读取后在线校验，确认并打开任务。

客户端：云端任务中选择“制作 NFC 入口”，填写标签名，生成并复制文本。使用 NFC 写入工具将它写为 **一条 UTF-8 NDEF Text 记录**，不要使用 URL 类型。返回 App 点击“读取 NFC 标签”，靠近标签；服务端校验后点击“打开任务”。更新入口后旧文本立即失效，需重新写入标签；撤销不删除任务。

管理端 `/nfc-tags` 支持分页、邮箱/标签名/任务标题查询和撤销，不展示签名文本。普通账号不能访问管理接口。

Android 需要将服务端 `artifacts/nfc-android/moment-nfc.jar` 合入自定义原生基座/安装包；仅资源编译不包含 Java 类。iOS 需要嵌入并签名 `artifacts/nfc-ios/MomentNfc.framework`，声明 `NFCReaderUsageDescription`，并通过具备 `com.apple.developer.nfc.readersession.formats = [NDEF]` 的 provisioning profile 签名；现有免费签名链路尚未满足 NFC 权限，不修改证书。不能仅手工添加 entitlement 冒充授权。鸿蒙原生 NFC Kit 插件尚待实现，当前明确显示不支持。

入口 30 天有效，仅所属账号在线读取，不作为登录凭据。复制实体标签不能绕过所属账号校验，签名不证明物理标签身份。不记录原始 UID、签名文本或任务正文到审计；只主动前台读取，离页/切后台/账号切换释放会话，拒绝迟到结果。

三系统原生打包、写入/读取、取消、关闭 NFC、拒绝权限、切后台、离线、过期、换版、撤销、跨账号及恶意 URL 真机验收仍待办。详细实现与验证记录见服务端 `docs/phase-thirteen.md`。
