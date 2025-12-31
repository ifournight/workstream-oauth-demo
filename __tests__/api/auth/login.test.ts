import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

// Mock next/headers
const mockCookies = vi.fn()
vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

// Mock oauth utils
vi.mock('@/lib/oauth', () => ({
  generateCodeVerifier: vi.fn(() => 'test-code-verifier'),
  generateCodeChallenge: vi.fn(() => 'test-code-challenge'),
  generateState: vi.fn(() => 'test-state'),
}))

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    clientId: 'test-client-id',
    hydraPublicUrl: 'https://hydra.example.com',
  },
}))

describe('Login API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockCookieStore = {
      set: vi.fn(),
      get: vi.fn(),
    }
    mockCookies.mockResolvedValue(mockCookieStore)
  })

  it('should redirect to Hydra with PKCE parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login')
    
    await GET(request)
    
    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0]
    expect(redirectUrl).toContain('https://hydra.example.com/oauth2/auth')
    expect(redirectUrl).toContain('client_id=test-client-id')
    expect(redirectUrl).toContain('code_challenge=test-code-challenge')
    expect(redirectUrl).toContain('code_challenge_method=S256')
    expect(redirectUrl).toContain('prompt=login')
  })

  it('should use custom client_id if provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login?client_id=custom-client-id')
    
    await GET(request)
    
    expect(mockRedirect).toHaveBeenCalled()
    const redirectUrl = mockRedirect.mock.calls[0][0]
    expect(redirectUrl).toContain('client_id=custom-client-id')
  })

  it('should store PKCE parameters in cookies', async () => {
    const mockCookieStore = {
      set: vi.fn(),
      get: vi.fn(),
    }
    mockCookies.mockResolvedValue(mockCookieStore)
    
    const request = new NextRequest('http://localhost:3000/api/auth/login')
    await GET(request)
    
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'oauth_state',
      'test-state',
      expect.any(Object)
    )
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'code_verifier',
      'test-code-verifier',
      expect.any(Object)
    )
  })

  it('should redirect to login page if client_id is missing', async () => {
    vi.mocked((await import('@/lib/config')).config).clientId = ''
    
    const request = new NextRequest('http://localhost:3000/api/auth/login')
    await GET(request)
    
    expect(mockRedirect).toHaveBeenCalledWith('/login?error=missing_client_id')
  })
})
