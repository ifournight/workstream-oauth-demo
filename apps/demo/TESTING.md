# Testing Guide

This document describes how to run and verify tests for the login functionality.

## Prerequisites

1. Install dependencies:
```bash
bun install
```

2. Ensure all required packages are installed:
- `jose` - JWT handling
- `iron-session` - Session management
- `vitest` - Unit testing framework
- `@testing-library/react` - React component testing
- `cypress` - E2E testing
- `msw` - API mocking

## Running Tests

### Quick Test Run

Use the test verification script:
```bash
bun run test:verify
```

Or use the shell script:
```bash
./scripts/run-tests.sh
```

### Individual Test Commands

**Unit Tests (Vitest):**
```bash
# Run all unit tests once
bun run test:run

# Run tests in watch mode
bun run test

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

**E2E Tests (Cypress):**
```bash
# Run E2E tests headless
bun run test:e2e

# Open Cypress UI
bun run test:e2e:open
```

## Test Structure

```
__tests__/
  lib/
    jwt.test.ts              # JWT utility tests
    session.test.ts          # Session utility tests
  hooks/
    use-auth.test.tsx        # Auth hook tests
  components/
    login-page.test.tsx      # Login page component tests
    nav-account-card.test.tsx # Navigation component tests
  api/
    auth/
      session.test.ts        # Session API tests
      login.test.ts          # Login API tests
      callback.test.ts       # Callback API tests

cypress/
  e2e/
    login.cy.ts             # Login flow E2E tests
    auth-flow.cy.ts          # Complete auth flow E2E tests
```

## Test Coverage

### Unit Tests
- ✅ JWT decoding and validation
- ✅ Session management
- ✅ Auth hooks and providers
- ✅ Component rendering and interactions

### Integration Tests
- ✅ API route handlers
- ✅ Session API endpoints
- ✅ Login flow APIs

### E2E Tests
- ✅ Complete login flow
- ✅ Route protection
- ✅ Logout functionality

## Troubleshooting

### Tests fail with "Cannot find module"

1. Ensure dependencies are installed:
```bash
bun install
```

2. Check that `node_modules` exists and contains required packages

### Tests fail with Next.js module errors

The test setup includes mocks for Next.js modules. If you see errors:
- Check `vitest-setup.ts` for proper mocks
- Ensure `vitest.config.ts` includes the setup file

### E2E tests require running server

E2E tests need the development server running:
```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Run E2E tests
bun run test:e2e
```

## Continuous Integration

For CI/CD pipelines, use:
```bash
bun install
bun run test:run
bun run test:e2e  # If server is available
```

## Writing New Tests

When adding new features:

1. **Unit tests first**: Test individual functions and utilities
2. **Component tests**: Test React components in isolation
3. **Integration tests**: Test API routes and data flow
4. **E2E tests**: Test critical user flows

Follow the existing test patterns and use:
- `vitest` for unit/component tests
- `@testing-library/react` for component testing
- `msw` for API mocking
- `cypress` for E2E tests
