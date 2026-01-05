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
  params: Promise<{ lang: "en" | "zh-CN" }>;
}) {
  const { lang } = await params;
  console.log({ lang });

  return (
    <>
      <Head />
      <Layout
        navbar={navbar}
        footer={footer}
        pageMap={await getPageMap(`/${lang}`)}
        docsRepositoryBase="https://github.com/your-org/your-repo/tree/main/docs"
        search={<Search placeholder="Search documentation..." />}
        sidebar={{ defaultMenuCollapseLevel: 1 }}
        i18n={[
          { locale: "en", name: "English" },
          { locale: "zh-CN", name: "简体中文" },
        ]}
      >
        {children}
      </Layout>
    </>
  );
}