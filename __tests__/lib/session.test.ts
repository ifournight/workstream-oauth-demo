import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSession, createSession, clearSession, isSessionValid, getIdentityIdFromSession } from '@/lib/session'
import * as jwt from '@/lib/jwt'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock iron-session
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(),
}))

// Mock jwt module
vi.mock('@/lib/jwt', () => ({
  getIdentityIdFromToken: vi.fn(),
}))

describe('Session Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSession', () => {
    it('should get session from cookies', async () => {
      const mockSession = {
        accessToken: 'test-token',
        identityId: 'test-id',
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      const session = await getSession()
      expect(session).toEqual(mockSession)
    })
  })

  describe('createSession', () => {
    it('should create session with access token', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      }
      
      const mockSession = {
        accessToken: '',
        save: vi.fn(),
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      vi.mocked(jwt.getIdentityIdFromToken).mockReturnValue('test-identity-id')
      
      await createSession(mockCookieStore as any, 'test-token', 'refresh-token', 3600)
      
      expect(mockSession.accessToken).toBe('test-token')
      expect(mockSession.save).toHaveBeenCalled()
    })
  })

  describe('clearSession', () => {
    it('should clear session', async () => {
      const mockSession = {
        destroy: vi.fn(),
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      await clearSession()
      expect(mockSession.destroy).toHaveBeenCalled()
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', async () => {
      const mockSession = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false)
      
      const isValid = await isSessionValid()
      expect(isValid).toBe(true)
    })

    it('should return false for expired session', async () => {
      const mockSession = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000, // 1 second ago
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      const isValid = await isSessionValid()
      expect(isValid).toBe(false)
    })

    it('should return false for session without token', async () => {
      const mockSession = {
        accessToken: undefined,
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      const isValid = await isSessionValid()
      expect(isValid).toBe(false)
    })
  })

  describe('getIdentityIdFromSession', () => {
    it('should return identity ID from session', async () => {
      const mockSession = {
        identityId: 'test-identity-id',
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      const identityId = await getIdentityIdFromSession()
      expect(identityId).toBe('test-identity-id')
    })

    it('should return null if no identity ID in session', async () => {
      const mockSession = {
        identityId: undefined,
      }
      
      const { getIronSession } = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue(mockSession as any)
      
      const identityId = await getIdentityIdFromSession()
      expect(identityId).toBeNull()
    })
  })
})
