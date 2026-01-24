# 简历后台配置与发布 需求文档

## 1. 功能概述
将当前基于静态 `resume.yaml` 的简历站改造为前后端独立的系统，通过后台配置简历内容并发布，前台可展示已发布版本。

## 2. 背景和目标
**背景**：现有项目通过修改本地 YAML 文件驱动页面，更新成本高且无法支持在线发布。  
**目标**：提供后台配置与发布能力，形成“草稿 → 预览 → 发布”的内容流转，前台只展示已发布版本。

## 3. 用户故事
- 作为管理员，我希望在后台编辑简历内容，以便随时更新信息。  
- 作为管理员，我希望预览草稿效果，以便确认展示无误。  
- 作为管理员，我希望一键发布简历，以便前台立即可见。  
- 作为访客，我希望只看到已发布的简历内容，以便获得最新信息。  

## 4. 功能详细描述
1. **后台管理**  
   - 管理员登录后可编辑简历各模块：个人信息、工作经历、项目经历、技能、教育、站点配置等。  
   - 支持增删改、排序、批量更新字段。  
   - 长文本支持 Markdown（匹配现有项目中的 `detail` 字段）。  
2. **草稿与发布**  
   - 简历内容保存在“草稿版本”，仅管理员可见。  
   - 发布操作将当前草稿复制为“已发布版本”，并记录发布时间。  
   - 支持预览草稿（前台预览或后台预览）。  
3. **前台展示**  
   - 前台只读取“已发布版本”的简历内容。  
   - 若无已发布版本，前台显示占位提示或 404。  
4. **资产管理（可选增强）**  
   - 支持图片 URL 录入；如需上传，需提供安全的上传与存储策略。  

## 5. 验收标准
- [ ] Given 管理员已登录，When 更新个人信息并保存，Then 草稿数据可在后台预览中展示。  
- [ ] Given 草稿存在，When 点击发布，Then 前台 API 返回的新内容为刚发布的版本。  
- [ ] Given 已发布版本存在，When 访客访问前台页面，Then 前台展示已发布内容且与后台一致。  
- [ ] Given 未发布任何版本，When 访客访问前台页面，Then 返回占位提示或 404。  
- [ ] Given 项目详情含 Markdown，When 前台渲染详情，Then Markdown 正确解析为 HTML。  
- [ ] Given 管理员未登录，When 访问后台编辑接口，Then 返回 401/403。  
- [ ] Given 发布完成，When 再次修改草稿，Then 前台仍展示旧的已发布版本。  

## 6. 功能模块划分

### 6.1 前端模块
- 公共前台：简历展示页面（从 API 获取已发布版本）。  
- 管理后台：登录页、简历编辑器、草稿预览、发布操作。  

### 6.2 后端模块
- 认证与权限：管理员登录、会话/JWT 校验。  
- 简历内容服务：草稿读写、发布流程、版本管理。  
- 公开读取接口：提供已发布内容给前台。  
- 资产服务（可选）：图片上传与访问。  

### 6.3 数据库模块
- 管理员用户表  
- 简历版本表  
- 资产表（可选）  

## 7. 技术方案

### 7.1 技术栈
- 前端（公共站）：Astro + React + TailwindCSS（沿用现有栈）  
- 前端（后台）：React 或 Astro + React（独立应用）  
- 后端：Node.js + Fastify/Express（REST API）  
- 数据库：PostgreSQL（JSONB 存储简历结构）  
- ORM/迁移：Prisma 或 Knex  

### 7.2 关键技术点
- 简历结构与现有 `resume.yaml` 对齐，使用 JSON Schema 校验。  
- 草稿/发布分离，发布版本不可被直接修改。  
- 前台只拉取已发布版本，具备缓存策略（ETag 或 CDN）。  

### 7.3 架构设计
管理后台 → 后端 API → 数据库/对象存储  
公共前台 → 后端 API（只读已发布内容）

## 8. 接口设计（如适用）
- `POST /api/auth/login`：管理员登录  
- `GET /api/resume/draft`：获取草稿（需鉴权）  
- `PUT /api/resume/draft`：更新草稿（需鉴权）  
- `POST /api/resume/publish`：发布当前草稿（需鉴权）  
- `GET /api/resume/published`：获取已发布版本（前台使用）  
- `POST /api/assets`（可选）：上传图片（需鉴权）  

## 9. 数据模型（如适用）

### 9.1 AdminUser
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | uuid | 用户 ID | PK |
| email | text | 登录邮箱 | unique |
| password_hash | text | 密码哈希 | not null |
| role | text | 权限角色 | default 'admin' |
| created_at | timestamp | 创建时间 | not null |

### 9.2 Resume
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | uuid | 简历 ID | PK |
| slug | text | 简历标识 | unique |
| current_draft_version_id | uuid | 当前草稿版本 | FK |
| published_version_id | uuid | 已发布版本 | FK, nullable |
| updated_at | timestamp | 更新时间 | not null |

### 9.3 ResumeVersion
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | uuid | 版本 ID | PK |
| resume_id | uuid | 关联简历 | FK |
| content_json | jsonb | 简历内容 | not null |
| status | text | draft/published | not null |
| created_at | timestamp | 创建时间 | not null |
| created_by | uuid | 创建者 | FK |

### 9.4 Asset（可选）
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | uuid | 资源 ID | PK |
| url | text | 访问地址 | not null |
| type | text | 资源类型 | not null |
| metadata | jsonb | 扩展信息 | nullable |
| created_at | timestamp | 创建时间 | not null |

## 10. 风险和注意事项
- ⚠️  简历结构复杂，需确保字段校验与前端渲染一致。  
- ⚠️  图片上传涉及安全与存储成本，需明确策略。  
- ⚠️  发布与缓存策略需要一致性处理，避免前台读取旧内容。  

## 11. 非功能需求
- 性能要求：前台获取已发布数据应在 200ms 内返回（同区域）。  
- 安全要求：后台接口需鉴权、限流、密码加密存储。  
- 兼容性要求：前台兼容主流现代浏览器与移动端。  

---
生成时间：2026-01-22T06:28:49Z
