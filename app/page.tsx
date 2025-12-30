import { config } from '@/lib/config'
import { Card, CardContent } from '@/app/components/ui/card'
import { PageHeader } from '@/app/components/page-header'

export default function HomePage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Configuration"
        breadcrumbs={[
          { label: 'Configuration' },
        ]}
        description="OAuth 2.0 verification server configuration and settings"
      />
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
    </div>
  )
}

