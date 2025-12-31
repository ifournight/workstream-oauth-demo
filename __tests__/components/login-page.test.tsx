import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === 'error') return null
      if (key === 'error_description') return null
      if (key === 'return_url') return null
      return null
    }),
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    delete (window as any).location
    window.location = { href: '' } as any
  })

  it('should render login page', () => {
    render(<LoginPage />)
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('should render password login button', () => {
    render(<LoginPage />)
    const loginButton = screen.getByTestId('login-button')
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).toHaveTextContent('Sign in with Password')
  })

  it('should render passkey login button', () => {
    render(<LoginPage />)
    const passkeyButton = screen.getByTestId('passkey-login-button')
    expect(passkeyButton).toBeInTheDocument()
    expect(passkeyButton).toHaveTextContent('Sign in with Passkey')
  })

  it('should redirect to login API when password login button is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(window.location.href).toContain('/api/auth/login')
    })
  })

  it('should redirect to login API when passkey login button is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const passkeyButton = screen.getByTestId('passkey-login-button')
    await user.click(passkeyButton)
    
    await waitFor(() => {
      expect(window.location.href).toContain('/api/auth/login')
    })
  })
})
