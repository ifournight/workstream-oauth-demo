import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

// Can be imported from a shared config
export const locales = ['en', 'zh-CN'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export default getRequestConfig(async ({ locale }) => {
  // When localePrefix: 'never', next-intl middleware may not set locale correctly
  // So we manually detect from cookie or Accept-Language header
  let detectedLocale = locale
  
  // Try to get locale from NEXT_LOCALE cookie (Next.js standard)
  const cookieStore = await cookies()
  const nextLocaleCookie = cookieStore.get('NEXT_LOCALE')
  
  if (nextLocaleCookie?.value && locales.includes(nextLocaleCookie.value as Locale)) {
    detectedLocale = nextLocaleCookie.value as Locale
  } else if (!locale || !locales.includes(locale as Locale)) {
    // Try Accept-Language header as fallback
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language')
    
    if (acceptLanguage?.includes('zh')) {
      detectedLocale = 'zh-CN'
    } else {
      detectedLocale = defaultLocale
    }
  }
  
  // Validate that the detected locale is valid
  const validLocale = locales.includes(detectedLocale as Locale) 
    ? (detectedLocale as Locale) 
    : defaultLocale

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  }
})

