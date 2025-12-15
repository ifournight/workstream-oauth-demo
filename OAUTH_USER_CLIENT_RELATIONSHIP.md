# OAuth 2.0: User-Client Relationship & API Verification

## Question 1: Do User Credentials Need to be Bound to OAuth Client ID?

### Short Answer: **NO**

In OAuth 2.0, **user credentials are NOT bound to the client ID**. Here's why:

### How OAuth 2.0 Works:

```
┌─────────────┐
│   User      │ (Has credentials in identity system - Ory Kratos)
└──────┬──────┘
       │
       │ 1. User authenticates with Authorization Server
       │    (NOT with the client!)
       │
┌──────▼──────────────────┐
│ Authorization Server    │ (Ory Hydra + Kratos)
│ - Validates user creds  │
│ - Issues access token   │
└──────┬──────────────────┘
       │
       │ 2. Access token represents:
       │    - User's identity (who)
       │    - User's authorization (what they allowed)
       │    - Client's permission (which app)
       │
┌──────▼──────┐
│   Client    │ (Your OAuth App)
│ - Uses token│
└──────┬──────┘
       │
       │ 3. Client calls API with token
       │
┌──────▼──────────────┐
│  Resource Server   │ (Workstream API)
│ - Validates token   │
│ - Returns user data │
└─────────────────────┘
```

### Key Points:

1. **User Authentication** happens at the **Authorization Server** (Hydra/Kratos)
   - User logs in with their credentials
   - Authorization server validates credentials
   - This is **independent** of which client is requesting access

2. **User Authorization** happens when user grants consent
   - User decides which client can access their data
   - Multiple clients can access the same user's data
   - User can revoke access per client

3. **Access Token** represents:
   - **Subject (sub)**: The user's identity
   - **Client ID (aud)**: Which client the token is for
   - **Scopes**: What permissions the user granted

### Example:

```
User: john@example.com
├── Authorizes Client A → Gets token A (for Client A, user john)
├── Authorizes Client B → Gets token B (for Client B, user john)
└── Both tokens represent the SAME user, but for DIFFERENT clients
```

## Question 2: Ory Hydra Recommendations

### Ory Hydra Best Practices:

1. **Separate Identity from Authorization**
   - **Ory Kratos**: Handles user identity (credentials, profiles)
   - **Ory Hydra**: Handles OAuth 2.0 authorization (tokens, clients)
   - Users are stored in Kratos, not bound to specific clients

2. **Client Registration**
   - Clients are registered independently
   - No user-client binding required
   - Clients can request access to any user's data (with user consent)

3. **Token Structure** (if using JWT):
   ```json
   {
     "sub": "user-id-123",           // User identifier
     "aud": "client-id-456",         // Client identifier
     "scope": "openid offline",      // Permissions
     "exp": 1234567890              // Expiration
   }
   ```

4. **User Identification in Tokens**
   - Use `openid` scope to get user identity
   - Request ID token (OpenID Connect) for user info
   - Access token may contain user info (depends on token format)

## Question 3: Best Way to Verify Connection in API Calls

### Current Implementation (Good Approach):

Your current server already implements good verification:

```typescript
// 1. Exchange code for token
const tokenResponse = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});

// 2. Test API call with token
const apiResponse = await fetch(API_URL, {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`,
  },
});

// 3. Verify success
if (apiResponse.ok && apiResponse.status !== 401) {
  // ✅ Authentication working!
}
```

### Recommended Verification Strategy:

#### 1. **Token Validation** (Basic)
```typescript
// Check if token was received
if (!tokenData.access_token) {
  throw new Error('No access token received');
}

// Check token type
if (tokenData.token_type !== 'Bearer') {
  throw new Error('Invalid token type');
}
```

#### 2. **API Call Verification** (Current - Good!)
```typescript
const apiResponse = await fetch(API_URL, {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`,
  },
});

// Success indicators:
if (apiResponse.status === 200) {
  // ✅ Token is valid, API call successful
  const data = await apiResponse.json();
  return { success: true, data };
}

// Error indicators:
if (apiResponse.status === 401) {
  // ❌ Token invalid/expired
  return { success: false, error: 'Unauthorized' };
}

if (apiResponse.status === 403) {
  // ❌ Token valid but insufficient permissions
  return { success: false, error: 'Forbidden' };
}
```

#### 3. **Enhanced Verification** (Recommended)

Add more comprehensive checks:

```typescript
async function verifyOAuthFlow(accessToken: string) {
  const results = {
    tokenReceived: !!accessToken,
    tokenFormat: 'unknown',
    apiCallSuccess: false,
    userInfo: null,
    error: null,
  };

  // 1. Check token format
  if (accessToken.startsWith('eyJ')) {
    // JWT token - can decode to get user info
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      results.tokenFormat = 'JWT';
      results.userInfo = {
        sub: payload.sub,        // User ID
        aud: payload.aud,        // Client ID
        exp: payload.exp,        // Expiration
        scope: payload.scope,    // Permissions
      };
    } catch (e) {
      results.tokenFormat = 'JWT (invalid)';
    }
  } else {
    results.tokenFormat = 'opaque';
  }

  // 2. Test API call
  try {
    const apiResponse = await fetch('https://api.dev.workstream.us/hris/v1/jobs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    results.apiCallSuccess = apiResponse.ok && apiResponse.status !== 401;

    if (results.apiCallSuccess) {
      results.data = await apiResponse.json();
    } else {
      results.error = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        body: await apiResponse.text(),
      };
    }
  } catch (error) {
    results.error = error.message;
  }

  return results;
}
```

#### 4. **Token Introspection** (Advanced - Optional)

If Hydra supports token introspection:

```typescript
// Check if token is still valid
const introspectionResponse = await fetch(
  `${HYDRA_PUBLIC_URL}/oauth2/introspect`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      token: accessToken,
    }),
  }
);

const introspection = await introspectionResponse.json();
// Returns: { active: true/false, sub: "user-id", ... }
```

## Summary: What You Should Do

### ✅ DO:
1. **Verify API call success** (you're already doing this!)
   - Check HTTP status codes
   - 200 = Success
   - 401 = Token invalid
   - 403 = Insufficient permissions

2. **Store token securely** (if needed)
   - Never in URL
   - Use secure storage (server-side)
   - Respect token expiration

3. **Handle token refresh** (if you have refresh token)
   - Use refresh token when access token expires
   - Request new access token automatically

### ❌ DON'T:
1. **Don't bind users to clients** - OAuth doesn't work that way
2. **Don't store user credentials** - Only store tokens
3. **Don't assume token format** - Can be JWT or opaque

## Your Current Implementation Assessment

Your current code in `src/server.ts` is **already doing the right things**:

✅ Exchanging authorization code for token  
✅ Making API call with Bearer token  
✅ Checking response status (200 vs 401)  
✅ Displaying results to user  

### Suggested Enhancements:

1. **Add token introspection** (if available)
2. **Decode JWT tokens** to show user info
3. **Handle token refresh** automatically
4. **Add more detailed error messages**

## Testing Checklist

When testing your OAuth flow, verify:

- [ ] Authorization code received
- [ ] Token exchange successful
- [ ] Access token received
- [ ] API call with token returns 200 (not 401)
- [ ] API returns actual data (not error)
- [ ] Token contains user information (if JWT)

Your current implementation already checks most of these! 🎉

