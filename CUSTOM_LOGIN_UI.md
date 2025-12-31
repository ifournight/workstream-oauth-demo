# 自定义登录 UI 实现指南

本文档说明当前登录流程的实现方式，以及如何实现自定义登录 UI（需要 Hydra 管理员配合）。

## 当前登录流程

### 流程概述

当前应用的登录流程使用 **PKCE (Proof Key for Code Exchange)** 方式：

1. 用户访问 `/login` 页面
2. 点击登录按钮，重定向到 `/api/auth/login`
3. `/api/auth/login` 生成 PKCE 参数（`code_verifier` 和 `code_challenge`）
4. 重定向到 Hydra 的授权端点：`{hydraPublicUrl}/oauth2/auth?prompt=login&...`
5. **Hydra 显示自己的登录 UI**，用户输入密码
6. Hydra 验证成功后，重定向到 `/api/auth/callback`
7. `/api/auth/callback` 使用 `code_verifier` 交换 authorization code 获取 access token
8. 创建 session 并重定向到 `returnUrl`

### 关键点

- **密码输入在 Hydra UI 中完成**，不在我们的应用中
- 我们的 `/login` 页面只是一个入口，点击按钮后立即重定向到 Hydra
- 使用 PKCE 增强安全性（即使 client 是 public client）

### 代码位置

- `app/login/page.tsx` - 登录页面 UI（仅显示按钮）
- `app/api/auth/login/route.ts` - 生成 PKCE 参数并重定向到 Hydra
- `app/api/auth/callback/route.ts` - 处理 Hydra 回调，交换 token，创建 session
- `lib/oauth.ts` - PKCE 辅助函数（`generateCodeVerifier`, `generateCodeChallenge`）

## 实现自定义登录 UI

### 重要限制

**如果 dev 环境的 Hydra 不受你的管理和控制，无法实现自定义登录 UI。**

原因：
- Hydra 在需要用户登录时，会重定向到它配置的登录 URL（`urls.login`）
- 如果 Hydra 配置的登录 URL 是它自己的 UI，用户就会被重定向到 Hydra 的登录页面
- 无法绕过这个流程

### 如果 Hydra 受控制（需要 Hydra 管理员配合）

如果要实现自定义登录 UI，需要以下步骤：

#### 1. Hydra 配置（需要 Hydra 管理员）

Hydra 管理员需要配置 `urls.login` 参数，指向你的自定义登录页面：

**配置方式**：
- 在 Hydra 配置文件中设置：`urls.login=http://localhost:3000/login/hydra`
- 或通过环境变量：`URLS_LOGIN=http://localhost:3000/login/hydra`

**配置示例**（Hydra 配置文件）：
```yaml
urls:
  login: http://localhost:3000/login/hydra
```

**配置示例**（环境变量）：
```bash
export URLS_LOGIN=http://localhost:3000/login/hydra
```

当 Hydra 需要用户登录时，会重定向到这个 URL，并传递 `login_challenge` 参数。

#### 2. 实现自定义登录页面

创建 `/app/login/hydra/page.tsx` 页面：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { config } from '@/lib/config'

export default function HydraLoginPage() {
  const searchParams = useSearchParams()
  const loginChallenge = searchParams.get('login_challenge')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loginChallenge) {
    return <div>Missing login_challenge parameter</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. 验证用户凭证（调用你的用户服务）
      // 这里需要实现实际的用户验证逻辑
      const userResponse = await fetch('/api/auth/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!userResponse.ok) {
        throw new Error('Invalid credentials')
      }

      const user = await userResponse.json()

      // 2. 接受 Hydra 登录请求
      const acceptResponse = await fetch(
        `${config.hydraAdminUrl}/oauth2/auth/requests/login/accept`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login_challenge: loginChallenge,
            subject: user.id, // 用户 ID
            remember: true,
            remember_for: 3600, // 记住登录 1 小时
          }),
        }
      )

      if (!acceptResponse.ok) {
        throw new Error('Failed to accept login request')
      }

      const { redirect_to } = await acceptResponse.json()

      // 3. 重定向回 Hydra 授权流程
      window.location.href = redirect_to
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2>Sign In</h2>
        {error && <div className="text-red-500">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

#### 3. 实现用户凭证验证 API

创建 `/app/api/auth/verify-credentials/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // 实现实际的用户验证逻辑
  // 例如：调用 UMS API 或其他用户服务
  // const user = await verifyUserCredentials(email, password)

  // 示例响应
  return NextResponse.json({
    id: 'user-id',
    email: email,
  })
}
```

#### 4. 技术细节

**Hydra Login Challenge Flow**：

1. Hydra 重定向到自定义登录页面，传递 `login_challenge` 参数
2. 自定义登录页面显示登录表单
3. 用户提交凭证后，验证用户身份
4. 调用 Hydra Admin API 接受登录请求：
   ```
   PUT {hydraAdminUrl}/oauth2/auth/requests/login/accept
   Body: {
     "login_challenge": "...",
     "subject": "user-id",
     "remember": true,
     "remember_for": 3600
   }
   ```
5. Hydra 返回 `redirect_to` URL
6. 重定向到 `redirect_to`，Hydra 继续 OAuth 授权流程

**Hydra Admin API 端点**：
- 获取登录请求信息：`GET /oauth2/auth/requests/login?login_challenge=...`
- 接受登录请求：`PUT /oauth2/auth/requests/login/accept`
- 拒绝登录请求：`PUT /oauth2/auth/requests/login/reject`

**安全注意事项**：
- 确保 Hydra Admin API 端点有适当的访问控制
- 在生产环境中使用 HTTPS
- 验证 `login_challenge` 的有效性
- 实现适当的错误处理和日志记录

## 总结

- **当前情况**：密码输入在 Hydra UI 中完成，因为 dev 环境的 Hydra 不受控制
- **实现自定义 UI**：需要 Hydra 管理员配置 `urls.login`，然后实现自定义登录页面和用户验证逻辑
- **推荐**：如果无法控制 Hydra，保持当前实现方式（使用 Hydra 默认 UI）

## 参考资源

- [Ory Hydra Login Flow Documentation](https://www.ory.com/docs/hydra/concepts/login)
- [Ory Hydra Admin API - Login Requests](https://www.ory.com/docs/hydra/reference/api#tag/oAuth2/operation/getOAuth2LoginRequest)

