'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DeviceDemoPage() {
  const [deviceCode, setDeviceCode] = useState('')
  const [userCode, setUserCode] = useState('')
  const [verificationUri, setVerificationUri] = useState('')
  const [polling, setPolling] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function requestDeviceCode() {
    try {
      setError(null)
      // Get config from API
      const configRes = await fetch('/api/config')
      const config = await configRes.json()
      
      const response = await fetch(`${config.hydraPublicUrl}/oauth2/device/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          scope: 'openid offline',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to request device code')
      }

      setDeviceCode(data.device_code)
      setUserCode(data.user_code)
      setVerificationUri(data.verification_uri)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function startPolling() {
    if (!deviceCode) return

    setPolling(true)
    setError(null)

    const pollInterval = setInterval(async () => {
      try {
        // Get config from API
        const configRes = await fetch('/api/config')
        const config = await configRes.json()
        
        const response = await fetch(`${config.hydraPublicUrl}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: config.clientId,
            client_secret: config.clientSecret,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          clearInterval(pollInterval)
          setPolling(false)
          setTokenData(data)
        } else if (data.error === 'authorization_pending') {
          // Continue polling
        } else {
          clearInterval(pollInterval)
          setPolling(false)
          setError(data.error_description || data.error || 'Token request failed')
        }
      } catch (err) {
        clearInterval(pollInterval)
        setPolling(false)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }, 5000) // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setPolling(false)
      if (!tokenData) {
        setError('Polling timeout. Please try again.')
      }
    }, 5 * 60 * 1000)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Device Authorization Flow Demo</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm">
          This flow is for devices that cannot securely store client credentials or display a web browser. The user will authorize on a separate device.
        </p>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm font-semibold text-yellow-800">
          ⚠️ Configuration Limitation: Device Authorization Flow may not be fully supported due to lack of Ory configuration. Please ensure that your Ory Hydra instance has device flow properly configured before using this flow.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Request Device & User Codes</h2>
        <p className="mb-4">Click the button below to request device and user codes:</p>
        <button
          onClick={requestDeviceCode}
          disabled={!!deviceCode}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Request Device & User Codes
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {userCode && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: User Authorization</h2>
          <p className="mb-4">Please visit the verification URI on another device/browser and enter the user code:</p>
          <div className="text-center p-6 bg-gray-100 rounded-lg mb-4">
            <div className="text-3xl font-bold text-blue-600">{userCode}</div>
          </div>
          <p className="mb-2"><strong>Verification URI:</strong></p>
          <p className="mb-4 break-all">
            <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {verificationUri}
            </a>
          </p>
          <button
            onClick={startPolling}
            disabled={polling}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {polling ? 'Polling for Token...' : 'Start Polling for Token'}
          </button>
        </div>
      )}

      {tokenData && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">✓ Success!</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

