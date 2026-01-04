# Orval + TanStack Query SSR Implementation Summary

## ✅ Completed Tasks

### 1. Fixed OpenAPI Specifications
- ✅ Renamed `NullTime` → `NullableDateTime` in `ory-hydra.openapi.json`
- ✅ Renamed `NullTimeSql` → `NullableDateTimeSql` in `ory-hydra.openapi.json`
- ✅ Updated all `$ref` references to use the new names

### 2. Orval Configuration
- ✅ Added `orval` and `axios` to `package.json` devDependencies
- ✅ Created `orval.config.ts` with configurations for:
  - Hydra Admin API (`ory-hydra.openapi.json`)
  - UMS API (`user-management-api.openapi.json`)
- ✅ Added `generate:api` script to `package.json`

### 3. API Client Setup
- ✅ Created `lib/api/hydra-client.ts` with configured axios instance
- ✅ Created `lib/api/ums-client.ts` with configured axios instance
- ✅ Both clients use environment config for base URLs

### 4. Updated API Routes
All API routes now use Orval-generated functions instead of manual `fetch`:

- ✅ `app/api/clients/route.ts` - Uses `listOAuth2Clients`, `createOAuth2Client`
- ✅ `app/api/clients/[id]/route.ts` - Uses `getOAuth2Client`, `setOAuth2Client`, `deleteOAuth2Client`
- ✅ `app/api/identity-clients/route.ts` - Uses `listOauthApps`, `createOauthApp`
- ✅ `app/api/identity-clients/[id]/route.ts` - Uses `getOauthApp`, `updateOauthApp`, `deleteOauthApp`
- ✅ `app/api/client-credentials/token/route.ts` - Uses `oauthAppTokenExchange`

### 5. SSR Implementation
- ✅ Created `lib/query/get-query-client.ts` following Next.js App Router pattern
- ✅ Split `app/clients/page.tsx` into:
  - Server Component (`page.tsx`) - Prefetches data using generated API functions
  - Client Component (`clients-page-client.tsx`) - Uses `Hydrate` for SSR data
- ✅ Implemented proper memory management with `queryClient.clear()` after dehydration

### 6. Error Handling
- ✅ All API routes handle axios errors properly
- ✅ Network errors (CORS, connection issues) are handled gracefully
- ✅ Authentication errors for identity-clients are properly handled

## 📋 Next Steps (User Action Required)

### 1. Install Dependencies
```bash
cd "/Users/hui/Developer/Workstream/OAuth apps"
bun install
```

### 2. Generate API Code
```bash
bun run generate:api
```

This will create:
- `generated/hydra-api/index.ts` - Hydra Admin API functions
- `generated/hydra-api/models/` - TypeScript types
- `generated/ums-api/index.ts` - UMS API functions
- `generated/ums-api/models/` - TypeScript types

### 3. Apply Same Pattern to Other Pages

The SSR pattern has been implemented for `/clients` page. You should apply the same pattern to:

- `app/identity-clients/page.tsx` → Split into Server + Client components
- `app/oauth-apps-token/page.tsx` → Split into Server + Client components

**Example Pattern:**

**Server Component** (`page.tsx`):
```typescript
import { dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { YourPageClient } from './your-page-client'
import { generatedApiFunction } from '@/generated/ums-api' // or hydra-api

export default async function YourPage() {
  const queryClient = getQueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['your-query-key'],
    queryFn: async () => {
      const response = await generatedApiFunction(...)
      return response.data
    },
  })
  
  const dehydratedState = dehydrate(queryClient)
  queryClient.clear() // Important for memory management
  
  return <YourPageClient dehydratedState={dehydratedState} />
}
```

**Client Component** (`your-page-client.tsx`):
```typescript
'use client'
import { Hydrate, useQuery } from '@tanstack/react-query'
import type { DehydratedState } from '@tanstack/react-query'

export function YourPageClient({ dehydratedState }: { dehydratedState: DehydratedState }) {
  return (
    <Hydrate state={dehydratedState}>
      <YourContent />
    </Hydrate>
  )
}

function YourContent() {
  const { data } = useQuery({
    queryKey: ['your-query-key'],
    queryFn: async () => {
      const response = await fetch('/api/your-endpoint')
      return response.json()
    },
  })
  // ... rest of your component
}
```

## 🔍 Important Notes

### SSR Caveats (Handled)

1. **Only successful queries are dehydrated** - Failed queries are excluded automatically
2. **Memory management** - `queryClient.clear()` is called after dehydration
3. **Staleness** - `staleTime` is set to 60 seconds to avoid immediate refetching
4. **Error handling** - Errors in prefetch don't break the page, queries retry on client

### Query Keys

Make sure query keys match between:
- Server Component `prefetchQuery` → `queryKey: ['clients']`
- Client Component `useQuery` → `queryKey: ['clients']`

### Authentication

For UMS API routes that require authentication:
- `identity-clients` routes automatically get `identityId` from session
- The generated API functions accept query parameters for `owner_identity_id`

## 🧪 Testing Checklist

After generating the API code, verify:

- [ ] TypeScript compilation succeeds
- [ ] `/clients` page loads with SSR data
- [ ] `/identity-clients` page works (if you implement SSR for it)
- [ ] Client mutations (create, update, delete) work correctly
- [ ] Error handling works for network errors
- [ ] Authentication flow works for identity-clients

## 📚 References

- [Orval Documentation](https://orval.dev/)
- [TanStack Query SSR Guide](https://tanstack.com/query/v4/docs/framework/react/guides/ssr)
- [Next.js App Router](https://nextjs.org/docs/app)

