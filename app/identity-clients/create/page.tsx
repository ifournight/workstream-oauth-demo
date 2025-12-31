'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Building05 } from '@untitledui/icons'
import { Heading as AriaHeading } from 'react-aria-components'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { InputBase, TextField } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon'
import { PageHeader } from '@/app/components/page-header'
import { toast } from 'sonner'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'

export default function CreateIdentityClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const identityId = searchParams.get('identity_id') || ''
  const [formData, setFormData] = useState({
    client_name: '',
  })

  const createMutation = useMutation({
    mutationFn: async (clientData: {
      owner_identity_id: string
      client_name: string
    }) => {
      const response = await fetch('/api/identity-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      })

      let rawResponse = ''
      let data: any
      
      // Capture raw response
      const responseText = await response.text()
      rawResponse = responseText

      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { error: 'Failed to parse response', rawResponse: responseText }
      }

      // Check for errors even if status is 200
      if (!response.ok || data.error || data.message) {
        // Create error with full details including raw response
        const error = new Error(data.error || data.message || 'Failed to create client') as Error & {
          details?: any
          rawResponse?: string
          status?: number
          statusText?: string
        }
        error.details = data.details
        error.rawResponse = data.rawResponse || rawResponse
        error.status = data.status || response.status
        error.statusText = data.statusText || response.statusText
        throw error
      }

      // Check if required fields are missing (indicates error even with 200 status)
      if (!data.client_id && !data.id && !data.client_secret) {
        const error = new Error('Invalid response: missing client credentials') as Error & {
          details?: any
          rawResponse?: string
          status?: number
          statusText?: string
        }
        error.details = data
        error.rawResponse = rawResponse
        error.status = response.status
        error.statusText = response.statusText
        throw error
      }

      // Include raw response in success data
      return { ...data, rawResponse }
    },
    onSuccess: (data: any) => {
      // Navigate to success page with response data
      const params = new URLSearchParams({
        identity_id: identityId,
        response: JSON.stringify(data),
        rawResponse: data.rawResponse || JSON.stringify(data, null, 2),
      })
      router.push(`/identity-clients/create/success?${params.toString()}`)
    },
    onError: (err: Error & { details?: any; rawResponse?: string; status?: number; statusText?: string }) => {
      let description = err.message
      
      // Add raw response if available
      if (err.rawResponse) {
        description += `\n\nRaw Response:\n${err.rawResponse}`
      }
      
      // Add status if available
      if (err.status) {
        description += `\n\nStatus: ${err.status} ${err.statusText || ''}`
      }
      
      // Add details if available
      if (err.details) {
        const detailsStr = typeof err.details === 'string' ? err.details : JSON.stringify(err.details, null, 2)
        description += `\n\nDetails:\n${detailsStr}`
      }
      
      toast.error('Failed to Create Client', {
        description: description,
        duration: 15000,
      })
    },
  })

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!identityId.trim()) {
      toast.error('Identity ID Required', {
        description: 'Please provide an identity ID.',
      })
      return
    }

    if (!formData.client_name.trim()) {
      toast.error('Client Name Required', {
        description: 'Please enter a client name.',
      })
      return
    }

    const clientData = {
      owner_identity_id: identityId,
      client_name: formData.client_name,
    }

    createMutation.mutate(clientData)
  }

  if (!identityId) {
    return (
      <div className="max-w-7xl">
        <PageHeader
          title="Create Identity Client"
          breadcrumbs={[
            { label: 'Clients', href: '/clients' },
            { label: 'Identity-Specific Clients', href: '/identity-clients' },
            { label: 'Create Client' },
          ]}
        />
        <Card>
          <CardContent>
            <div className="py-12">
              <p className="text-center text-tertiary">Identity ID is required. Please go back and enter an identity ID.</p>
              <div className="mt-4 flex justify-center">
                <Button color="secondary" onClick={() => router.push('/identity-clients')}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Create Identity Client"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'Identity-Specific Clients', href: '/identity-clients' },
          { label: 'Create Client' },
        ]}
        description="Create a new OAuth client for this identity."
      />

      <Card>
        <CardContent>
          <div className="py-8">
            <div className="flex gap-4 mb-6">
              <FeaturedIcon color="gray" size="lg" theme="modern" icon={Building05} className="max-sm:hidden" />

              <div className="z-10 flex flex-col gap-0.5">
                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                  Add Identity Client
                </AriaHeading>
                <p className="text-sm text-tertiary">
                  Create a new OAuth client for this identity.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col justify-start gap-6">
              <section className="flex items-start gap-8">
                <Label className="w-40 max-sm:hidden">Owner Identity ID</Label>
                <TextField name="identityId" className="flex-1" isDisabled>
                  <Label className="sm:hidden">Owner Identity ID</Label>
                  <InputBase size="md" value={identityId} />
                </TextField>
              </section>
              <section className="flex items-start gap-8">
                <Label className="w-40 max-sm:hidden">Client Name</Label>
                <TextField 
                  name="client_name" 
                  className="flex-1" 
                  isRequired
                  value={formData.client_name}
                  onChange={(value) => setFormData({ ...formData, client_name: value || '' })}
                >
                  <Label className="sm:hidden">Client Name</Label>
                  <InputBase 
                    size="md" 
                    placeholder="e.g. My OAuth App"
                  />
                </TextField>
              </section>
              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <Button 
                  color="secondary" 
                  size="lg" 
                  onClick={() => router.back()} 
                  type="button"
                  isDisabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  size="lg" 
                  isDisabled={createMutation.isPending} 
                  type="submit"
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoadingIndicator size="sm" />
                      Creating...
                    </span>
                  ) : (
                    'Create Client'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

