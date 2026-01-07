'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { TextArea } from '@/components/base/textarea/textarea'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Key01, User01, ChevronDown } from '@untitledui/icons'
import { useAuth } from '@/hooks/use-auth'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const { refresh } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualToken, setShowManualToken] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [isTokenLoading, setIsTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  // Get error from URL params (from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorParam) {
      setError(errorDescription || errorParam)
      toast.error(t('auth.loginFailed'), {
        description: errorDescription || errorParam,
      })
    }
  }, [searchParams])

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Redirect to login API which will handle PKCE flow
      const returnUrl = searchParams.get('return_url') || '/'
      const loginUrl = `/api/auth/login?return_url=${encodeURIComponent(returnUrl)}`
      window.location.href = loginUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.failedToStartLogin')
      setError(errorMessage)
      toast.error(t('auth.loginError'), {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Passkey login also uses the same PKCE flow
      // Hydra will handle the WebAuthn/passkey authentication
      const returnUrl = searchParams.get('return_url') || '/'
      const loginUrl = `/api/auth/login?return_url=${encodeURIComponent(returnUrl)}`
      window.location.href = loginUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.failedToStartPasskeyLogin')
      setError(errorMessage)
      toast.error(t('auth.passkeyLoginError'), {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  // Basic JWT format validation (checks for three dot-separated parts)
  const isValidTokenFormat = (token: string): boolean => {
    const trimmed = token.trim()
    if (!trimmed) return false
    // JWT tokens have three parts separated by dots: header.payload.signature
    const parts = trimmed.split('.')
    return parts.length === 3 && parts.every(part => part.length > 0)
  }

  const handleManualTokenLogin = async () => {
    setIsTokenLoading(true)
    setTokenError(null)

    try {
      const trimmedToken = manualToken.trim()
      
      if (!trimmedToken) {
        setTokenError(t('auth.invalidToken'))
        toast.error(t('auth.tokenLoginFailed'), {
          description: t('auth.invalidToken'),
        })
        setIsTokenLoading(false)
        return
      }

      // Basic format validation
      if (!isValidTokenFormat(trimmedToken)) {
        setTokenError(t('auth.invalidToken'))
        toast.error(t('auth.tokenLoginFailed'), {
          description: t('auth.invalidToken'),
        })
        setIsTokenLoading(false)
        return
      }

      // Call session API to create session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: trimmedToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create session' }))
        const errorMessage = errorData.error || t('auth.tokenLoginFailed')
        setTokenError(errorMessage)
        toast.error(t('auth.tokenLoginFailed'), {
          description: errorMessage,
        })
        setIsTokenLoading(false)
        return
      }

      // Success - refresh auth state and redirect
      toast.success(t('auth.tokenLoginSuccess'))
      
      // Refresh authentication state
      await refresh()
      
      // Redirect to return URL or home
      const returnUrl = searchParams.get('return_url') || '/'
      router.push(returnUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.tokenLoginFailed')
      setTokenError(errorMessage)
      toast.error(t('auth.tokenLoginFailed'), {
        description: errorMessage,
      })
      setIsTokenLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('auth.signIn')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.signInDescription')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg space-y-6">
          {error && (
            <Alert variant="error" className="mb-4">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              color="primary"
              size="lg"
              onClick={handleLogin}
              isLoading={isLoading}
              isDisabled={isLoading}
              className="w-full"
              iconLeading={User01}
              data-cy="login-button"
            >
              {t('auth.signInWithPassword')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            <Button
              color="secondary"
              size="lg"
              onClick={handlePasskeyLogin}
              isLoading={isLoading}
              isDisabled={isLoading}
              className="w-full"
              iconLeading={Key01}
              data-cy="passkey-login-button"
            >
              {t('auth.signInWithPasskey')}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              {t('auth.termsAgreement')}
            </p>
          </div>

          {/* Manual Token Login Section - Subtle and Collapsible */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowManualToken(!showManualToken)}
              className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showManualToken ? 'rotate-180' : ''}`} />
              {showManualToken ? t('auth.hideManualToken') : t('auth.showManualToken')}
            </button>

            {showManualToken && (
              <div className="mt-4 space-y-3">
                <TextArea
                  value={manualToken}
                  onChange={(value) => {
                    setManualToken(value || '')
                    setTokenError(null)
                  }}
                  placeholder={t('auth.tokenPlaceholder')}
                  rows={3}
                  isInvalid={!!tokenError}
                />
                {tokenError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{tokenError}</p>
                )}
                <Button
                  color="secondary"
                  size="sm"
                  onClick={handleManualTokenLogin}
                  isLoading={isTokenLoading}
                  isDisabled={isTokenLoading || !manualToken.trim()}
                  className="w-full"
                >
                  {t('auth.useTokenLogin')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
