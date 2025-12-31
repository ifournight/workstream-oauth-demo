'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Key01, User01 } from '@untitledui/icons'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get error from URL params (from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorParam) {
      setError(errorDescription || errorParam)
      toast.error('Login Failed', {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to start login'
      setError(errorMessage)
      toast.error('Login Error', {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to start passkey login'
      setError(errorMessage)
      toast.error('Passkey Login Error', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use your password or passkey to continue
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
              Sign in with Password
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
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
              Sign in with Passkey
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
