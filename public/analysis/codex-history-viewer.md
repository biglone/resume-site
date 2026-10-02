# Codex History Viewer

> 独立项目分析档案 · 扫描范围：网站已收录项目 · 生成日期：2026-10-02

## 01. 结论先行

**项目定位**：基于 Tauri/Rust 的 Codex 会话查看、搜索、导入和云端同步工具。

这个项目的工程主线可以概括为：**本地数据与同步系统**。面试时应优先讲清业务目标、关键边界、个人负责模块，以及设计如何降低实时性、稳定性、兼容性或交付风险。

### 适合展示的项目信号

- Rust 读取本地 SQLite 和 JSONL 会话数据，支持项目分组和全文搜索。
- 配套 Fastify/PostgreSQL 服务端，支持跨设备增量同步。
- 支持 Gemini/Agy 历史导入、Headless CLI 和 Linux ARM64 发布。

### 公开可核对指标

- **客户端**：Tauri v2
- **本地数据**：SQLite + JSONL
- **服务端**：Fastify + PostgreSQL

## 02. 扫描证据与可信边界

- 本地仓库：`github-projects/codex-history-viewer`
- 当前分支：`main`
- Git跟踪文件：**61**个
- 最近提交：`2026-07-16 | 0f903c6 | feat: add linux arm64 gui release support`
- README：`README.md`
- 构建/交付入口：`package.json`
- 顶层源码目录：`cli`、`scripts`、`server`、`src`、`src-tauri`

**证据置信度**：高：本地仓库可读取，仓库事实来自文件结构、构建配置、源码目录与Git提交记录；项目细节再结合网站已有项目说明。

## 03. 技术栈与工程边界

- **核心技术**：`Tauri`、`Rust`、`JavaScript`、`SQLite`、`Fastify`、`PostgreSQL`、`GitHub Actions`
- **项目类别**：个人项目
- **项目角色**：独立设计与开发
- **时间范围**：个人项目 · 持续迭代

## 04. 架构视图

节点表示责任边界，用于把源码和项目说明压缩成面试官可快速阅读的结构，不表示未经证实的具体类调用关系。

~~~mermaid
flowchart LR
  A[桌面/Web入口] --> B[本地数据解析] --> C[索引/查询服务] --> D[同步与远端API] --> E[备份/权限/运维]
  classDef node fill:#f3f0e8,stroke:#1e5360,color:#132c33,stroke-width:1px
  class A,B,C,D,E node
~~~

### 架构解读

- **输入边界**：桌面/Web入口负责把外部设备、用户操作、文件或网络请求转换为内部可处理的对象。
- **核心处理**：本地数据解析与索引/查询服务承接状态、协议或算法处理，是最适合展开个人贡献的部分。
- **交付闭环**：同步与远端API和备份/权限/运维把中间结果转化为可观测、可复核、可发布的结果。

## 05. 关键数据流与验证点

~~~mermaid
flowchart TB
  F1[本地文件] --> F2[解析与建模] --> F3[索引查询] --> F4[同步冲突] --> F5[备份与恢复]
  classDef stage fill:#fbf8f1,stroke:#b26a3c,color:#38271d,stroke-width:1px
  class F1,F2,F3,F4,F5 stage
~~~

### 验证点

- 输入是否可重放：优先寻找测试数据、样例文件、协议tester、离线工具或smoke test。
- 边界是否可观测：关注超时、断连、空数据、重复任务、模型/设备不可用等异常路径。
- 交付是否可复现：关注CMake、Docker、CI、安装包、数据库迁移和部署脚本。

## 06. 源码/项目深读

## 项目定位
通过 Rust/Tauri 直接读取本地 Codex 的 SQLite/JSONL 数据，提供检索、回顾、导入和跨设备同步能力。

## 技术难点与我的贡献
- 在桌面端处理本地数据库和 JSONL 增量数据，避免把完整会话一次性加载到前端；以项目分组和全文检索组织历史内容。
- 配套 Fastify/PostgreSQL 服务端实现增量同步，并兼容 Gemini/Agy 历史导入和 Headless CLI 场景。
- 通过 GitHub Actions 构建 Linux ARM64 发布包，使工具可以在 Jetson 等 ARM 设备环境中运行。


## 07. 我在项目中的贡献表达

建议按“场景 → 约束 → 方案 → 验证 → 结果”展开，而不是只罗列技术名词。

- Rust 读取本地 SQLite 和 JSONL 会话数据，支持项目分组和全文搜索。
- 配套 Fastify/PostgreSQL 服务端，支持跨设备增量同步。
- 支持 Gemini/Agy 历史导入、Headless CLI 和 Linux ARM64 发布。

### 可展开的追问

- 为什么采用当前模块边界，而不是把功能集中在UI或单一服务中？
- 出现性能下降、设备异常或数据不完整时，如何快速缩小问题范围？
- 哪些设计是为了可测试、可部署或可回滚，而不仅仅是“能跑起来”？
