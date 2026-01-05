# Vercel Monorepo 部署配置指南

本指南说明如何在 Vercel 中配置 monorepo 的两个应用。

## 项目结构

```
/
├── apps/
│   ├── demo/          # 主 OAuth 应用
│   └── docs/          # 文档站点
├── package.json       # 根目录 package.json (Bun workspaces)
└── bun.lock          # 根目录 lockfile
```

## 方式 1：创建两个独立的 Vercel 项目（推荐）

### Demo App 配置

1. **创建项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 选择你的 GitHub 仓库

2. **配置项目设置**
   - **Project Name**: `oauth-demo` (或你喜欢的名字)
   - **Root Directory**: `apps/demo`
   - **Framework Preset**: Next.js (自动检测)

3. **Build & Development Settings**
   ```
   Install Command: bun install
   Build Command: bun run build
   Output Directory: .next
   Development Command: bun run dev
   ```

4. **Environment Variables**
   添加以下环境变量：
   - `HYDRA_PUBLIC_URL`
   - `HYDRA_ADMIN_URL`
   - `UMS_BASE_URL`
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_BASE_URL`

### Docs 项目配置

1. **创建项目**
   - 在 Vercel Dashboard 创建另一个项目
   - 导入同一个 Git 仓库

2. **配置项目设置**
   - **Project Name**: `oauth-docs` (或你喜欢的名字)
   - **Root Directory**: `apps/docs`
   - **Framework Preset**: Next.js (自动检测)

3. **Build & Development Settings**
   ```
   Install Command: bun install
   Build Command: bun run build
   Output Directory: .next
   Development Command: bun run dev
   ```

4. **Environment Variables**
   - 通常不需要环境变量（静态站点）

## 方式 2：使用 vercel.json（可选）

如果需要在代码中管理配置，可以在每个应用目录创建 `vercel.json`：

**apps/demo/vercel.json:**
```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "cd ../.. && bun install",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**apps/docs/vercel.json:**
```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "cd ../.. && bun install",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## 重要提示

### 1. Root Directory 是关键
- **必须**在 Vercel 项目设置中设置正确的 Root Directory
- Demo App: `apps/demo`
- Docs: `apps/docs`

### 2. Install Command
- 由于使用 Bun workspaces，依赖在根目录安装
- Install Command 应该从根目录运行：`bun install`
- Vercel 会自动在 Root Directory 下运行命令

### 3. Build Command
- 如果 Root Directory 设置正确，可以直接使用 `bun run build`
- Vercel 会在 `apps/demo` 或 `apps/docs` 目录下执行命令

### 4. 环境变量
- 每个项目有独立的环境变量配置
- Demo App 需要 OAuth 相关的环境变量
- Docs 通常不需要环境变量

## 验证部署

部署后，检查：

1. **构建日志**
   - 确认 Install Command 成功安装依赖
   - 确认 Build Command 成功构建

2. **运行时错误**
   - 检查应用是否能正常启动
   - 检查环境变量是否正确设置

3. **URL 访问**
   - Demo App: `https://your-demo-app.vercel.app`
   - Docs: `https://your-docs-app.vercel.app`

## 常见问题

### Q: 构建失败，提示找不到依赖
**A:** 确保 Install Command 从根目录运行 `bun install`，而不是在子目录中。

### Q: 构建成功但运行时出错
**A:** 检查环境变量是否正确设置，特别是 Demo App 需要的 OAuth 配置。

### Q: 如何同时部署两个应用？
**A:** 每次 push 到 Git 仓库时，Vercel 会自动检测更改并部署受影响的项目。如果只修改了 `apps/demo`，只有 Demo App 会重新部署。

### Q: 可以使用同一个域名吗？
**A:** 可以，使用 Vercel 的路径重写功能，但通常建议使用不同的子域名：
- `demo.yourdomain.com` → Demo App
- `docs.yourdomain.com` → Docs

## 参考

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Vercel Project Settings](https://vercel.com/docs/projects/overview/project-settings)

