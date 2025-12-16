# Workstream OAuth Apps - Verification Server

This project provides a TypeScript server and demo scripts to verify OAuth 2.0 flows (Authorization Code, Device Authorization, and Client Credentials) with Ory Hydra.

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
   
   # Or using Node.js
   npm run start:node
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
.
├── src/
│   ├── server.ts                    # Main server with OAuth flows and client management
│   ├── controllers/
│   │   └── viewController.ts       # EJS view rendering controller
│   ├── views/                       # EJS templates
│   │   ├── home.ejs                 # Home page
│   │   ├── client-credentials-demo.ejs
│   │   └── clients.ejs              # Client management UI
│   ├── demos/                       # Command-line demo scripts
│   │   ├── auth-code-flow.ts
│   │   ├── device-flow.ts
│   │   └── client-credentials-flow.ts
│   └── scripts/                     # Utility scripts
│       ├── create-client.ts
│       ├── update-client.ts
│       └── test-api.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- ✅ **Authorization Code Flow** - Interactive web UI and command-line demo
- ✅ **Device Authorization Flow** - For devices with limited input capabilities
- ✅ **Client Credentials Flow** - Machine-to-machine authentication (no user interaction)
- ✅ **OAuth Client Management** - Full CRUD UI for managing OAuth clients
- ✅ **Token Inspection** - JWT token decoding to view scopes, audience, and claims
- ✅ **API Testing** - Built-in API testing with access tokens
- ✅ **Runtime Detection** - Auto-detects Bun or Node.js and uses appropriate server

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HYDRA_PUBLIC_URL` | Ory Hydra public endpoint | `https://oauth2.dev.workstream.us` |
| `HYDRA_ADMIN_URL` | Ory Hydra admin endpoint | `https://hydra-admin.priv.dev.workstream.is` |
| `CLIENT_ID` | OAuth client ID | (required) |
| `CLIENT_SECRET` | OAuth client secret | (required) |
| `PORT` | Server port | `3000` |
| `REDIRECT_URI` | OAuth redirect URI | `http://localhost:3000/callback` |

## Usage

### Web UI

1. Start the server: `bun run dev` or `npm run start:node`
2. Visit `http://localhost:3000`
3. Choose a flow:
   - **Authorization Code Flow** - Interactive user authentication
   - **Device Authorization Flow** - For devices with limited input
   - **Client Credentials Flow** - Machine-to-machine (no user interaction)
   - **Client Management** - Create, edit, and delete OAuth clients

### Command-Line Demos

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

**Client Credentials Flow:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
bun run src/demos/client-credentials-flow.ts
```

### Client Management

Use the web UI at `/clients` or the scripts:

**Create a client:**
```bash
bun run src/scripts/create-client.ts
```

**Update a client:**
```bash
bun run src/scripts/update-client.ts
```

## Architecture

The project uses a simple MVC-like structure:

- **Controllers**: `src/controllers/viewController.ts` - Handles view rendering
- **Views**: `src/views/*.ejs` - EJS templates for HTML pages
- **Server**: `src/server.ts` - Main application with routes and API endpoints

## Troubleshooting

### VPN Connection Required

If you see certificate/SSL errors, ensure you're connected to the company VPN when accessing Hydra admin endpoints.

### Token Scopes

The token's scopes are determined by:
1. The client's configured scopes (whitelist)
2. The scopes requested in the token request

Update the client's scope configuration and refresh the demo page to use new scopes.

### 401 Unauthorized

If API calls return 401, check:
- Token scopes match API requirements
- Token audience includes the API endpoint
- Token hasn't expired

The demo includes JWT token decoding to help diagnose issues.

## References

- [Ory Hydra API Documentation](https://www.ory.com/docs/hydra/reference/api#tag/oAuth2/operation/createOAuth2Client)
- [OAuth 2.0 Authorization Code Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.1)
- [OAuth 2.0 Device Authorization Flow (RFC 8628)](https://tools.ietf.org/html/rfc8628)
- [OAuth 2.0 Client Credentials Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.4)
