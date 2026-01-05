# OAuth Apps Monorepo

This is a monorepo containing two applications:

## Applications

### `apps/demo`
The main OAuth 2.0 verification server application for Authorization Code and Device Authorization flows.

See [apps/demo/README.md](./apps/demo/README.md) for detailed documentation.

### `apps/docs`
The documentation site built with Nextra, providing guides and API references for the OAuth application.

See [apps/docs/README.md](./apps/docs/README.md) for documentation site details.

## Project Structure

```
/
├── apps/
│   ├── demo/          # Main OAuth application
│   └── docs/          # Documentation site
└── README.md          # This file
```

## Development

This monorepo uses [Bun workspaces](https://bun.sh/docs/install/workspaces) to manage dependencies across both applications.

### Initial Setup

Install all dependencies from the root directory:

```bash
bun install
```

This will install dependencies for all workspaces (`apps/demo` and `apps/docs`).

### Running Applications

You can run applications from the root directory using the workspace scripts:

```bash
# Run the demo app (port 3000)
bun run dev:demo
# or simply
bun dev

# Run the docs site (port 3001)
bun run dev:docs

# Run both simultaneously (requires a process manager like concurrently)
```

Or navigate to each app directory and run commands directly:

```bash
# Work on the main demo app
cd apps/demo
bun dev

# Work on the docs site
cd apps/docs
bun dev
```

### Building

```bash
# Build demo app
bun run build:demo

# Build docs site
bun run build:docs

# Build both
bun run build
```

### Running Production Builds

After building, you can start the production server:

```bash
# Start the built demo app (port 3000)
bun run start:demo

# Start the built docs site (port 3001)
bun run start:docs
```

Or navigate to the app directory:

```bash
# Start demo app
cd apps/demo
bun start

# Start docs site
cd apps/docs
bun start
```

### Testing

```bash
# Run tests for demo app
bun run test:demo
```

### Workspace Benefits

- **Shared dependencies**: Common packages (like `react`, `next`, `typescript`) are hoisted to the root `node_modules`, saving disk space
- **Consistent versions**: Easier to keep dependency versions in sync
- **Root-level scripts**: Convenient commands from the root directory

## Deployment

Each application should be deployed separately on Vercel:

- **Demo App**: Set Root Directory to `apps/demo`
- **Docs Site**: Set Root Directory to `apps/docs`

See the individual README files for detailed deployment instructions.
