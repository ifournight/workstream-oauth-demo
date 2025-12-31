import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from '@/app/api/auth/session/route'
import { NextRequest } from 'next/server'

// Mock next/headers
const mockCookies = vi.fn()
vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

// Mock session utils
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  createSession: vi.fn(),
  clearSession: vi.fn(),
}))

// Mock jwt utils
vi.mock('@/lib/jwt', () => ({
  getIdentityIdFromToken: vi.fn(),
  isTokenExpired: vi.fn(),
}))

describe('Session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return unauthenticated when no session', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        accessToken: undefined,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
    })

    it('should return authenticated user when session exists', async () => {
      const { getSession } = await import('@/lib/session')
      const { getIdentityIdFromToken } = await import('@/lib/jwt')
      
      vi.mocked(getSession).mockResolvedValue({
        accessToken: 'valid-token',
        identityId: 'test-id',
        expiresAt: Date.now() + 3600000,
      } as any)
      
      vi.mocked(getIdentityIdFromToken).mockReturnValue('test-id')
      vi.mocked((await import('@/lib/jwt')).isTokenExpired).mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(data.authenticated).toBe(true)
      expect(data.user.identityId).toBe('test-id')
    })

    it('should clear expired session', async () => {
      const { getSession } = await import('@/lib/session')
      const { clearSession } = await import('@/lib/session')
      const { isTokenExpired } = await import('@/lib/jwt')
      
      vi.mocked(getSession).mockResolvedValue({
        accessToken: 'expired-token',
      } as any)
      
      vi.mocked(isTokenExpired).mockReturnValue(true)

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(clearSession).toHaveBeenCalled()
      expect(data.authenticated).toBe(false)
    })
  })

  describe('POST /api/auth/session', () => {
    it('should create session with access token', async () => {
      const { createSession } = await import('@/lib/session')
      const { getIdentityIdFromToken } = await import('@/lib/jwt')
      
      vi.mocked(getIdentityIdFromToken).mockReturnValue('test-id')
      mockCookies.mockReturnValue({})

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: 'test-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(createSession).toHaveBeenCalled()
      expect(data.success).toBe(true)
      expect(data.user.identityId).toBe('test-id')
    })

    it('should return error when accessToken is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('accessToken is required')
    })
  })

  describe('DELETE /api/auth/session', () => {
    it('should clear session', async () => {
      const { clearSession } = await import('@/lib/session')
      mockCookies.mockReturnValue({})

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(clearSession).toHaveBeenCalled()
      expect(data.success).toBe(true)
    })
  })
})
