# Workstream OAuth Apps - Demo Application

This project is a demo application for Workstream OAuth apps management. It demonstrates how to integrate with Workstream's OAuth infrastructure to manage OAuth clients and obtain access tokens.

## Overview

This demo application showcases three key capabilities:

1. **Workstream Login Simulation**
   - Uses Hydra public endpoints (accessible via Workstream OpenVPN) with known client ID/secret
   - Simulates Workstream login flow to obtain identity ID
   - Demonstrates PKCE-based authentication flow

2. **OAuth Client Management**
   - Uses Hydra Admin API and UMS OAuth clients API (accessible via Workstream OpenVPN)
   - Manages two types of OAuth clients:
     - **Global Clients**: Managed directly in Hydra, accessible to all users
     - **My OAuth Clients**: Managed via UMS API, tied to specific user identities
   - Enables production-ready client ID/secret distribution for real users

3. **Token Exchange Demo**
   - Uses UMS OAuth App Token endpoint
   - Demonstrates how users can exchange their OAuth client ID/secret for access tokens
   - **Important**: This endpoint must be publicly exposed to users in production environments

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
   SESSION_SECRET=your-session-secret-at-least-32-characters-long
   ```
   
   **Important**: Generate a secure `SESSION_SECRET` (at least 32 characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
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
   SESSION_SECRET=your-session-secret-at-least-32-characters-long
   ```
   
   **Important**: Generate a secure `SESSION_SECRET` (at least 32 characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
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
│   ├── identity-clients/            # My OAuth Clients management
│   │   └── page.tsx
│   ├── oauth-apps-token/            # OAuth Apps Token Flow
│   │   └── page.tsx
│   ├── login/                       # Login page
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
├── docs/                            # Documentation site (Nextra)
│   ├── pages/                      # Documentation pages
│   ├── theme.config.tsx            # Nextra theme configuration
│   └── next.config.js             # Next.js configuration for docs
├── package.json
├── next.config.js                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

## Features

- ✅ **Workstream Login** - PKCE-based login flow simulating Workstream authentication
- ✅ **OAuth Client Management** - Two modes:
  - **Global Clients (Hydra)** - Manage all clients directly in Hydra Admin API
  - **My OAuth Clients (UMS)** - Manage clients for specific user identities via UMS API
- ✅ **Client Credentials Flow** - Machine-to-machine token exchange using UMS OAuth App Token endpoint
- ✅ **Token Inspection** - JWT token decoding to view scopes, audience, and claims
- ✅ **API Testing** - Built-in API testing with access tokens
- ✅ **Session Management** - Secure session management with iron-session
- ✅ **Runtime Detection** - Auto-detects Bun or Node.js and uses appropriate server
- ✅ **Docker Support** - Run in containerized environment

## Network Requirements

**Important**: This application requires access to Workstream's private network via OpenVPN:

- **Hydra Public URL**: Used for user authentication flows
- **Hydra Admin URL**: Used for managing global OAuth clients
- **UMS Base URL**: Used for managing user-specific OAuth clients and token exchange

Ensure you are connected to Workstream OpenVPN before running the application.

## Session Management

The application uses `iron-session` for session management. You **must** configure a `SESSION_SECRET` environment variable:

- **Minimum length**: 32 characters
- **Generate a secure secret**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Security**: Never commit the actual secret to version control
- **Fallback**: If not configured, the app uses a default secret (not recommended for production)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HYDRA_PUBLIC_URL` | Ory Hydra public endpoint | `https://hydra-public.priv.dev.workstream.is` |
| `HYDRA_ADMIN_URL` | Ory Hydra admin endpoint | `https://hydra-admin.priv.dev.workstream.is` |
| `UMS_BASE_URL` | UMS base URL (for identity-specific clients and client credentials flow) | (required for UMS features) |
| `CLIENT_ID` | OAuth client ID | (optional, can be set per request) |
| `CLIENT_SECRET` | OAuth client secret | (optional, can be set per request) |
| `SESSION_SECRET` | Session encryption secret (must be at least 32 characters) | (required, generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `PORT` | Server port | `3000` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application (used for callback URLs) | `http://localhost:3000` |
| `TEST_API_URL` | API endpoint for testing tokens | (default test endpoint) |
| `COMPANY_ID` | Company ID for API calls | `eef568a4-86e4-4b51-bfeb-dc4daa831f6e` |

## Usage

### Web UI

1. **Connect to Workstream OpenVPN** (required for accessing private network endpoints)
2. Start the server: `bun run dev` or `npm run start:node`
3. Visit `http://localhost:3000`
4. Available features:
   - **Login** - Simulate Workstream login to obtain identity ID
   - **My OAuth Clients** - Manage OAuth clients for your identity (default page)
   - **OAuth Apps Token Flow** - Exchange client ID/secret for access tokens
   - **Global Clients** - Manage all OAuth clients in Hydra (accessible via direct URL: `/clients`)

### Client Management

**Via Web UI:**
- Navigate to `/identity-clients` to manage your OAuth clients
- Navigate to `/clients` to manage global OAuth clients

**Via Scripts:**
```bash
# Create a global client
bun run scripts/create-client.ts

# Update a client
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

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test suite
bun test __tests__/api/auth
```

## Troubleshooting

### VPN Connection Required

If you see certificate/SSL errors, ensure you're connected to Workstream OpenVPN when accessing:
- Hydra public endpoints
- Hydra admin endpoints
- UMS API endpoints

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

## Deployment

### Vercel Deployment

This project can be deployed to Vercel using the Import Project feature, which automatically configures continuous deployment from your Git repository.

#### Option 1: Import Project (Recommended for Main App)

**For Main Application:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Project"** → **"Import Git Repository"**
4. Select your GitHub repository
5. Vercel will automatically detect Next.js and configure the project
6. Configure environment variables (see below)
7. Click **"Deploy"**

Vercel will automatically:
- Set up continuous deployment (deploys on every push to `main`)
- Configure build settings for Next.js
- Provide a production URL

**For Documentation Site:**

1. Create a second project in Vercel
2. Import the same repository
3. In **Project Settings** → **General** → **Root Directory**, set it to `docs`
4. Vercel will detect Next.js in the docs directory
5. Deploy

#### Why Import Project?

Using Vercel's Import Project is recommended because:
- **Automatic Configuration**: Vercel automatically detects Next.js and configures everything
- **Continuous Deployment**: Automatically deploys on every push to `main` branch
- **No Manual Setup**: No need to configure GitHub Actions or secrets
- **Preview Deployments**: Each PR automatically gets a preview URL

#### Environment Variables

Configure the following environment variables in your Vercel project settings:

**Main Application:**
- `HYDRA_PUBLIC_URL`
- `HYDRA_ADMIN_URL`
- `UMS_BASE_URL`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `SESSION_SECRET` (must be at least 32 characters)
- `NEXT_PUBLIC_BASE_URL` (set to your deployed Vercel URL, e.g., `https://your-app.vercel.app`)

**Documentation Site:**
- Usually no environment variables needed (static site)

#### Deployment Process

**Deployment Process:**
1. Push to `main` branch → Vercel automatically deploys both projects
2. View deployments in Vercel Dashboard
3. Each deployment gets a unique preview URL
4. Each PR automatically gets a preview deployment

#### Network Limitations

**Important**: The deployed application requires access to Workstream's private network via OpenVPN. When deployed to Vercel:

- The application may not be able to access private network endpoints (Hydra, UMS) without VPN
- This limitation will be resolved when public APIs are available
- Users without OpenVPN access will need to wait for public API availability

#### Documentation Site

The documentation site is built with Nextra and includes:

- Multi-language support (English and Simplified Chinese)
- Guides for creating OAuth clients
- Guides for obtaining access tokens
- Code examples in multiple languages (JavaScript, Python, cURL)

Access the documentation at the deployed Vercel URL for the docs project.

## References

- [Ory Hydra API Documentation](https://www.ory.com/docs/hydra/reference/api#tag/oAuth2/operation/createOAuth2Client)
- [OAuth 2.0 Authorization Code Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.1)
- [OAuth 2.0 Device Authorization Flow (RFC 8628)](https://tools.ietf.org/html/rfc8628)
- [OAuth 2.0 Client Credentials Flow (RFC 6749)](https://tools.ietf.org/html/rfc6749#section-4.4)
