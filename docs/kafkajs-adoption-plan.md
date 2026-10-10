# KafkaJS 在此刻项目中的应用设计方案

状态：设计阶段。本次只新增设计文档，不安装 KafkaJS，不修改运行代码、数据库和部署配置。

## 1. 定位与原则

KafkaJS 是 Node.js Kafka 客户端。结合当前 NestJS、Prisma、MySQL、Redis 服务端，KafkaJS 的定位是服务端事件总线和可靠异步任务通道：

- HTTP/WS 负责鉴权、参数校验和快速响应。
- MySQL 保存业务真相，Redis 继续负责会话、限流、短期票据和分布式锁。
- Kafka 传递可重放的领域事件。
- 管理端和 uni-app 客户端不直接连接 Kafka，只通过现有 HTTP、WebSocket 或 SSE 获取结果。
- Kafka 不替代 MySQL、Redis、对象存储，也不承载密码、令牌、媒体二进制或完整私密对话。

## 2. KafkaJS 经典应用场景

### 2.1 领域事件和跨模块解耦

业务事务完成后发布 user.registered、task.completed、media.ready、department.updated 等事件。通知、审计、统计、缓存刷新可以分别消费，不让核心请求依赖所有下游模块。

### 2.2 异步任务和削峰

适合邮件、站内通知、批量导入、报表生成、媒体缩略图、转码、清理和对账。HTTP 只创建任务并返回任务 ID，消费者按吞吐处理。

登录、权限判断、普通任务读取等必须立即完成的操作不应为了 Kafka 强行异步。

### 2.3 多渠道通知

同一事件可由 notification-service、realtime-gateway、audit-service 分别消费。每个消费者使用独立 consumer group，邮件、站内通知、WebSocket 推送和审计互不抢消息。

### 2.4 审计和日志流水

管理员操作、登录、媒体访问、AI 用量等通过事件进入审计流水。事件至少带主体、动作、资源、结果和 traceId；不得记录密码、JWT、refresh token、API key。

### 2.5 缓存和索引刷新

department.changed、media.deleted 等事件触发 Redis 缓存失效和搜索索引刷新。失败时重试，不能反向覆盖 MySQL。

### 2.6 AI 生命周期协作

Kafka 适合 ai.generation.started、completed、failed、usage.recorded 等生命周期事件，用于用量统计、审计和告警。当前 AI WebSocket 的每个 token 增量继续走现有 WebSocket，不放入 Kafka。

### 2.7 数据同步和外部集成

未来运营分析、数据仓库或外部系统可以消费版本化领域事件。先采用领域事件，只有明确需要全量变更捕获、完成脱敏和删除策略后才评估 CDC。

## 3. 本项目首批事件边界

| 事件域   | 示例事件                                                      | 首批消费者               |
| -------- | ------------------------------------------------------------- | ------------------------ |
| 账户安全 | user.registered、user.session.revoked、admin.account.disabled | 通知、审计、会话失效     |
| 任务     | task.created、task.completed、task.deleted                    | 通知、统计、审计         |
| 媒体     | media.uploaded、media.ready、media.deleted                    | 转码、缩略图、配额、清理 |
| 组织     | department.created、department.updated、department.disabled   | 管理缓存、审计、授权缓存 |
| AI       | ai.generation.started/completed/failed、ai.usage.recorded     | 用量、审计、通知         |
| 运维     | job.failed、reconciliation.completed                          | 告警、运营面板           |

普通查询、登录响应、权限实时判定、每个 AI token、客户端离线计数不进入 Kafka。

## 4. 统一事件信封

事件 payload 必须版本化，建议结构如下：

    eventId、eventType、eventVersion、occurredAt、producer
    aggregateType、aggregateId、traceId、correlationId
    actorType、actorId、payload

eventId 全局唯一；事件 key 使用 aggregateId，保证同一用户、任务、媒体或部门在同一分区内有序。主题采用 moment.v1.domain.user、moment.v1.domain.media、moment.v1.audit、moment.v1.dlq 等小写点分隔名称。

消息只传 ID、状态和必要元数据。媒体、头像、大文本和 AI 对话正文传引用，不传二进制。

## 5. 可靠投递：事务性 Outbox

不能在 Prisma 事务提交后直接发送 Kafka，也不能先发 Kafka 再写 MySQL。推荐增加 OutboxEvent 表：

- id/eventId 唯一标识
- topic、eventType、aggregateType、aggregateId
- payloadJson、headersJson
- status：PENDING、PUBLISHED、FAILED
- attempts、nextAttemptAt、createdAt、publishedAt

业务数据和 Outbox 记录在同一个 Prisma 事务中提交。publisher worker 批量发送 PENDING 事件，成功后标记 PUBLISHED；失败按指数退避，超过阈值进入 DLQ。采用至少一次投递，消费者必须幂等。

后续吞吐较高时使用数据库行锁和 SKIP LOCKED 等效策略领取事件，初版限制批量大小和 worker 并发。

## 6. 服务端模块建议

    src/messaging/messaging.module.ts
    src/messaging/kafka.client.ts
    src/messaging/kafka-producer.service.ts
    src/messaging/kafka-consumer.runner.ts
    src/messaging/event-envelope.ts
    src/messaging/outbox.service.ts
    src/messaging/consumers/

Producer 集中配置 brokers、clientId、TLS/SASL、压缩、acks 和重试。Consumer runner 统一 groupId、心跳、手动提交 offset、优雅停机和错误处理。首期使用 JSON DTO 加契约测试，事件稳定后再评估 Schema Registry、Avro 或 Protobuf。

建议配置：

    KAFKA_ENABLED=false
    KAFKA_BROKERS=
    KAFKA_CLIENT_ID=moment-api
    KAFKA_SSL=true
    KAFKA_SASL_MECHANISM=scram-sha-256
    KAFKA_USERNAME=
    KAFKA_PASSWORD=
    KAFKA_GROUP_PREFIX=moment
    KAFKA_OUTBOX_BATCH_SIZE=100
    KAFKA_OUTBOX_POLL_MS=1000

生产者使用 acks=-1、有限重试和压缩；消费者关闭 autoCommit，业务成功后手动提交。KAFKA_ENABLED=false 时核心同步业务必须继续可用。

## 7. 消费者幂等、重试和 DLQ

处理顺序：

1. 校验事件信封和版本。
2. 使用 eventId 做幂等检查。
3. 执行业务操作。
4. 将消费记录和副作用写入同一事务。
5. 成功后提交 offset。

建议 ProcessedEvent 使用 eventId、consumerName 唯一约束。网络超时、临时数据库不可用和上游 5xx 可重试；结构错误、未知版本和永久业务冲突进入 DLQ。重试主题可按 1 分钟、10 分钟分层，DLQ 只允许受控人工或运维任务重放。

## 8. 分区、容量和保留

- 初始每个主题 3 个分区，按 aggregateId 分区。
- 同一 aggregate 只保证分区内顺序，不保证跨主题全局顺序。
- 单条消息目标小于 256 KB。
- 领域事件保留 7 至 30 天；审计和 DLQ 按合规策略单独保留。
- 不按用户创建主题，不使用无界 topic。
- 分区数根据压测调整，不能随意减少。

## 9. 安全与可观测性

Kafka 仅内网访问，生产使用 TLS/SASL、独立账号和 topic 最小权限。日志不打印完整 payload、令牌和密钥，事件需携带 traceId、eventId、correlationId。

监控 producer 失败率、发送延迟、consumer lag、处理耗时、Outbox 待发布数量、最老事件年龄、DLQ 增长、重平衡和认证失败。管理员查看、暂停、恢复、重放 DLQ 的动作必须进入审计。

## 10. 分阶段落地路线

### Phase 0：契约和基础设施

确定 broker、认证、主题、分区和保留策略；引入 KafkaJS、messaging 模块、健康检查、优雅停机和契约测试。不改变现有同步 API。

### Phase 1：Outbox 和审计

增加 OutboxEvent、ProcessedEvent；从管理员操作、登录和安全事件开始；完成重复投递、重试、DLQ 和真实 Kafka 集成测试。

### Phase 2：媒体和通知

为媒体上传、就绪、删除、配额和通知接入消费者；转码、缩略图和邮件均异步化，管理端展示真实状态。

### Phase 3：任务、部门和缓存

接入任务完成通知、部门变更缓存失效和权限目录刷新；验证多实例并发、分区顺序和 owner 隔离。

### Phase 4：AI 运营

记录 AI 生成生命周期和用量事件；token 增量仍走 WebSocket；增加用量统计、告警和受控重放。

### Phase 5：外部集成

在 schema、隐私和删除策略稳定后，评估 CDC、数据仓库和 webhook。Kafka 主题不直接作为外部公开 API。

## 11. 验收标准

- Kafka 不可用时登录、任务、媒体权限等同步能力仍工作。
- 服务端优雅停止不丢失已提交 offset。
- MySQL 事务成功必有 Outbox 记录。
- producer 重试和重复消费不会重复通知、扣额或审计。
- 失败消息进入重试/DLQ，受控重放可恢复。
- TLS/SASL、ACL、lag、Outbox 和 DLQ 指标在隔离环境可验证。
- HTTP 继续使用 { data: T }；客户端无需 Kafka SDK；普通认证、管理员认证、私人任务和媒体 owner 隔离不变。

## 12. 不采用的做法

不让管理端或 uni-app 直连 Kafka；不以 Kafka 替代 Prisma/MySQL 事务；不依赖“恰好一次”而省略幂等；不将每个 AI token、离线计数、密码、令牌或媒体二进制放入消息；没有 broker、凭证和压测结果时不宣称生产可用。

## 13. 实施前待确认参数

1. 自建 KRaft、云 Kafka，还是暂不启用生产 broker。
2. 是否允许新增 OutboxEvent、ProcessedEvent Prisma migration。
3. 首个真实消费者选择审计、通知还是媒体后处理。
4. 事件审计保留期限和用户删除联动。
5. 目标吞吐、延迟、消息大小和高可用等级。
6. 是否需要 Schema Registry，以及 JSON、Avro 或 Protobuf。
7. 重试主题、DLQ 运维权限、告警渠道和重放审批规则。

结论：KafkaJS 最适合本项目的异步解耦、可靠通知、媒体后处理、审计、统计和 AI 生命周期事件。推荐从 KafkaJS 加 Outbox 加审计消费者开始，以故障注入和重复投递测试为门槛，再扩展到媒体、通知、部门缓存和 AI 运营。
