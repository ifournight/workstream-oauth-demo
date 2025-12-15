# OAuth 2.0 Verification Guide - Authorization Code & Device Authorization Flows

This guide demonstrates how to verify both **Authorization Code Flow** and **Device Authorization Flow** using Ory Hydra with curl commands and a local TypeScript server.

## Prerequisites

- Ory Hydra server running at: `https://hydra-admin.priv.dev.workstream.is`
- Access to Hydra Admin UI: `https://hydra-admin.priv.dev.workstream.is/admin/clients`
- Bun or Node.js installed
- ngrok or similar tool for exposing local server (optional, but recommended)

## Step 1: Create OAuth2 Client

First, create an OAuth2 client that supports both flows. You can do this via the Hydra Admin UI or using curl.

### Option A: Using Hydra Admin UI

1. Navigate to: `https://hydra-admin.priv.dev.workstream.is/admin/clients`
2. Click "Create Client"
3. Configure the client with:
   - **Grant Types**: `authorization_code`, `urn:ietf:params:oauth:grant-type:device_code`
   - **Response Types**: `code`
   - **Redirect URIs**: `http://localhost:3000/callback` (or your ngrok URL)
   - **Scopes**: `openid offline` (or your required scopes)
   - **Token Endpoint Auth Method**: `client_secret_post` or `client_secret_basic`

### Option B: Using curl (via Admin API)

```bash
curl -X POST 'https://hydra-admin.priv.dev.workstream.is/admin/clients' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Workstream OAuth Demo Client",
    "grant_types": [
      "authorization_code",
      "urn:ietf:params:oauth:grant-type:device_code"
    ],
    "response_types": ["code"],
    "scope": "openid offline",
    "redirect_uris": ["http://localhost:3000/callback"],
    "token_endpoint_auth_method": "client_secret_post"
  }'
```

**Save the `client_id` and `client_secret` from the response!**

## Step 2: Expose Local Server (Optional but Recommended)

To test the Authorization Code flow, you need a publicly accessible redirect URI. Use ngrok:

```bash
# Install ngrok if needed
# brew install ngrok (macOS)
# or download from https://ngrok.com/

# Expose local port 3000
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update your client's redirect URI in Hydra Admin UI.

## Step 3: Authorization Code Flow

The Authorization Code Flow is the most common OAuth 2.0 flow for web applications.

### Flow Overview

1. User is redirected to authorization endpoint
2. User authenticates and grants consent
3. Authorization server redirects back with authorization code
4. Client exchanges authorization code for access token

### Step 3.1: Start the Local Server

```bash
# Install dependencies
bun install

# Start the server
bun run dev
```

The server will run on `http://localhost:3000` and handle the OAuth callback.

### Step 3.2: Initiate Authorization Request

Construct the authorization URL (replace placeholders with your actual values):

```
https://hydra-public.priv.dev.workstream.is/oauth2/auth?client_id=YOUR_CLIENT_ID&response_type=code&scope=openid%20offline&redirect_uri=http://localhost:3000/callback&state=random_state_string_12345
```

**Using curl to get the authorization URL:**

```bash
# Set your variables
export CLIENT_ID="your-client-id"
export REDIRECT_URI="http://localhost:3000/callback"
export STATE="$(openssl rand -hex 16)"

# Construct and open authorization URL
AUTH_URL="https://hydra-public.priv.dev.workstream.is/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&scope=openid%20offline&redirect_uri=${REDIRECT_URI}&state=${STATE}"

echo "Visit this URL in your browser:"
echo "${AUTH_URL}"
```

**Or open it directly in browser:**
```bash
open "${AUTH_URL}"  # macOS
# or
xdg-open "${AUTH_URL}"  # Linux
```

### Step 3.3: Handle Callback (Automatic)

The local server will automatically:
1. Receive the callback at `/callback`
2. Extract the authorization code
3. Exchange it for tokens
4. Display the tokens

### Step 3.4: Manual Token Exchange (Alternative)

If you want to test the token exchange manually with curl:

```bash
# After receiving the authorization code from the callback
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
export AUTH_CODE="authorization-code-from-callback"
export REDIRECT_URI="http://localhost:3000/callback"

curl -X POST 'https://hydra-public.priv.dev.workstream.is/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code&code=${AUTH_CODE}&redirect_uri=${REDIRECT_URI}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}"
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "openid offline"
}
```

## Step 4: Device Authorization Flow

The Device Authorization Flow (RFC 8628) is designed for devices with limited input capabilities (e.g., smart TVs, IoT devices).

### Flow Overview

1. Device requests device and user codes
2. User visits verification URI on another device
3. User enters user code and grants consent
4. Device polls token endpoint until authorization is complete
5. Device receives access token

### Step 4.1: Request Device and User Codes

```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"

curl -X POST 'https://hydra-public.priv.dev.workstream.is/oauth2/device/auth' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=openid offline"
```

**Expected Response:**
```json
{
  "device_code": "device_code_here",
  "user_code": "ABCD-EFGH",
  "verification_uri": "https://hydra-public.priv.dev.workstream.is/device",
  "verification_uri_complete": "https://hydra-public.priv.dev.workstream.is/device?user_code=ABCD-EFGH",
  "expires_in": 1800,
  "interval": 5
}
```

**Save the `device_code` and note the `user_code` and `verification_uri`!**

### Step 4.2: User Authorization

1. Display the `user_code` to the user (e.g., `ABCD-EFGH`)
2. Instruct the user to visit: `verification_uri` (or `verification_uri_complete` for convenience)
3. User enters the code and grants consent

### Step 4.3: Poll for Access Token

While the user is authorizing, poll the token endpoint:

```bash
export DEVICE_CODE="device_code_from_step_4.1"
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"

# Poll the token endpoint
curl -X POST 'https://hydra-public.priv.dev.workstream.is/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${DEVICE_CODE}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}"
```

**Important Notes:**
- Poll at the interval specified in the initial response (e.g., every 5 seconds)
- If you receive `authorization_pending`, continue polling
- If you receive `slow_down`, increase the polling interval
- Once authorized, you'll receive the access token

**Expected Response (while pending):**
```json
{
  "error": "authorization_pending",
  "error_description": "The user has not yet completed the authorization"
}
```

**Expected Response (after authorization):**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "openid offline"
}
```

### Step 4.4: Automated Polling Script

You can use the provided demo script to automate polling:

```bash
bun run src/demos/device-flow.ts
```

Or create a simple polling script:

```bash
#!/bin/bash
DEVICE_CODE="your-device-code"
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"
INTERVAL=5

while true; do
  RESPONSE=$(curl -s -X POST 'https://hydra-public.priv.dev.workstream.is/oauth2/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${DEVICE_CODE}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}")
  
  if echo "$RESPONSE" | grep -q "access_token"; then
    echo "Success! Access token received:"
    echo "$RESPONSE" | jq .
    break
  elif echo "$RESPONSE" | grep -q "slow_down"; then
    INTERVAL=$((INTERVAL + 5))
    echo "Slow down requested, increasing interval to ${INTERVAL}s"
  elif echo "$RESPONSE" | grep -q "expired_token"; then
    echo "Device code expired. Please start over."
    break
  else
    echo "Waiting for authorization... (polling every ${INTERVAL}s)"
  fi
  
  sleep $INTERVAL
done
```

## Step 5: Using the Local Server

The TypeScript server (`src/server.ts`) provides:

1. **Callback Handler** (`/callback`): Automatically handles Authorization Code flow callbacks
2. **Device Flow Demo** (`/device-demo`): Interactive page for Device Authorization flow
3. **Token Display**: Shows received tokens in a readable format

### Server Endpoints

- `GET /`: Home page with links to both flows
- `GET /callback`: OAuth callback handler (Authorization Code flow)
- `GET /device-demo`: Device Authorization flow demo page
- `POST /device/poll`: Poll token endpoint for device flow

## Environment Variables

Create a `.env` file (optional, or pass via command line):

```bash
HYDRA_PUBLIC_URL=https://hydra-public.priv.dev.workstream.is
HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
PORT=3000
```

## Troubleshooting

### Common Issues

1. **Invalid redirect_uri**: Ensure the redirect URI in your client matches exactly (including protocol, port, path)
2. **CORS errors**: Make sure you're using the correct Hydra public URL
3. **Device code expired**: Device codes typically expire in 15-30 minutes. Start a new flow if expired.
4. **Authorization pending**: User hasn't completed authorization yet. Continue polling.

### Debug Tips

- Check Hydra logs for detailed error messages
- Verify client configuration in Hydra Admin UI
- Use browser developer tools to inspect network requests
- Check that scopes match between client config and authorization request

## References

- [Ory Hydra API Documentation](https://www.ory.com/docs/hydra/reference/api#tag/oAuth2/operation/createOAuth2Client)
- [OAuth 2.0 Authorization Code Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.1)
- [OAuth 2.0 Device Authorization Flow (RFC 8628)](https://tools.ietf.org/html/rfc8628)

