# Workstream OAuth Apps - Verification Server

This project provides a Next.js application with React UI to verify OAuth 2.0 flows (Authorization Code, Device Authorization, and Client Credentials) with Ory Hydra and UMS integration.

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Create `.env` file** (optional, can also use environment variables):
   ```bash
   # Copy and edit with your credentials
   HYDRA_PUBLIC_URL=https://hydra-public.priv.dev.workstream.is
   HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is
   UMS_BASE_URL=https://users.priv.dev.workstream.us/
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   # Using Bun (recommended)
   bun install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file:
   ```bash
   HYDRA_PUBLIC_URL=https://hydra-public.priv.dev.workstream.is
   HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is
   UMS_BASE_URL=https://users.priv.dev.workstream.us/
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
.
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page
│   ├── clients/                     # Global clients management
│   │   └── page.tsx
│   ├── identity-clients/            # Identity-specific clients management
│   │   └── page.tsx
│   ├── auth/                        # Authorization Code flow
│   │   └── page.tsx
│   ├── callback/                    # OAuth callback
│   │   └── page.tsx
│   ├── device-demo/                 # Device flow demo
│   │   └── page.tsx
│   ├── client-credentials-demo/     # Client credentials demo
│   │   └── page.tsx
│   ├── components/                  # Application-specific components
│   │   ├── page-header.tsx         # Page header with breadcrumbs
│   │   ├── sidebar-layout.tsx      # Sidebar navigation layout
│   │   ├── theme-toggle.tsx        # Theme toggle component
│   │   └── ui/                     # Custom UI components
│   │       ├── alert.tsx
│   │       ├── card.tsx
│   │       ├── modal.tsx
│   │       └── table.tsx
│   └── api/                         # API Routes
│       ├── clients/                 # Global clients API
│       ├── identity-clients/        # Identity clients API
│       ├── client-credentials/      # Client credentials token endpoint
│       ├── test-api/                # API testing endpoint
│       └── health/                  # Health check
├── components/                      # Untitled UI components (third-party library)
│   ├── base/                        # Base components (buttons, inputs, etc.)
│   ├── foundations/                # Foundation components (logos, icons)
│   ├── application/                 # Application UI components
│   └── shared-assets/               # Shared assets
├── hooks/                           # Custom React hooks
│   ├── use-breakpoint.ts           # Breakpoint detection hook
│   └── use-clipboard.ts            # Clipboard utility hook
├── providers/                       # Global React providers
│   ├── router-provider.tsx         # Next.js router integration for react-aria
│   └── theme-provider.tsx          # Theme management provider
├── lib/                             # Business logic and configuration
│   ├── config.ts                    # Environment configuration
│   ├── navigation.ts                # Navigation menu configuration
│   └── oauth.ts                     # OAuth helpers (PKCE, etc.)
├── utils/                           # Pure utility functions
│   ├── cx.ts                        # Class name utility
│   └── is-react-component.ts       # React component type guard
├── types/                           # Shared TypeScript type definitions
│   └── index.ts                     # Common types (BreadcrumbItem, etc.)
├── styles/                          # Global styles
│   ├── globals.css                  # Global CSS and Tailwind imports
│   ├── theme.css                    # Untitled UI theme variables
│   └── typography.css               # Typography styles
├── scripts/                         # CLI utility scripts
│   ├── create-client.ts            # Create OAuth client in Hydra
│   ├── update-client.ts            # Update OAuth client
│   └── test-api.ts                 # Test API with access token
├── demos/                           # OAuth flow demonstration scripts
│   ├── auth-code-flow.ts           # Authorization Code flow demo
│   ├── device-flow.ts              # Device Authorization flow demo
│   └── client-credentials-flow.ts  # Client Credentials flow demo
├── package.json
├── next.config.js                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

## Features

- ✅ **Authorization Code Flow** - Interactive web UI and command-line demo
- ✅ **Device Authorization Flow** - For devices with limited input capabilities (note: requires Ory configuration)
- ✅ **Client Credentials Flow** - Machine-to-machine authentication using UMS endpoint
- ✅ **OAuth Client Management** - Two modes:
  - **Global Clients (Hydra)** - Manage all clients directly in Hydra
  - **Identity-Specific Clients (UMS)** - Manage clients for a specific identity
- ✅ **Token Inspection** - JWT token decoding to view scopes, audience, and claims
- ✅ **API Testing** - Built-in API testing with access tokens
- ✅ **Runtime Detection** - Auto-detects Bun or Node.js and uses appropriate server
- ✅ **Docker Support** - Run in containerized environment

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HYDRA_PUBLIC_URL` | Ory Hydra public endpoint | `https://hydra-public.priv.dev.workstream.is` |
| `HYDRA_ADMIN_URL` | Ory Hydra admin endpoint | `https://hydra-admin.priv.dev.workstream.is` |
| `UMS_BASE_URL` | UMS base URL (for identity-specific clients and client credentials flow) | (required for UMS features) |
| `CLIENT_ID` | OAuth client ID | (optional, can be set per request) |
| `CLIENT_SECRET` | OAuth client secret | (optional, can be set per request) |
| `PORT` | Server port | `3000` |
| `TEST_API_URL` | API endpoint for testing tokens | (default test endpoint) |
| `COMPANY_ID` | Company ID for API calls | `eef568a4-86e4-4b51-bfeb-dc4daa831f6e` |

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
bun run demos/auth-code-flow.ts
```

**Device Authorization Flow:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
bun run demos/device-flow.ts
```

**Client Credentials Flow:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
bun run demos/client-credentials-flow.ts
```

### Client Management

Use the web UI at `/clients` or the scripts:

**Create a client:**
```bash
bun run scripts/create-client.ts
```

**Update a client:**
```bash
bun run scripts/update-client.ts
```

## Architecture

The project follows Next.js best practices with a clear separation of concerns:

- **Next.js App Router**: `app/` - All pages, API routes, and layouts
  - `app/components/` - Application-specific components (colocation)
  - `app/api/` - API routes for backend functionality
- **Untitled UI Components**: `components/` - Third-party component library (must be at root for proper imports)
- **Custom Components**: `app/components/` - Application-specific UI components
- **Hooks**: `hooks/` - Reusable React hooks
- **Providers**: `providers/` - Global React context providers
- **Business Logic**: `lib/` - Configuration, OAuth helpers, and navigation
- **Utilities**: `utils/` - Pure utility functions
- **Types**: `types/` - Shared TypeScript type definitions
- **Styles**: `styles/` - Global CSS and theme files
- **Scripts**: `scripts/` - CLI utility scripts for OAuth client management
- **Demos**: `demos/` - OAuth flow demonstration scripts

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up --build --force-recreate
```

## Troubleshooting

### VPN Connection Required

If you see certificate/SSL errors, ensure you're connected to the company VPN when accessing Hydra admin endpoints.

### Docker Issues

If Docker container fails to start:
- Check that port 3000 is not already in use: `lsof -i :3000`
- Verify environment variables are set correctly
- Check logs: `docker-compose logs oauth-server`

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
