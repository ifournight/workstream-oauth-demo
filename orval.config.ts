import { defineConfig } from 'orval'

export default defineConfig({
  hydra: {
    input: {
      target: '../workstream-go-mono/user-management/cmd/kodata/ory-specs/ory-hydra.openapi.json',
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
  ums: {
    input: {
      target: '../workstream-go-mono/user-management/user-management-api.openapi.json',
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
