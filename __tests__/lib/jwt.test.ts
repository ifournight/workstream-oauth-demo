import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { decodeAccessToken, getIdentityIdFromToken, isTokenExpired, getTokenExpiration } from '@/lib/jwt'

// Mock JWT tokens for testing
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"test-identity-id","exp":9999999999,"iat":1234567890}
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWlkZW50aXR5LWlkIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjEyMzQ1Njc4OTB9.test-signature'

// Expired token (exp: 1000000000 = year 2001)
const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWlkZW50aXR5LWlkIiwiZXhwIjoxMDAwMDAwMDAwLCJpYXQiOjEyMzQ1Njc4OTB9.test-signature'

// Token without sub
const tokenWithoutSub = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTksImlhdCI6MTIzNDU2Nzg5MH0.test-signature'

// Token without exp
const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWlkZW50aXR5LWlkIiwiaWF0IjoxMjM0NTY3ODkwfQ.test-signature'

describe('JWT Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('decodeAccessToken', () => {
    it('should decode a valid JWT token', () => {
      const decoded = decodeAccessToken(validToken)
      expect(decoded).toHaveProperty('sub')
      expect(decoded).toHaveProperty('exp')
      expect(decoded.sub).toBe('test-identity-id')
    })

    it('should throw error for invalid token', () => {
      expect(() => decodeAccessToken('invalid.token')).toThrow()
    })
  })

  describe('getIdentityIdFromToken', () => {
    it('should extract identity ID from valid token', () => {
      const identityId = getIdentityIdFromToken(validToken)
      expect(identityId).toBe('test-identity-id')
    })

    it('should return null for token without sub', () => {
      const identityId = getIdentityIdFromToken(tokenWithoutSub)
      expect(identityId).toBeNull()
    })

    it('should return null for invalid token', () => {
      const identityId = getIdentityIdFromToken('invalid.token')
      expect(identityId).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      // validToken has exp: 9999999999 (year 2286), so it should not be expired
      // Mock Date.now to return a time before expiration
      const mockNow = vi.spyOn(Date, 'now').mockReturnValue(1000000000000) // Year 2001
      
      const expired = isTokenExpired(validToken)
      expect(expired).toBe(false)
      
      mockNow.mockRestore()
    })

    it('should return true for expired token', () => {
      const expired = isTokenExpired(expiredToken)
      expect(expired).toBe(true)
    })

    it('should return false for token without exp', () => {
      const expired = isTokenExpired(tokenWithoutExp)
      expect(expired).toBe(false)
    })

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid.token')
      expect(expired).toBe(true)
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration time for valid token', () => {
      const expiration = getTokenExpiration(validToken)
      expect(expiration).toBe(9999999999000) // exp * 1000 (milliseconds)
    })

    it('should return null for token without exp', () => {
      const expiration = getTokenExpiration(tokenWithoutExp)
      expect(expiration).toBeNull()
    })

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid.token')
      expect(expiration).toBeNull()
    })
  })
})
