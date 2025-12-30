import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { RouteProvider } from '@/app/providers/router-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
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
            {children}
          </ThemeProvider>
        </RouteProvider>
      </body>
    </html>
  )
}

