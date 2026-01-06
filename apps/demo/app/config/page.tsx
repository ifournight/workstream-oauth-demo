'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { config } from '@/lib/config'
import { Card, CardContent } from '@/app/components/ui/card'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'

export default function ConfigPage() {
  const { setBreadcrumbs } = useBreadcrumbs()
  const t = useTranslations()

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: t('config.title'), href: '/config' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs, t])

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('config.title')}
        description={t('config.description')}
      />
      <Card>
        <CardContent>
          <div className="prose prose-sm">
            <p>
              <strong>{t('config.hydraPublicUrl')}:</strong>{' '}
              <code>{config.hydraPublicUrl}</code>
            </p>
            <p>
              <strong>{t('config.clientId')}:</strong>{' '}
              <code>
                {config.clientId || t('config.notSetUseEnvVar')}
              </code>
            </p>
            <p>
              <strong>{t('config.umsBaseUrl')}:</strong>{' '}
              <code>
                {config.umsBaseUrl || t('config.notSetUseUmsBaseUrl')}
              </code>
            </p>
            <p>
              <strong>{t('config.port')}:</strong>{' '}
              <code>{config.port}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

