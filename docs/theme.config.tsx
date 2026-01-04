import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>OAuth Demo Documentation</span>,
  project: {
    link: 'https://github.com/your-org/your-repo',
  },
  docsRepositoryBase: 'https://github.com/your-org/your-repo/tree/main/docs',
  footer: {
    text: 'OAuth Demo Documentation © 2024',
  },
  search: {
    placeholder: 'Search documentation...',
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  i18n: [
    { locale: 'en', text: 'English' },
    { locale: 'zh-CN', text: '简体中文' },
  ],
}

export default config
