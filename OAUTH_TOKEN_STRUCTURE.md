# OAuth 2.0 Token Structure & Client Relationship

## Your Understanding is Correct! ✅

You've grasped the key concepts. Let me confirm and add some details:

## Token Structure

### Access Token Contains:

1. **Subject (sub)** - User Identity
   - Comes from **Ory Kratos** (identity system)
   - Identifies **WHO** the token represents
   - Example: `"sub": "user-123"` or `"sub": "john@example.com"`

2. **Audience (aud)** - Client Identity (optional, but common)
   - Identifies **WHICH CLIENT** the token is for
   - Example: `"aud": "your-client-id"`
   - Prevents token reuse by wrong client

3. **Scopes** - Permissions
   - What the user **authorized** the client to do
   - Example: `"scope": "openid offline"`

4. **Expiration (exp)** - Token lifetime
   - When the token expires
   - Example: `"exp": 1234567890`

### Example JWT Token (decoded):

```json
{
  "sub": "user-123",                    // ← From Kratos (user identity)
  "aud": "your-client-id",  // ← Client ID (which app)
  "scope": "openid offline",            // ← Permissions granted
  "exp": 1734567890,                    // ← Expiration
  "iat": 1734564290                     // ← Issued at
}
```

## Client ID/Secret Role

### What Client Credentials Do:

1. **Authenticate the CLIENT** (not bind user to client)
   ```
   Client ID + Secret → Proves "I am a legitimate registered app"
   ```

2. **Authorize Token Exchange**
   - Only registered clients can exchange authorization codes
   - Prevents unauthorized apps from getting tokens

3. **Token Audience Validation**
   - Token may include client ID in `aud` claim
   - Resource server can verify token was issued for correct client

### What Client Credentials DON'T Do:

❌ **Don't bind users to clients**
- Same user can authorize multiple clients
- Each client gets its own token for that user

❌ **Don't store user credentials**
- User credentials are in Kratos
- Client only gets tokens, never passwords

## The Flow (Your Understanding):

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Authenticates                                   │
│    - User logs in with credentials                      │
│    - Kratos validates → Returns user identity (sub)     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Authorizes Client                               │
│    - User grants permission to client                   │
│    - Hydra generates authorization code                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Client Exchanges Code for Token                      │
│    - Client sends: code + client_id + client_secret     │
│    - Hydra validates:                                  │
│      ✓ Code is valid                                    │
│      ✓ Client credentials are correct                  │
│      ✓ Client is registered                             │
│    - Hydra creates token with:                          │
│      • sub (from Kratos - user identity)                │
│      • aud (client ID - which app)                     │
│      • scope (permissions granted)                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Client Uses Token for API Calls                      │
│    GET /api/jobs                                        │
│    Authorization: Bearer <token>                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Resource Server Validates Token                     │
│    - Decodes/validates token                            │
│    - Checks:                                            │
│      ✓ Token signature valid                           │
│      ✓ Token not expired                                │
│      ✓ Token audience matches expected client          │
│      ✓ User (sub) has permission for requested resource│
│    - Returns data if all checks pass                    │
└─────────────────────────────────────────────────────────┘
```

## Key Points (Your Understanding Confirmed):

### ✅ Correct:

1. **Token `sub` comes from Kratos**
   - User identity is managed by Kratos
   - Token includes this identity

2. **Token is independent of clients**
   - Same user → Multiple clients → Multiple tokens
   - Each token is separate

3. **Client ID/Secret authenticate the CLIENT**
   - Proves the app is legitimate
   - Required to exchange code for token
   - Not about binding user to client

4. **Server does permission checks**
   - Resource server validates token
   - Checks user permissions
   - Returns data based on scopes/permissions

### Additional Details:

1. **Token Audience (`aud`)**
   - Token may include client ID in `aud` claim
   - Resource server can verify token was issued for correct client
   - Prevents token reuse by wrong client

2. **Token Format**
   - Can be JWT (JSON Web Token) - contains user info
   - Can be opaque - server must introspect to get user info
   - Depends on Hydra configuration

3. **Permission Checking**
   - Resource server validates token
   - Checks `sub` (who) + `scope` (what permissions)
   - May check additional claims/attributes

## Example Scenario:

```
User: john@example.com (stored in Kratos)

Client A requests access:
  → User authorizes
  → Client A gets token: { sub: "john@example.com", aud: "client-a", scope: "read" }

Client B requests access:
  → User authorizes  
  → Client B gets token: { sub: "john@example.com", aud: "client-b", scope: "read write" }

Both tokens:
  - Same user (sub)
  - Different clients (aud)
  - Different permissions (scope)
```

## Your Implementation:

Your current code correctly:
- ✅ Exchanges code with client credentials
- ✅ Gets token with user identity (sub)
- ✅ Uses token for API calls
- ✅ Checks API response (200 vs 401)

The resource server (Workstream API) will:
- Validate the token
- Extract `sub` (user identity)
- Check permissions based on scopes
- Return appropriate data

## Summary:

You've got it right! 🎉

- **Token `sub`** = User identity (from Kratos) ✅
- **Token independent of clients** = Multiple clients, same user ✅
- **Client ID/Secret** = Authenticate client, get correct token ✅
- **Server permission checks** = Resource server validates and authorizes ✅

The token is the "key" that represents:
- **WHO** (sub - user identity)
- **WHICH APP** (aud - client)
- **WHAT PERMISSIONS** (scope)

And the resource server uses this information to decide what data to return!

