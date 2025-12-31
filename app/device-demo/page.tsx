'use client'

import { useState } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { toast } from 'sonner'

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
      toast.success('Device Code Generated', {
        description: 'Device and user codes have been generated. Please visit the verification URI and enter the user code.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Failed to Generate Device Code', {
        description: errorMessage,
      })
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
          toast.success('Authorization Successful', {
            description: 'Device authorization completed and access token received.',
          })
        } else if (data.error === 'authorization_pending') {
          // Continue polling
        } else {
          clearInterval(pollInterval)
          setPolling(false)
          const errorMsg = data.error_description || data.error || 'Token request failed'
          setError(errorMsg)
          toast.error('Token Request Failed', {
            description: errorMsg,
          })
        }
      } catch (err) {
        clearInterval(pollInterval)
        setPolling(false)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        toast.error('Polling Error', {
          description: errorMessage,
        })
      }
    }, 5000) // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setPolling(false)
      if (!tokenData) {
        const timeoutMsg = 'Polling timeout. Please try again.'
        setError(timeoutMsg)
        toast.error('Polling Timeout', {
          description: timeoutMsg,
        })
      }
    }, 5 * 60 * 1000)
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Device Authorization Flow"
        breadcrumbs={[
          { label: 'Flows', href: '/device-demo' },
          { label: 'Device Authorization' },
        ]}
        description="OAuth 2.0 device authorization flow for devices with limited input capabilities. Users authorize on a separate device using a user code."
      />

      <div className="mb-6 p-4 bg-brand-primary border border-brand rounded-lg">
        <p className="text-sm">
          This flow is for devices that cannot securely store client credentials or display a web browser. The user will authorize on a separate device.
        </p>
      </div>

      <div className="mb-6 p-4 bg-warning-primary border border-warning rounded-lg">
        <p className="text-sm font-semibold text-warning-primary">
          ⚠️ Configuration Limitation: Device Authorization Flow may not be fully supported due to lack of Ory configuration. Please ensure that your Ory Hydra instance has device flow properly configured before using this flow.
        </p>
      </div>

      <div className="border border-secondary rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Request Device & User Codes</h2>
        <p className="mb-4">Click the button below to request device and user codes:</p>
        <button
          onClick={requestDeviceCode}
          disabled={!!deviceCode}
          className="px-4 py-2 bg-brand-solid text-white rounded hover:bg-brand-solid_hover disabled:opacity-50"
        >
          Request Device & User Codes
        </button>
        {error && (
          <div className="mt-4 p-4 bg-error-secondary border border-error text-error-primary rounded">
            {error}
          </div>
        )}
      </div>

      {userCode && (
        <div className="border border-secondary rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: User Authorization</h2>
          <p className="mb-4">Please visit the verification URI on another device/browser and enter the user code:</p>
          <div className="text-center p-6 bg-secondary rounded-lg mb-4">
            <div className="text-3xl font-bold text-brand-primary">{userCode}</div>
          </div>
          <p className="mb-2"><strong>Verification URI:</strong></p>
          <p className="mb-4 break-all">
            <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
              {verificationUri}
            </a>
          </p>
          <button
            onClick={startPolling}
            disabled={polling}
            className="px-4 py-2 bg-success-solid text-white rounded hover:bg-success-solid_hover disabled:opacity-50"
          >
            {polling ? 'Polling for Token...' : 'Start Polling for Token'}
          </button>
        </div>
      )}

      {tokenData && (
        <div className="border border-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-success-primary">✓ Success!</h2>
          <pre className="bg-secondary p-4 rounded overflow-auto text-sm">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

