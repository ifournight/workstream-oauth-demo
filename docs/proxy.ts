import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'zh-CN'] as const
const DEFAULT_LOCALE = 'en'

function hasLocalePrefix(pathname: string) {
  return LOCALES.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 跳过 Next 内部与静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (hasLocalePrefix(pathname)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api).*)']
}