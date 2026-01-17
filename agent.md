# Agent Guide

## Project Overview
This is a Bun workspaces monorepo with two applications:

- **apps/demo**: OAuth 2.0 verification server supporting Authorization Code and Device Authorization flows.
- **apps/docs**: Nextra-based documentation site with guides and API references for the OAuth app.

For details, see:
- Root `README.md`
- `apps/demo/README.md`
- `apps/docs/README.md`

## Directory Structure
```
/
├── apps/
│   ├── demo/          # OAuth app
│   └── docs/          # Documentation site
└── agent.md           # This guide
```

## Docs App Architecture (apps/docs)
- **Next.js App Router**: uses the `app/` directory with locale-aware routes under `app/[lang]/` and MDX pages at `app/[lang]/[[...mdxPath]]/page.tsx`.
- **Content**: MDX content lives in `content/` with `en/` and `zh-CN/` locales.
- **Theme & MDX wiring**: Nextra config in `next.config.mjs` and component overrides in `mdx-components.tsx`.
- **Shared UI**: reusable UI pieces live in `components/`.
- **Locale proxy/middleware**: `proxy.ts` handles locale detection/redirects and sets the `docs_locale` cookie.

## Demo App Architecture (apps/demo)
- **Next.js App Router**: routes and pages are defined under `app/`, with API route handlers in `app/api/`.
- **Auth + i18n proxy**: `proxy.ts` combines authentication checks with `next-intl` locale handling, relying on `i18n.ts` for locale detection and messages in `messages/`.
- **API clients & schemas**: OpenAPI specs live in `openapi-specs/` and are turned into clients in `generated/` via `orval.config.ts`, with custom mutators in `lib/api/`.
- **UI layers**: shared UI in `components/`, route-specific UI in `app/components/`, and theme/layout providers in `providers/`.
- **Utilities**: common hooks in `hooks/`, helpers in `utils/`, and shared types in `types/`.
- **Testing**: unit tests in `__tests__/` (Vitest) and end-to-end tests in `cypress/`.

## Development & Running (Bun)
Run from the repository root:

```bash
# Install dependencies
bun install

# Start the demo app (default 3000)
bun run dev:demo
# or
bun dev

# Start the docs site (default 3001)
bun run dev:docs
```

## Build & Production
```bash
# Build demo
bun run build:demo

# Build docs
bun run build:docs

# Start production builds
bun run start:demo
bun run start:docs
```

## Testing
```bash
# Demo app tests only
bun run test:demo
```

## Deployment Notes
Each app should be deployed separately (e.g. Vercel):
- Demo app root directory: `apps/demo`
- Docs site root directory: `apps/docs`
