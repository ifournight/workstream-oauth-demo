import Link from 'next/link'
import { config } from '@/lib/config'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-4xl font-bold">OAuth 2.0 Verification Server</h1>
        <ThemeToggle />
      </div>
      <div className="prose mb-12">
        <p className="text-lg">
          This server helps verify OAuth 2.0 flows with Ory Hydra and UMS integration.
        </p>
      </div>
      
      {/* Client Management Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-3 border-b-2 border-blue-600 text-gray-900">
          Client Management
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="prose prose-sm">
                <h3 className="text-xl font-semibold mb-2">Global Clients Management (Hydra)</h3>
                <p className="mb-4">
                  Manage all OAuth clients directly in Hydra. No identity filtering - shows all clients.
                </p>
                <Link href="/clients">
                  <Button color="primary">Manage Global Clients</Button>
                </Link>
                <p className="text-sm italic mt-2 not-prose">
                  Uses Hydra Admin APIs directly
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="prose prose-sm">
                <h3 className="text-xl font-semibold mb-2">Identity-Specific Clients Management (UMS)</h3>
                <p className="mb-4">
                  Manage OAuth clients for a specific identity. Requires identity_id as input parameter.
                </p>
                <Link href="/identity-clients">
                  <Button color="primary">Manage Identity Clients</Button>
                </Link>
                <p className="text-sm italic mt-2 not-prose">
                  Uses UMS /oauth-apps/v1 endpoints with owner_identity_id parameter
                </p>
              </div>
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
              <div className="prose prose-sm">
                <h3 className="text-xl font-semibold mb-2">Authorization Code Flow</h3>
                <p className="mb-4">
                  Standard OAuth 2.0 authorization code flow with PKCE support.
                </p>
                <Link href="/auth">
                  <Button color="primary">Start Authorization Code Flow</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="prose prose-sm">
                <h3 className="text-xl font-semibold mb-2">Device Authorization Flow</h3>
                <p className="mb-4">
                  OAuth 2.0 device authorization flow for devices with limited input capabilities.
                </p>
                <Link href="/device-demo">
                  <Button color="primary">Start Device Flow</Button>
                </Link>
                <p className="text-sm italic mt-2 not-prose text-orange-600">
                  ⚠️ Note: Device flow may not be fully supported due to Ory configuration limitations.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="prose prose-sm">
                <h3 className="text-xl font-semibold mb-2">Client Credentials Flow</h3>
                <p className="mb-4">
                  Machine-to-machine flow (no user interaction). Uses UMS token endpoint.
                </p>
                <Link href="/client-credentials-demo">
                  <Button color="primary">Start Client Credentials Flow</Button>
                </Link>
                <p className="text-sm italic mt-2 not-prose">
                  Uses UMS /auth/v1/oauth-apps/token endpoint
                </p>
              </div>
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
            <div className="prose prose-sm">
              <p>
                <strong>Hydra Public URL:</strong>{' '}
                <code>{config.hydraPublicUrl}</code>
              </p>
              <p>
                <strong>Client ID:</strong>{' '}
                <code>
                  {config.clientId || 'Not set (use env var)'}
                </code>
              </p>
              <p>
                <strong>UMS Base URL:</strong>{' '}
                <code>
                  {config.umsBaseUrl || 'Not set (use UMS_BASE_URL env var)'}
                </code>
              </p>
              <p>
                <strong>Port:</strong>{' '}
                <code>{config.port}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

