# API Generation Instructions

## Prerequisites

Before generating the API code, you need to:

1. Install dependencies:
   ```bash
   bun install
   ```

2. Ensure the OpenAPI specification files are accessible:
   - `../workstream-go-mono/user-management/cmd/kodata/ory-specs/ory-hydra.openapi.json`
   - `../workstream-go-mono/user-management/user-management-api.openapi.json`

## Generate API Code

Run the following command to generate TypeScript API functions from the OpenAPI specifications:

```bash
bun run generate:api
```

This will:
- Generate Hydra Admin API functions in `generated/hydra-api/`
- Generate UMS API functions in `generated/ums-api/`
- Create TypeScript types for all API models

## Generated Files

After running the generation command, you should see:

```
generated/
├── hydra-api/
│   ├── index.ts          # Hydra API functions
│   └── models/           # TypeScript type definitions
└── ums-api/
    ├── index.ts          # UMS API functions
    └── models/           # TypeScript type definitions
```

## Next Steps

After generation:
1. The API routes in `app/api/` will automatically use the generated functions
2. Server components can use these functions for SSR data fetching
3. Client components continue to call `/api/*` routes (which use the generated functions internally)

## Troubleshooting

If you encounter errors:
- Check that the OpenAPI files exist at the specified paths
- Verify that `orval` and `axios` are installed
- Check the `orval.config.ts` file for correct configuration

