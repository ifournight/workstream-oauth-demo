'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header'
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { CodeSnippet } from '@/app/components/ui/code-snippet'
import { Input } from '@/components/base/input/input'
import { Button } from '@/components/base/buttons/button'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { Copy, Check } from '@untitledui/icons'
import { useClipboard } from '@/hooks/use-clipboard'
import { toast } from 'sonner'

interface SessionInfo {
  authenticated: boolean
  user?: {
    identityId?: string
  }
  tokenPreview?: {
    prefix: string
    suffix: string
    length: number
  }
  tokenPayload?: Record<string, any>
  expiresAt?: number
  expiresIn?: number
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { copied: copiedIdentityId, copy: copyIdentityId } = useClipboard()
  const { copied: copiedTokenPreview, copy: copyTokenPreview } = useClipboard()

  // Show success toast on login
  useEffect(() => {
    const loginSuccess = searchParams.get('login')
    const identityId = searchParams.get('identity_id')
    
    if (loginSuccess === 'success') {
      toast.success('Login Successful', {
        description: identityId ? `Welcome! Identity ID: ${identityId.substring(0, 8)}...` : 'You have successfully logged in.',
      })
      
      // Clean up URL parameters
      router.replace('/profile', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    // Always try to fetch session info directly, regardless of useAuth() state
    // This serves as a fallback in case useAuth() hasn't loaded yet or has stale data
    if (!authLoading) {
      fetchSessionInfo()
    }
  }, [authLoading])

  async function fetchSessionInfo() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        throw new Error('Failed to fetch session info')
      }
      const data = await response.json()
      setSessionInfo(data)
      
      // If API returns authenticated but useAuth() says not authenticated, 
      // refresh the auth context
      if (data.authenticated && !isAuthenticated) {
        console.log('Session API indicates authenticated, refreshing auth context')
        // The AuthProvider will pick this up on next render
      }
    } catch (error) {
      console.error('Error fetching session info:', error)
      toast.error('Failed to load session information', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingIndicator />
      </div>
    )
  }

  // Check both useAuth() and direct session API response
  // If sessionInfo indicates authenticated, use that even if useAuth() says not authenticated
  const isActuallyAuthenticated = sessionInfo?.authenticated || (isAuthenticated && user)
  const actualIdentityId = sessionInfo?.user?.identityId || user?.identityId

  if (!isActuallyAuthenticated || !actualIdentityId) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Profile"
          description="View your authentication session information"
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-tertiary">
              Please log in to view your profile information.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prioritize sessionInfo from direct API call, fallback to useAuth()
  const identityId = sessionInfo?.user?.identityId || user?.identityId || 'N/A'
  const tokenPreview = sessionInfo?.tokenPreview
  const tokenPayload = sessionInfo?.tokenPayload
  const expiresAt = sessionInfo?.expiresAt
  const expiresIn = sessionInfo?.expiresIn

  const formatExpiration = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const formatExpiresIn = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Profile"
        description="View your authentication session information"
      />

      <div className="space-y-6">
        {/* Identity Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary">Identity Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-secondary">Identity ID</label>
                <Button
                  color="tertiary"
                  size="sm"
                  onClick={() => copyIdentityId(identityId)}
                  iconLeading={copiedIdentityId ? Check : Copy}
                >
                  {copiedIdentityId ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Input
                value={identityId}
                onChange={() => {}}
                isDisabled
                inputClassName="font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-tertiary">
                This is your unique identity identifier extracted from the access token.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary">Access Token Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {tokenPreview && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-secondary">Token Preview</label>
                  <Button
                    color="tertiary"
                    size="sm"
                    onClick={() => copyTokenPreview(`${tokenPreview.prefix}...${tokenPreview.suffix}`)}
                    iconLeading={copiedTokenPreview ? Check : Copy}
                  >
                    {copiedTokenPreview ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <Input
                  value={`${tokenPreview.prefix}...${tokenPreview.suffix}`}
                  onChange={() => {}}
                  isDisabled
                  inputClassName="font-mono text-sm"
                />
                <p className="mt-1.5 text-xs text-tertiary">
                  Token length: {tokenPreview.length} characters (full token is stored securely in session)
                </p>
              </div>
            )}

            {expiresAt && (
              <div>
                <label className="text-sm font-medium text-secondary mb-1.5 block">Expires At</label>
                <Input
                  value={formatExpiration(expiresAt)}
                  onChange={() => {}}
                  isDisabled
                />
              </div>
            )}

            {expiresIn !== undefined && (
              <div>
                <label className="text-sm font-medium text-secondary mb-1.5 block">Expires In</label>
                <Input
                  value={formatExpiresIn(expiresIn)}
                  onChange={() => {}}
                  isDisabled
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Payload */}
        {tokenPayload && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-secondary">Token Payload (Decoded)</h2>
            </CardHeader>
            <CardContent>
              <CodeSnippet
                code={JSON.stringify(tokenPayload, null, 2)}
                language="json"
                title="JWT Payload"
              />
              <p className="mt-2 text-xs text-tertiary">
                This is the decoded payload from your access token. It contains claims like sub (identity ID), exp (expiration), etc.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session Status */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary">Session Status</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success-solid" />
              <span className="text-sm text-secondary">Authenticated</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
