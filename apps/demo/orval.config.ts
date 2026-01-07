import { defineConfig } from 'orval'

export default defineConfig({
  // Server-side Hydra API (for server components if needed)
  hydra: {
    input: {
      target: './openapi-specs/ory-hydra.openapi.json',
    },
    output: {
      target: './generated/hydra-api/index.ts',
      client: 'axios',
      schemas: './generated/hydra-api/models',
      override: {
        mutator: {
          path: './lib/api/hydra-client.ts',
          name: 'hydraMutator',
        },
      },
    },
  },
  // Browser-side Hydra API with React Query hooks
  hydraBrowser: {
    input: {
      target: './openapi-specs/ory-hydra.openapi.json',
    },
    output: {
      target: './generated/hydra-api-browser/index.ts',
      client: 'react-query',
      schemas: './generated/hydra-api-browser/models',
      override: {
        mutator: {
          path: './lib/api/hydra-client-browser.ts',
          name: 'hydraMutatorBrowser',
        },
        query: {
          useQuery: true,
          useInfinite: false,
          options: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      },
    },
  },
  ums: {
    input: {
      target: './openapi-specs/user-management-api.openapi.json',
    },
    output: {
      target: './generated/ums-api/index.ts',
      client: 'axios',
      schemas: './generated/ums-api/models',
      override: {
        mutator: {
          path: './lib/api/ums-client.ts',
          name: 'umsMutator',
        },
      },
    },
  },
})
