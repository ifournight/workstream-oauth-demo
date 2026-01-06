// mdx-components.tsx
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { EnvVar } from './components/env-var'

const themeComponents = getThemeComponents()

export function useMDXComponents(components: any = {}) {
  return {
    ...themeComponents,
    EnvVar,
    ...components,
  }
}