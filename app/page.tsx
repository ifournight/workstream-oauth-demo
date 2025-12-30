import Link from 'next/link'
import { config } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-4xl font-bold">OAuth 2.0 Verification Server</h1>
      </div>
      <p className="text-lg text-gray-700 mb-12">
        This server helps verify OAuth 2.0 flows with Ory Hydra and UMS integration.
      </p>
      
      {/* Client Management Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-3 border-b-2 border-blue-600 text-gray-900">
          Client Management
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Global Clients Management (Hydra)</h3>
              <p className="text-gray-700 mb-4">
                Manage all OAuth clients directly in Hydra. No identity filtering - shows all clients.
              </p>
              <Link href="/clients">
                <Button variant="primary">Manage Global Clients</Button>
              </Link>
              <p className="text-sm text-gray-600 italic mt-2">
                Uses Hydra Admin APIs directly
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Identity-Specific Clients Management (UMS)</h3>
              <p className="text-gray-700 mb-4">
                Manage OAuth clients for a specific identity. Requires identity_id as input parameter.
              </p>
              <Link href="/identity-clients">
                <Button variant="primary">Manage Identity Clients</Button>
              </Link>
              <p className="text-sm text-gray-600 italic mt-2">
                Uses UMS /oauth-apps/v1 endpoints with owner_identity_id parameter
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* OAuth Flows Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-3 border-b-2 border-blue-600 text-gray-900">
          OAuth Flows
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Authorization Code Flow</h3>
              <p className="text-gray-700 mb-4">
                Standard OAuth 2.0 authorization code flow with PKCE support.
              </p>
              <Link href="/auth">
                <Button variant="primary">Start Authorization Code Flow</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Device Authorization Flow</h3>
              <p className="text-gray-700 mb-4">
                OAuth 2.0 device authorization flow for devices with limited input capabilities.
              </p>
              <Link href="/device-demo">
                <Button variant="primary">Start Device Flow</Button>
              </Link>
              <p className="text-sm text-orange-600 italic mt-2">
                ⚠️ Note: Device flow may not be fully supported due to Ory configuration limitations.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Client Credentials Flow</h3>
              <p className="text-gray-700 mb-4">
                Machine-to-machine flow (no user interaction). Uses UMS token endpoint.
              </p>
              <Link href="/client-credentials-demo">
                <Button variant="primary">Start Client Credentials Flow</Button>
              </Link>
              <p className="text-sm text-gray-600 italic mt-2">
                Uses UMS /auth/v1/oauth-apps/token endpoint
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Configuration Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 pb-3 border-b-2 border-blue-600 text-gray-900">
          Configuration
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-900">
                <strong>Hydra Public URL:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-900">{config.hydraPublicUrl}</code>
              </p>
              <p className="text-gray-900">
                <strong>Client ID:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-900">
                  {config.clientId || 'Not set (use env var)'}
                </code>
              </p>
              <p className="text-gray-900">
                <strong>UMS Base URL:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-900">
                  {config.umsBaseUrl || 'Not set (use UMS_BASE_URL env var)'}
                </code>
              </p>
              <p className="text-gray-900">
                <strong>Port:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-900">{config.port}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

