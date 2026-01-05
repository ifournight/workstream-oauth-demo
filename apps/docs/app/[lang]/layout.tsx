// app/[lang]/layout.tsx
import React from "react";
import { Layout, Navbar, Footer } from "nextra-theme-docs";
import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

const navbar = <Navbar logo={<b>OAuth Docs</b>} />;
const footer = <Footer>© {new Date().getFullYear()} OAuth Docs</Footer>;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // ✅ 运行时收敛成你支持的语言
  const locale = lang === "zh-CN" ? "zh-CN" : "en";

  return (
    <>
      <Head />
      <Layout
        navbar={navbar}
        footer={footer}
        pageMap={await getPageMap(`/${locale}`)}
        i18n={[
          { locale: "en", name: "English" },
          { locale: "zh-CN", name: "简体中文" },
        ]}
        search={<Search placeholder="Search documentation..." />}
        sidebar={{ defaultMenuCollapseLevel: 1 }}
      >
        {children}
      </Layout>
    </>
  );
}