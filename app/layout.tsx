import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { RouteProvider } from '@/providers/router-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { SidebarLayout } from '@/app/components/sidebar-layout';
import { navigationItems } from '@/lib/navigation';
import "@/styles/globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OAuth 2.0 Verification Server',
  description: 'OAuth 2.0 verification server for Authorization Code, Device Authorization, and Client Credentials flows',
}

export const viewport: Viewport = {
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased">

        <RouteProvider>
          <ThemeProvider>
            <SidebarLayout navigationItems={navigationItems}>
              {children}
            </SidebarLayout>
          </ThemeProvider>
        </RouteProvider>
      </body>
    </html>
  )
}

