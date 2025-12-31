import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/callback/route'
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

// Mock session utils
vi.mock('@/lib/session', () => ({
  createSession: vi.fn(),
}))

// Mock jwt utils
vi.mock('@/lib/jwt', () => ({
  getIdentityIdFromToken: vi.fn(),
}))

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    hydraPublicUrl: 'https://hydra.example.com',
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('Callback API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockCookieStore = {
      get: vi.fn((key: string) => {
        if (key === 'oauth_state') return { value: 'test-state' }
        if (key === 'code_verifier') return { value: 'test-code-verifier' }
        if (key === 'flow_client_id') return { value: 'test-client-id' }
        if (key === 'flow_redirect_uri') return { value: 'http://localhost:3000/api/auth/callback' }
        if (key === 'login_return_url') return { value: '/' }
        return { value: undefined }
      }),
      delete: vi.fn(),
    }
    mockCookies.mockResolvedValue(mockCookieStore)
  })

  it('should redirect to login on OAuth error', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/callback?error=access_denied')
    
    // redirect() throws in Next.js, so we need to catch it
    try {
      await GET(request)
    } catch (e) {
      // Expected - redirect throws
    }
    
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=access_denied')
    )
  })

  it('should redirect to login when code is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/callback')
    
    // redirect() throws in Next.js, so we need to catch it
    try {
      await GET(request)
    } catch (e) {
      // Expected - redirect throws
    }
    
    expect(mockRedirect).toHaveBeenCalledWith('/login?error=missing_code')
  })

  it('should exchange code for tokens and create session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      }),
    } as Response)

    const { getIdentityIdFromToken } = await import('@/lib/jwt')
    vi.mocked(getIdentityIdFromToken).mockReturnValue('test-identity-id')

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=test-code&state=test-state')
    
    await GET(request)
    
    expect(fetch).toHaveBeenCalledWith(
      'https://hydra.example.com/oauth2/token',
      expect.objectContaining({
        method: 'POST',
      })
    )
    
    const { createSession } = await import('@/lib/session')
    expect(createSession).toHaveBeenCalled()
    
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('should redirect to return_url after successful login', async () => {
    const mockCookieStore = {
      get: vi.fn((key: string) => {
        if (key === 'oauth_state') return { value: 'test-state' }
        if (key === 'code_verifier') return { value: 'test-code-verifier' }
        if (key === 'flow_client_id') return { value: 'test-client-id' }
        if (key === 'flow_redirect_uri') return { value: 'http://localhost:3000/api/auth/callback' }
        if (key === 'login_return_url') return { value: '/dashboard' }
        return { value: undefined }
      }),
      delete: vi.fn(),
    }
    mockCookies.mockResolvedValue(mockCookieStore)

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        expires_in: 3600,
      }),
    } as Response)

    const { getIdentityIdFromToken } = await import('@/lib/jwt')
    vi.mocked(getIdentityIdFromToken).mockReturnValue('test-identity-id')

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=test-code&state=test-state')
    
    // redirect() throws in Next.js, so we need to catch it
    try {
      await GET(request)
    } catch (e) {
      // Expected - redirect throws
    }
    
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to login on token exchange failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      }),
    } as Response)

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=invalid-code&state=test-state')
    
    // redirect() throws in Next.js, so we need to catch it
    try {
      await GET(request)
    } catch (e) {
      // Expected - redirect throws
    }
    
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=invalid_grant')
    )
  })
})
