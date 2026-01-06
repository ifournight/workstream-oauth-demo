import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { RouteProvider } from '@/providers/router-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { BreadcrumbProvider } from '@/lib/breadcrumbs';
import { ConditionalLayout } from '@/app/components/conditional-layout';
import { navigationItems } from '@/lib/navigation';
import { Toaster } from '@/components/application/notifications/toaster';
import "@/styles/globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Workstream OAuth apps',
  description: 'OAuth 2.0 verification server for Client Credentials flows',
}

export const viewport: Viewport = {
  colorScheme: 'light',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get locale from headers (set by middleware)
  const locale = await getLocale()
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <RouteProvider>
            <ThemeProvider>
              <QueryProvider>
                <AuthProvider>
                  <BreadcrumbProvider>
                    <ConditionalLayout navigationItems={navigationItems}>
                      {children}
                    </ConditionalLayout>
                    <Toaster />
                  </BreadcrumbProvider>
                </AuthProvider>
              </QueryProvider>
            </ThemeProvider>
          </RouteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
