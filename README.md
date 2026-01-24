# Resume Site

一个基于 Astro + React + TailwindCSS 的个人简历展示网站。通过修改配置文件即可定制你自己的简历页面。

## 特性

- 📝 **配置驱动** - `resume.yaml` 作为初始种子，后台编辑并发布
- 🗂️ **后台发布** - 后台编辑草稿，一键发布到前台
- 🎨 **暗色模式** - 支持亮色/暗色/跟随系统三种模式
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **极致性能** - 基于 Astro 构建，默认零 JS
- 🔍 **SEO 友好** - 内置 Meta 标签和 Open Graph 支持
- 🚀 **一键部署** - 支持 GitHub Pages / Vercel / Netlify

## 快速开始

### 1. Fork 或克隆仓库

```bash
git clone https://github.com/username/resume-site.git
cd resume-site
```

### 2. 安装依赖

```bash
npm install
cd server && npm install
cd ../admin && npm install
cd ..
```

### 3. 配置环境变量

```bash
cp .env.example .env
cp server/.env.example server/.env
cp admin/.env.example admin/.env
```

### 4. 初始化数据

首次运行会从 `src/config/resume.yaml` 导入草稿与已发布数据。

```bash
cd server
npm run init:data
cd ..
```

### 5. 启动服务

```bash
# API (http://localhost:4000)
npm run dev:api

# 公共前台 (http://localhost:4321)
npm run dev:web

# 管理后台 (http://localhost:5173)
npm run dev:admin
```

访问 `http://localhost:5173` 登录后台并编辑/发布。

### 6. 构建部署

```bash
npm run build
```

构建产物在 `dist` 目录。

## 配置说明

### resume.yaml 结构

```yaml
# 个人信息
profile:
  name: "姓名"
  title: "职位"
  avatar: "/images/avatar.jpg"
  bio: "个人简介"
  location: "所在城市"
  email: "email@example.com"
  social:
    github: "https://github.com/username"
    linkedin: "..."

# 工作经历
experience:
  - company: "公司名称"
    position: "职位"
    period: "2022.01 - 至今"
    description:
      - "工作内容1"
      - "工作内容2"
    tags: ["技术1", "技术2"]

# 项目经历
projects:
  - name: "项目名称"
    description: "项目描述"
    highlights:
      - "亮点1"
      - "亮点2"
    tags: ["技术1", "技术2"]
    link: "https://github.com/..."

# 技术栈
skills:
  - category: "分类名称"
    items:
      - name: "技能名称"
        level: 90  # 0-100

# 网站配置
site:
  title: "页面标题"
  description: "页面描述"
  theme: "auto"  # auto | light | dark
  language: "zh-CN"
```

> `resume.yaml` 现在作为初始种子数据，后台编辑后以 API 数据为准。

## 后台使用

1. 访问管理后台并登录，或点击 **Create account** 注册（首个账号默认允许注册）。  
2. 在 JSON 编辑器中修改草稿内容。  
3. 点击 **Save draft** 保存草稿，点击 **Publish** 发布到前台。  

> 如需允许多个账号注册，请在 `server/.env` 中设置 `ALLOW_REGISTRATION=true` 并重启 API。  

## Docker 部署

> 该方案会同时启动 API、公共前台、管理后台三项服务。

### 1. 准备环境变量

```bash
cp server/.env.example server/.env
cp admin/.env.example admin/.env
```

### 2. 启动容器

```bash
docker compose up --build
```

默认端口：
- API: `http://localhost:4000`
- 公共前台: `http://localhost:4321`
- 管理后台: `http://localhost:5173`

### 3. 自定义域名或端口

- 管理后台的 API 地址是**构建期**写入（`VITE_API_BASE_URL` / `VITE_PUBLIC_SITE_URL`），修改后需要重新构建镜像。  
- 公共前台的 API 地址支持**运行时**通过 `API_BASE_URL` 环境变量覆盖。  

如果部署到 GitHub Pages，请在构建时设置 `ASTRO_SITE` 与 `ASTRO_BASE`。  

## 部署

> 公共前台已切换为 SSR（Node adapter）。如需静态部署请调整 adapter 与数据获取方式。

### GitHub Pages

1. 修改 `astro.config.mjs`：

```js
export default defineConfig({
  site: 'https://username.github.io',
  base: '/resume-site',  // 仓库名
  // ...
});
```

2. 启用 GitHub Pages:
   - 进入仓库 Settings > Pages
   - Source 选择 "GitHub Actions"

3. 推送代码后自动部署。

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. 导入 GitHub 仓库
2. 框架选择 Astro
3. 点击 Deploy

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. 导入 GitHub 仓库
2. 构建命令: `npm run build`
3. 发布目录: `dist`

## 本地开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 自定义

### 修改主题色

编辑 `src/styles/global.css` 中的 CSS 变量：

```css
:root {
  --color-primary: #3b82f6;  /* 主题色 */
}
```

### 添加新组件

在 `src/components/` 目录创建新的 `.astro` 组件，然后在 `src/pages/index.astro` 中引入。

## 技术栈

- [Astro](https://astro.build/) - 静态网站框架
- [React](https://react.dev/) - UI 交互组件
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全

## License

MIT License
