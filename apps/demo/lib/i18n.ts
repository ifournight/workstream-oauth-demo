import { useTranslations } from 'next-intl'

/**
 * Hook to get translations for a specific namespace
 * @param namespace - The namespace to get translations from (e.g., 'common', 'auth', 'clients')
 * @returns Translation function
 */
export function useI18n(namespace?: string) {
  const t = useTranslations(namespace)
  return t
}

/**
 * Get translation for a specific key
 * @param namespace - The namespace (e.g., 'common', 'auth')
 * @param key - The translation key
 * @param values - Optional values for interpolation
 * @returns Translated string
 */
export function getTranslation(
  namespace: string,
  key: string,
  values?: Record<string, any>
): string {
  // This is a helper function that can be used in server components
  // For client components, use useI18n hook instead
  return `${namespace}.${key}`
}

