'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/app/components/page-header'
import { toast } from 'sonner'

export default function ClientCredentialsDemoPage() {
  const [tokenData, setTokenData] = useState<any>(null)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestToken() {
    try {
      setLoading(true)
      setError(null)
      setTokenData(null)
      setApiResult(null)

      const response = await fetch('/api/client-credentials/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: 'openid offline',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to get token')
      }

      setTokenData(data)
      toast.success('Access Token Received', {
        description: 'Successfully obtained access token using client credentials.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Failed to Get Token', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  async function testAPI() {
    if (!tokenData?.access_token) {
      alert('Please get an access token first')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
        }),
      })

      const result = await response.json()

      setApiResult(result)
      if (result.success) {
        toast.success('API Test Successful', {
          description: `API call completed with status ${result.status}.`,
        })
      } else {
        toast.error('API Test Failed', {
          description: `API call failed with status ${result.status}.`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('API Test Error', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Client Credentials Flow"
        breadcrumbs={[
          { label: 'Flows', href: '/client-credentials-demo' },
          { label: 'Client Credentials' },
        ]}
        description="Machine-to-machine OAuth 2.0 flow with no user interaction required. Uses the UMS token endpoint for server-to-server authentication."
      />

      <div className="mb-6 p-4 bg-brand-primary border border-brand rounded-lg">
        <p className="text-sm">
          This flow is for machine-to-machine communication. No user interaction required!
        </p>
        <p className="text-sm mt-2">
          <strong>ℹ️ Endpoint:</strong> This flow uses the UMS endpoint (<code>/auth/v1/oauth-apps/token</code>) instead of Hydra. The token's <code>sub</code> claim will be set to the <code>owner_identity_id</code>.
        </p>
      </div>

      <div className="border border-secondary rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Request Access Token</h2>
        <p className="mb-4">Click the button below to get an access token using only client credentials:</p>
        <button
          onClick={requestToken}
          disabled={loading}
          className="px-4 py-2 bg-brand-solid text-white rounded hover:bg-brand-solid_hover disabled:opacity-50"
        >
          {loading ? 'Requesting...' : 'Get Access Token'}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-error-secondary border border-error text-error-primary rounded">
            {error}
          </div>
        )}
        {tokenData && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Token Response:</h3>
            <pre className="bg-secondary p-4 rounded overflow-auto text-sm">
              {JSON.stringify(tokenData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {tokenData && (
        <div className="border border-secondary rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Test API Call</h2>
          <p className="mb-4">Now let's test the API with the access token:</p>
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-success-solid text-white rounded hover:bg-success-solid_hover disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          {apiResult && (
            <div className={`mt-4 p-4 rounded ${apiResult.success ? 'bg-success-secondary border border-success' : 'bg-error-secondary border border-error'}`}>
              <h3 className={`font-semibold mb-2 ${apiResult.success ? 'text-success-primary' : 'text-error-primary'}`}>
                {apiResult.success ? '✓ API Test Successful' : '❌ API Test Failed'}
              </h3>
              <p className="mb-2"><strong>Status:</strong> {apiResult.status} {apiResult.statusText}</p>
              {apiResult.data && (
                <pre className="bg-primary p-2 rounded text-xs overflow-auto mt-2">
                  {JSON.stringify(apiResult.data, null, 2)}
                </pre>
              )}
              {apiResult.error && (
                <pre className="bg-primary p-2 rounded text-xs overflow-auto mt-2">
                  {apiResult.error}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

