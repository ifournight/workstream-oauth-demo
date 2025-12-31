import { redirect } from 'next/navigation'
import { config } from '@/lib/config'
import { PageHeader } from '@/app/components/page-header'

interface SearchParams {
  error?: string
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  if (!config.clientId) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Configuration Error"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
          ]}
          description="Client ID is not configured. Please set it as an environment variable to use the Authorization Code flow."
        />
        <p>CLIENT_ID not configured. Please set it as an environment variable.</p>
      </div>
    )
  }

  // Redirect to route handler that will set cookies and redirect to OAuth provider
  redirect('/api/auth/init')
}

