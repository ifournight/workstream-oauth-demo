# OAuth 2.0 - Complete Guide

## What is OAuth 2.0?

**OAuth 2.0** is an **authorization framework** that allows applications to obtain **limited access** to user accounts on an HTTP service. It's **NOT** an authentication protocol (that's OpenID Connect), but it's often used together.

### Key Concept: Delegation

OAuth 2.0 solves this problem: **"How can I let a third-party app access my data without giving them my password?"**

**Without OAuth:**
```
User → Gives password to App → App can do EVERYTHING (dangerous!)
```

**With OAuth:**
```
User → Authorizes App → App gets limited access token → App can only do specific things
```

## The Actors in OAuth 2.0

There are **4 main actors** in every OAuth flow:

1. **Resource Owner (User)**
   - The person who owns the data
   - Example: You, the user who wants to connect your account

2. **Client (Your Application)**
   - The app that wants to access the user's data
   - Example: Your OAuth app running on `localhost:3000`

3. **Authorization Server (Ory Hydra)**
   - Issues access tokens after authenticating the user
   - Example: `https://hydra-public.priv.dev.workstream.is`
   - Has two endpoints:
     - **Authorization Endpoint**: Where users log in (`/oauth2/auth`)
     - **Token Endpoint**: Where apps exchange codes for tokens (`/oauth2/token`)

4. **Resource Server (Workstream API)**
   - The API that has the protected data
   - Example: `https://api.dev.workstream.us/hris/v1/jobs`
   - Accepts access tokens to authorize requests

## OAuth 2.0 Authorization Code Flow (Most Common)

This is the flow we're implementing. It's designed for **web applications** and **mobile apps** that can securely store a client secret.

### Step-by-Step Breakdown

#### Step 1: User Initiates Login
```
User clicks "Login" or "Connect Account" in your app
```

**What happens:**
- Your app generates a **state** parameter (random string for CSRF protection)
- Your app constructs an authorization URL
- Your app redirects the user's browser to the authorization server

**Example URL:**
```
https://hydra-public.priv.dev.workstream.is/oauth2/auth?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  scope=openid offline&
  redirect_uri=http://localhost:3000/callback&
  state=random_security_string_12345
```

**Parameters explained:**
- `client_id`: Identifies your app
- `response_type=code`: Request an authorization code (not a token directly)
- `scope`: What permissions you're requesting (`openid` = identity, `offline` = refresh token)
- `redirect_uri`: Where to send the user back after authorization
- `state`: Random string to prevent CSRF attacks

#### Step 2: User Authenticates
```
User's browser → Authorization Server login page
```

**What happens:**
- User sees the authorization server's login page
- User enters their credentials (username/password)
- Authorization server authenticates the user
- **Important**: Your app never sees the user's password!

#### Step 3: User Grants Consent
```
Authorization Server → Shows consent screen
```

**What happens:**
- Authorization server shows what permissions your app is requesting
- User clicks "Allow" or "Authorize"
- Authorization server generates an **authorization code** (short-lived, ~10 minutes)

#### Step 4: Redirect Back with Code
```
Authorization Server → Redirects browser → Your App
```

**What happens:**
- Browser is redirected to your `redirect_uri`
- Authorization code is included in the URL as a query parameter
- State parameter is also included (for verification)

**Example redirect:**
```
http://localhost:3000/callback?
  code=abc123xyz789&
  state=random_security_string_12345
```

**Security Note:**
- The code is in the URL (visible in browser history)
- But it's **short-lived** and **single-use**
- It can't be used without the client secret

#### Step 5: Exchange Code for Token
```
Your App (Server) → Token Endpoint → Authorization Server
```

**What happens:**
- Your app makes a **server-to-server** request (not from browser!)
- Sends the authorization code + client secret
- Authorization server validates:
  - Code is valid and not expired
  - Code hasn't been used before
  - Redirect URI matches
  - Client secret is correct

**Request:**
```http
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=abc123xyz789&
redirect_uri=http://localhost:3000/callback&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def456uvw012",
  "scope": "openid offline"
}
```

#### Step 6: Use Access Token
```
Your App → Resource Server (API) → Returns Protected Data
```

**What happens:**
- Your app includes the access token in API requests
- Resource server validates the token
- If valid, returns the requested data

**Request:**
```http
GET /hris/v1/jobs
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "123",
      "title": "Software Engineer",
      ...
    }
  ]
}
```

## Why This Flow is Secure

### 1. **User Password Never Leaves Authorization Server**
- Your app never sees the user's password
- User logs in directly with the authorization server

### 2. **Authorization Code is Short-Lived**
- Code expires in ~10 minutes
- Even if intercepted, it's useless after expiration

### 3. **Code Requires Client Secret**
- Code alone is useless
- Must be exchanged with client secret (server-side only)

### 4. **State Parameter Prevents CSRF**
- Random state generated by your app
- Must match when returned
- Prevents attackers from tricking users

### 5. **Redirect URI Validation**
- Authorization server only redirects to pre-registered URIs
- Prevents code interception attacks

## Other OAuth 2.0 Flows

### Device Authorization Flow (RFC 8628)
**Use case:** Devices without browsers or with limited input (TVs, IoT devices)

**How it works:**
1. Device requests device code and user code
2. Device displays user code (e.g., "ABCD-EFGH")
3. User visits verification URL on another device (phone/computer)
4. User enters user code and authorizes
5. Device polls token endpoint until authorized
6. Device receives access token

**Why different:**
- No browser redirect possible
- User authorizes on a different device
- Device polls instead of receiving redirect

### Client Credentials Flow
**Use case:** Server-to-server communication (no user involved)

**How it works:**
1. Client sends client_id + client_secret to token endpoint
2. Receives access token directly
3. Uses token for API calls

**Why different:**
- No user interaction needed
- Machine-to-machine communication

### Implicit Flow (Deprecated)
**Status:** Not recommended, being phased out

**Why deprecated:**
- Returns token directly in URL fragment
- Less secure than Authorization Code flow
- Being replaced by Authorization Code flow with PKCE

## Key Concepts

### Scopes
**What they are:** Permissions that define what your app can do

**Examples:**
- `openid`: Request user's identity (OpenID Connect)
- `offline`: Request refresh token for long-lived access
- `read:jobs`: Read job listings
- `write:jobs`: Create/update jobs

**Best practice:** Request only the scopes you need (principle of least privilege)

### Access Tokens
**What they are:** Credentials used to access protected resources

**Characteristics:**
- Short-lived (typically 1 hour)
- Opaque or JWT format
- Sent in `Authorization: Bearer <token>` header
- Can be revoked

### Refresh Tokens
**What they are:** Long-lived credentials to get new access tokens

**Characteristics:**
- Long-lived (days/weeks/months)
- Stored securely (never in URL)
- Used to get new access tokens when they expire
- Can be revoked

### Client Types

**Confidential Client:**
- Can securely store client secret
- Examples: Web apps with backend, mobile apps with secure storage
- Uses Authorization Code flow

**Public Client:**
- Cannot securely store client secret
- Examples: Single-page apps, mobile apps
- Uses Authorization Code flow with PKCE (Proof Key for Code Exchange)

## Security Best Practices

### 1. **Always Use HTTPS**
- OAuth requires HTTPS in production
- Prevents man-in-the-middle attacks

### 2. **Validate State Parameter**
- Generate random state for each request
- Verify it matches on callback
- Prevents CSRF attacks

### 3. **Store Client Secret Securely**
- Never in client-side code
- Use environment variables
- Never commit to version control

### 4. **Validate Redirect URIs**
- Only allow pre-registered redirect URIs
- Exact match required (including protocol, port, path)

### 5. **Use Short-Lived Tokens**
- Access tokens should expire quickly
- Use refresh tokens for long-lived access

### 6. **Implement Token Revocation**
- Allow users to revoke access
- Invalidate tokens when user logs out

## Real-World Examples

### Example 1: "Sign in with Google"
```
1. You click "Sign in with Google" on a website
2. Website redirects you to Google's login page
3. You enter your Google password (website never sees it)
4. Google shows consent screen: "Allow Website to access your email?"
5. You click "Allow"
6. Google redirects back to website with code
7. Website exchanges code for token (server-side)
8. Website can now access your Google email (with your permission)
```

### Example 2: Connecting Instagram to a Photo App
```
1. Photo app wants to access your Instagram photos
2. You click "Connect Instagram"
3. Redirected to Instagram login
4. You log in and authorize
5. Photo app gets access token
6. Photo app can now read your Instagram photos
```

## Common OAuth Errors

### `invalid_client`
- Client ID or secret is wrong
- Client not registered

### `invalid_grant`
- Authorization code is invalid or expired
- Code already used
- Redirect URI doesn't match

### `invalid_redirect_uri`
- Redirect URI not registered
- Redirect URI doesn't match exactly

### `access_denied`
- User denied authorization
- User cancelled the flow

### `unauthorized_client`
- Client not authorized for this grant type
- Client not allowed to use this flow

## OAuth 2.0 vs OpenID Connect (OIDC)

**OAuth 2.0:**
- Authorization framework
- About **access** (what can you do?)
- Returns access tokens

**OpenID Connect:**
- Authentication layer on top of OAuth 2.0
- About **identity** (who are you?)
- Returns ID tokens (JWT with user info)
- Uses `openid` scope

**Together:**
- OAuth 2.0 handles authorization
- OIDC handles authentication
- Often used together (like in our flow with `openid` scope)

## Summary

OAuth 2.0 is a **delegation protocol** that allows:
- Users to grant limited access to their resources
- Apps to access user data without seeing passwords
- Secure, standardized authorization

**Key takeaway:** OAuth 2.0 separates **authentication** (proving who you are) from **authorization** (what you can do), making it more secure and flexible than sharing passwords.

## Further Reading

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 8628 - OAuth 2.0 Device Authorization Grant](https://tools.ietf.org/html/rfc8628)
- [Ory Hydra Documentation](https://www.ory.sh/docs/hydra/)
- [OAuth.net](https://oauth.net/2/)

