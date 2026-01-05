import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "zh-CN"] as const;
const DEFAULT = "en";
const COOKIE = "docs_locale";

function hasLocale(path: string) {
  return LOCALES.some((l) => path === `/${l}` || path.startsWith(`/${l}/`));
}

function fromAcceptLanguage(req: NextRequest) {
  const al = req.headers.get("accept-language")?.toLowerCase() ?? "";
  return al.includes("zh") ? "zh-CN" : DEFAULT;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (hasLocale(pathname)) return NextResponse.next();

  const saved = req.cookies.get(COOKIE)?.value;
  const locale =
    saved === "en" || saved === "zh-CN" ? saved : fromAcceptLanguage(req);

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next|api/).*)"],
};
