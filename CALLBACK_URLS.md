# Callback URL 配置指南

本文档说明 OAuth app 中不同流程使用的 callback URL 及其配置要求。

## 两种不同的 Callback URL

本应用使用两种不同的 callback URL，分别用于不同的场景：

### 1. 登录流程 Callback URL

**URL**: `/api/auth/callback`

**完整 URL 示例**:
- 开发环境: `http://localhost:3000/api/auth/callback`
- 生产环境: `https://your-domain.com/api/auth/callback`

**用途**: 
- 处理应用登录流程的 OAuth 回调
- 交换 authorization code 获取 access token
- 创建应用 session（存储 token 在安全 cookie 中）
- 提取 identity ID 并存储在 session 中
- 登录成功后重定向到 `returnUrl`

**使用场景**: 
- 用户访问 `/login` 页面并点击登录按钮
- 流程: `/api/auth/login` → Hydra Authorization → `/api/auth/callback` → 创建 session → 重定向

### 2. Auth Code Flow Callback URL

**URL**: `/callback`

**完整 URL 示例**:
- 开发环境: `http://localhost:3000/callback`
- 生产环境: `https://your-domain.com/callback`

**用途**:
- 处理 OAuth Authorization Code Flow 的回调
- 交换 authorization code 获取 access token
- **不创建应用 session**（仅用于演示和测试）
- 显示 token 信息（access token, refresh token 等）
- 提供 API 测试界面

**使用场景**:
- 用户在 `/auth` 页面配置并启动 Authorization Code Flow
- 流程: `/api/auth/init` → Hydra Authorization → `/callback` → 显示 token 信息

## 在 Hydra Client 中配置

### 如果同一个 Client 用于两种场景

如果同一个 OAuth client 既用于应用登录，又用于 Authorization Code Flow 演示，你需要在 Hydra client 的 `redirect_uris` 数组中**同时包含两个 URL**：

```json
{
  "client_id": "your-client-id",
  "redirect_uris": [
    "http://localhost:3000/api/auth/callback",
    "http://localhost:3000/callback"
  ]
}
```

### 如果使用不同的 Client

如果你使用不同的 client 用于不同的场景：

**登录 Client** (`CLIENT_ID` 环境变量):
```json
{
  "client_id": "login-client-id",
  "redirect_uris": [
    "http://localhost:3000/api/auth/callback"
  ]
}
```

**Auth Code Flow Client**:
```json
{
  "client_id": "demo-client-id",
  "redirect_uris": [
    "http://localhost:3000/callback"
  ]
}
```

## 配置示例

### 使用 Hydra Admin API 创建 Client

```bash
curl -X POST https://hydra-admin.priv.dev.workstream.is/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "OAuth App Client",
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "scope": "openid offline",
    "redirect_uris": [
      "http://localhost:3000/api/auth/callback",
      "http://localhost:3000/callback"
    ],
    "token_endpoint_auth_method": "client_secret_post"
  }'
```

### 使用脚本创建 Client

项目中的 `scripts/create-client.ts` 默认只配置 `/callback`。如果需要同时支持登录流程，需要手动更新 client 的 `redirect_uris`。

## 重要注意事项

1. **URL 必须完全匹配**: Hydra 会严格验证 `redirect_uri` 参数必须与 client 配置的 `redirect_uris` 之一完全匹配（包括协议、域名、端口、路径）

2. **环境变量**: 确保 `NEXT_PUBLIC_BASE_URL` 环境变量正确设置，代码会使用它来构建完整的 callback URL

3. **生产环境**: 在生产环境中，确保使用 HTTPS 和正确的域名

4. **测试**: 在创建或更新 client 后，测试两个流程确保 callback URL 都正常工作

## 相关文件

- `app/api/auth/login/route.ts` - 登录流程入口，使用 `/api/auth/callback`
- `app/api/auth/callback/route.ts` - 登录回调处理
- `app/api/auth/init/route.ts` - Auth code flow 入口，使用 `/callback`
- `app/callback/page.tsx` - Auth code flow 回调页面

