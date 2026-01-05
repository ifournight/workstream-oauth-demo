import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavAccountCard } from '@/components/application/app-navigation/base-components/nav-account-card'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/providers/auth-provider'

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

describe('NavAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when user is not authenticated', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    } as Response)

    const { container } = render(<NavAccountCard />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should render user information when authenticated', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { identityId: 'test-identity-id-12345' },
      }),
    } as Response)

    render(<NavAccountCard />, {
      wrapper: createWrapper(),
    })

    // Wait for the component to render with user data
    await waitFor(() => {
      // Component uses data-cy, not data-testid, so we check by text content instead
      expect(screen.getByText(/test-identity-id-12345/i)).toBeInTheDocument()
    })
    
    // Verify the account card container exists
    const accountCard = screen.getByText(/test-identity-id-12345/i).closest('div[class*="rounded-xl"]')
    expect(accountCard).toBeInTheDocument()
  })

  it('should display user identity ID', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { identityId: 'test-identity-id-12345' },
      }),
    } as Response)

    render(<NavAccountCard />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/test-identity-id-12345/i)).toBeInTheDocument()
    })
  })
})
