# FeedFlow 内容订阅与自动部署服务

> 独立项目分析档案 · 扫描范围：网站已收录项目 · 生成日期：2026-10-02

## 01. 结论先行

**项目定位**：面向视频/内容订阅的服务端系统，结合 RSS、YouTube 解析、数据库迁移和 GitHub Webhook 自动部署。

这个项目的工程主线可以概括为：**Web产品与数据服务**。面试时应优先讲清业务目标、关键边界、个人负责模块，以及设计如何降低实时性、稳定性、兼容性或交付风险。

### 适合展示的项目信号

- 基于 Hono、Drizzle、PostgreSQL、Zod 和 JWT 组织服务端 API。
- 集成 RSS、YouTube、代理、Cookies 和 PO Token provider 等真实内容源约束。
- 通过独立生产目录、Webhook、systemd user service 和数据库迁移实现安全部署。

### 公开可核对指标

- **服务端**：Hono + Drizzle
- **内容源**：RSS / YouTube
- **发布链路**：Webhook → Deploy → Migrate

## 02. 扫描证据与可信边界

- 本地仓库：`github-projects/feedflow`
- 当前分支：`main`
- Git跟踪文件：**101**个
- 最近提交：`2026-02-25 | 8e5522d | fix(backend): prefer YOUTUBE_PROXY_URL`
- README：未发现常规README
- 构建/交付入口：未在根目录发现标准入口
- 顶层源码目录：`backend`、`deploy`、`ios`、`scripts`

**证据置信度**：高：本地仓库可读取，仓库事实来自文件结构、构建配置、源码目录与Git提交记录；项目细节再结合网站已有项目说明。

## 03. 技术栈与工程边界

- **核心技术**：`TypeScript`、`Hono`、`Drizzle`、`PostgreSQL`、`RSS`、`YouTube`、`Webhook`、`systemd`
- **项目类别**：个人项目
- **项目角色**：独立设计与开发
- **时间范围**：个人项目 · 2026

## 04. 架构视图

节点表示责任边界，用于把源码和项目说明压缩成面试官可快速阅读的结构，不表示未经证实的具体类调用关系。

~~~mermaid
flowchart LR
  A[Web客户端] --> B[API与领域服务] --> C[SQLite/Postgres存储] --> D[异步任务/导入] --> E[鉴权/部署/观测]
  classDef node fill:#f3f0e8,stroke:#1e5360,color:#132c33,stroke-width:1px
  class A,B,C,D,E node
~~~

### 架构解读

- **输入边界**：Web客户端负责把外部设备、用户操作、文件或网络请求转换为内部可处理的对象。
- **核心处理**：API与领域服务与SQLite/Postgres存储承接状态、协议或算法处理，是最适合展开个人贡献的部分。
- **交付闭环**：异步任务/导入和鉴权/部署/观测把中间结果转化为可观测、可复核、可发布的结果。

## 05. 关键数据流与验证点

~~~mermaid
flowchart TB
  F1[用户请求] --> F2[领域校验] --> F3[数据读写] --> F4[异步处理] --> F5[结果与审计]
  classDef stage fill:#fbf8f1,stroke:#b26a3c,color:#38271d,stroke-width:1px
  class F1,F2,F3,F4,F5 stage
~~~

### 验证点

- 输入是否可重放：优先寻找测试数据、样例文件、协议tester、离线工具或smoke test。
- 边界是否可观测：关注超时、断连、空数据、重复任务、模型/设备不可用等异常路径。
- 交付是否可复现：关注CMake、Docker、CI、安装包、数据库迁移和部署脚本。

## 06. 源码/项目深读

## 项目定位
FeedFlow 是一个面向内容订阅和视频处理的服务端项目，重点不只在 API，而在于把不稳定的外部内容源、代理/Cookies 配置和可回滚部署纳入系统设计。

## 技术深挖
- 使用 Hono、Zod 和 JWT 组织边界清晰的 API，Drizzle 负责 PostgreSQL schema 和迁移，降低运行时字段漂移。
- 对 YouTube bot-check 设计 Cookies 和 PO Token provider 配置，并把代理、解析失败和运行日志作为可诊断问题处理。
- 部署脚本使用独立的 `feedflow-prod` 生产目录，避免 webhook 发布时误伤开发目录；push 事件触发 webhook，再执行构建、迁移和服务重启。
- 通过 systemd user service 管理后端和 webhook，形成“代码变更 → 自动部署 → 数据库迁移 → 日志复盘”的闭环。

## 面试切入点
可以讨论外部依赖不可靠时的配置隔离、生产目录与源码目录分离、数据库迁移失败如何阻止错误发布，以及 webhook 的安全边界。


## 07. 我在项目中的贡献表达

建议按“场景 → 约束 → 方案 → 验证 → 结果”展开，而不是只罗列技术名词。

- 基于 Hono、Drizzle、PostgreSQL、Zod 和 JWT 组织服务端 API。
- 集成 RSS、YouTube、代理、Cookies 和 PO Token provider 等真实内容源约束。
- 通过独立生产目录、Webhook、systemd user service 和数据库迁移实现安全部署。

### 可展开的追问

- 为什么采用当前模块边界，而不是把功能集中在UI或单一服务中？
- 出现性能下降、设备异常或数据不完整时，如何快速缩小问题范围？
- 哪些设计是为了可测试、可部署或可回滚，而不仅仅是“能跑起来”？
