import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/providers/auth-provider'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    } as Response)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return authenticated user after successful check', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { identityId: 'test-identity-id' },
      }),
    } as Response)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.identityId).toBe('test-identity-id')
  })

  it('should return unauthenticated state when not logged in', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    } as Response)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should provide login function', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    } as Response)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.login).toBe('function')
  })

  it('should provide logout function', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    } as Response)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.logout).toBe('function')
  })
})
