'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// Using a simple check icon or emoji
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { Alert } from '@/app/components/ui/alert'

export default function CreateIdentityClientSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setBreadcrumbs } = useBreadcrumbs()
  const [responseData, setResponseData] = useState<any>(null)
  const [rawResponse, setRawResponse] = useState<string>('')

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Clients', href: '/clients' },
      { label: 'Identity-Specific Clients', href: '/identity-clients' },
      { label: 'Success' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs])

  useEffect(() => {
    const responseParam = searchParams.get('response')
    const rawResponseParam = searchParams.get('rawResponse')
    
    if (responseParam) {
      try {
        const parsed = JSON.parse(responseParam)
        setResponseData(parsed)
      } catch (e) {
        console.error('Failed to parse response:', e)
      }
    }
    
    if (rawResponseParam) {
      setRawResponse(rawResponseParam)
    }
  }, [searchParams])

  function handleCopyJson() {
    if (rawResponse) {
      navigator.clipboard.writeText(rawResponse)
      alert('JSON copied to clipboard!')
    }
  }

  function handleCopyClientId() {
    if (responseData?.client_id) {
      navigator.clipboard.writeText(responseData.client_id)
      alert('Client ID copied to clipboard!')
    }
  }

  function handleCopyClientSecret() {
    if (responseData?.client_secret) {
      navigator.clipboard.writeText(responseData.client_secret)
      alert('Client Secret copied to clipboard!')
    }
  }

  if (!responseData) {
    return (
      <div className="max-w-7xl">
        <PageHeader
          title="Create Identity Client"
        />
        <Card>
          <CardContent>
            <div className="py-12">
              <p className="text-center text-tertiary">No response data found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formattedJson = rawResponse || JSON.stringify(responseData, null, 2)

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Client Created Successfully"
        description="Your OAuth client has been created. Please save the credentials below."
      />

      <Alert className="mb-6">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Important: Save Your Credentials</h3>
            <p className="text-sm text-tertiary">
              The <strong>client_secret</strong> is only shown once. Make sure to copy and save it securely. 
              You will not be able to retrieve it later.
            </p>
          </div>
        </div>
      </Alert>

      <div className="space-y-6">
        {/* Key Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tertiary mb-1">Client ID</p>
                  <code className="text-sm font-mono bg-secondary px-2 py-1 rounded break-all">
                    {responseData.client_id || responseData.id || 'N/A'}
                  </code>
                </div>
                {responseData.client_id && (
                  <Button 
                    color="secondary" 
                    size="sm" 
                    onClick={handleCopyClientId}
                    className="ml-2"
                  >
                    Copy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tertiary mb-1">Client Secret</p>
                  <code className="text-sm font-mono bg-secondary px-2 py-1 rounded break-all">
                    {responseData.client_secret || 'N/A'}
                  </code>
                </div>
                {responseData.client_secret && (
                  <Button 
                    color="secondary" 
                    size="sm" 
                    onClick={handleCopyClientSecret}
                    className="ml-2"
                  >
                    Copy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Response JSON */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Full Response JSON</h3>
              <Button 
                color="secondary" 
                size="sm" 
                onClick={handleCopyJson}
              >
                Copy JSON
              </Button>
            </div>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{formattedJson}</code>
            </pre>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button 
            color="secondary" 
            onClick={() => router.push('/identity-clients')}
          >
            View All Clients
          </Button>
          <Button 
            color="primary" 
            onClick={() => router.push('/identity-clients')}
          >
            Back to Identity Clients
          </Button>
        </div>
      </div>
    </div>
  )
}

