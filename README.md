# Workstream OAuth Apps - Verification Server

This project provides a TypeScript server and demo scripts to verify OAuth 2.0 flows (Authorization Code and Device Authorization) with Ory Hydra.

## Quick Start

1. **Install dependencies:**
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm/node
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.sample .env
   # Edit .env with your client credentials
   ```

3. **Start the server:**
   ```bash
   # Using Bun
   bun run dev
   
   # Or using Node.js (requires tsx or ts-node)
   npm run start:node
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Documentation

See [OAUTH_VERIFICATION_GUIDE.md](./OAUTH_VERIFICATION_GUIDE.md) for detailed instructions on:
- Creating OAuth clients
- Testing Authorization Code flow
- Testing Device Authorization flow
- Using curl commands
- Exposing local server with ngrok

## Project Structure

```
.
├── src/
│   ├── server.ts              # Main server with OAuth callback handlers
│   └── demos/
│       ├── auth-code-flow.ts  # Authorization Code flow demo script
│       └── device-flow.ts     # Device Authorization flow demo script
├── OAUTH_VERIFICATION_GUIDE.md  # Comprehensive verification guide
├── package.json
└── tsconfig.json
```

## Features

- ✅ Authorization Code Flow with automatic token exchange
- ✅ Device Authorization Flow with interactive polling
- ✅ Web UI for testing both flows
- ✅ cURL command examples
- ✅ TypeScript with Bun or Node.js support (auto-detects runtime)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HYDRA_PUBLIC_URL` | Ory Hydra public endpoint | `https://hydra-public.priv.dev.workstream.is` |
| `HYDRA_ADMIN_URL` | Ory Hydra admin endpoint | `https://hydra-admin.priv.dev.workstream.is` |
| `CLIENT_ID` | OAuth client ID | (required) |
| `CLIENT_SECRET` | OAuth client secret | (required) |
| `PORT` | Server port | `3000` |
| `REDIRECT_URI` | OAuth redirect URI | `http://localhost:3000/callback` |

## Usage

### Using the Web UI

1. Start the server:
   - With Bun: `bun run dev`
   - With Node.js: `npm run start:node` (requires tsx: `npm install -g tsx`)
2. Visit `http://localhost:3000`
3. Click "Start Authorization Code Flow" or "Start Device Flow"
4. Follow the on-screen instructions

### Using Demo Scripts

**Authorization Code Flow:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
bun run src/demos/auth-code-flow.ts
```

**Device Authorization Flow:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
bun run src/demos/device-flow.ts
```

### Using cURL

See [OAUTH_VERIFICATION_GUIDE.md](./OAUTH_VERIFICATION_GUIDE.md) for complete cURL examples.

## Exposing Local Server

To test with a public redirect URI, use ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS

# Expose local port
ngrok http 3000

# Update your OAuth client's redirect_uri in Hydra Admin UI
# to match the ngrok URL (e.g., https://abc123.ngrok.io/callback)
```

## References

- [Ory Hydra API Documentation](https://www.ory.com/docs/hydra/reference/api#tag/oAuth2/operation/createOAuth2Client)
- [OAuth 2.0 Authorization Code Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.1)
- [OAuth 2.0 Device Authorization Flow (RFC 8628)](https://tools.ietf.org/html/rfc8628)

