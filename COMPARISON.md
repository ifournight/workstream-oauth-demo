# Monorepo 管理方式对比

## 方式 1：根目录 Scripts + Bun Workspaces（当前方式）

### 配置示例

**根目录 `package.json`:**
```json
{
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:demo": "bun --cwd apps/demo dev",
    "build:demo": "bun --cwd apps/demo build",
    "start:demo": "bun --cwd apps/demo start"
  }
}
```

### 使用方式
```bash
bun run dev:demo
bun run build:demo
bun run start:demo
```

---

## 方式 2：Nx + project.json

### 配置示例

**根目录 `nx.json`:**
```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["default", "^default"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

**`apps/demo/project.json`:**
```json
{
  "name": "demo",
  "sourceRoot": "apps/demo",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/next:build",
      "options": {
        "outputPath": "dist/apps/demo"
      }
    },
    "dev": {
      "executor": "@nx/next:server",
      "options": {
        "dev": true
      }
    },
    "start": {
      "executor": "@nx/next:server",
      "options": {
        "buildTarget": "demo:build"
      }
    }
  }
}
```

### 使用方式
```bash
nx dev demo
nx build demo
nx start demo

# 并行运行多个项目
nx run-many -t build --projects=demo,docs

# 只构建受影响的项目
nx affected:build
```

---

## 详细对比

| 特性 | 方式 1 (Scripts) | 方式 2 (Nx) |
|------|------------------|-------------|
| **配置复杂度** | ⭐ 简单 | ⭐⭐⭐ 中等 |
| **学习曲线** | ⭐ 低 | ⭐⭐⭐ 中等 |
| **构建缓存** | ❌ 无 | ✅ 智能缓存 |
| **增量构建** | ❌ 无 | ✅ 支持 |
| **依赖图分析** | ❌ 无 | ✅ 可视化 |
| **并行执行** | ⚠️ 手动 | ✅ 自动 |
| **任务编排** | ❌ 无 | ✅ 强大 |
| **适合规模** | 2-5 个项目 | 5+ 个项目 |
| **维护成本** | ⭐ 低 | ⭐⭐ 中等 |

---

## 迁移建议

### 当前阶段（2 个应用）
✅ **继续使用方式 1** - 简单高效，满足需求

### 未来考虑迁移到 Nx 的时机
- 📈 项目数量增加到 5+ 个
- ⚡ 需要频繁的增量构建和缓存
- 🔗 需要复杂的任务依赖关系
- 👥 团队规模扩大，需要更好的工具支持
- 🚀 CI/CD 构建时间成为瓶颈

### 迁移步骤（如果未来需要）
1. 安装 Nx: `bun add -D nx @nx/next`
2. 初始化: `nx init`
3. 为每个项目创建 `project.json`
4. 配置 `nx.json` 和缓存策略
5. 逐步迁移脚本到 Nx targets

---

## 结论

**对于当前项目：推荐继续使用方式 1**

- ✅ 简单直接，易于维护
- ✅ 零学习成本
- ✅ 满足当前需求
- ✅ 未来可以平滑迁移到 Nx

**如果项目规模扩大，再考虑迁移到 Nx 也不迟。**

