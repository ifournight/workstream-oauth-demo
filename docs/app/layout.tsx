// app/layout.tsx
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import React from "react";

const navbar = <Navbar logo={<b>OAuth Docs</b>} />;

const footer = <Footer>© {new Date().getFullYear()} OAuth Docs</Footer>;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/your-org/your-repo/tree/main/docs"
          search={<Search placeholder="Search documentation..." />}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          // ✅ i18n 切换入口：把以前 theme.config 的 i18n 概念挪到这里（字段名以 docs theme 为准）
          i18n={[
            { locale: "en", name: "English" },
            { locale: "zh-CN", name: "简体中文" },
          ]}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
