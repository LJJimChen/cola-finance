import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Locale = "en" | "zh";

const SUPPORTED_LOCALES: Locale[] = ["en", "zh"];
const DEFAULT_LOCALE: Locale = "en";

function detectLocale(req: NextRequest): Locale {
  const cookieLocale = req.cookies.get("cola_locale")?.value;
  if (cookieLocale === "en" || cookieLocale === "zh") {
    return cookieLocale;
  }

  const acceptLanguage = req.headers.get("accept-language") ?? "";
  if (acceptLanguage.toLowerCase().includes("zh")) {
    return "zh";
  }
  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const firstSegment = pathname.split("/")[1] ?? "";
  const isLocalePath = SUPPORTED_LOCALES.includes(firstSegment as Locale);

  if (!isLocalePath) {
    const locale = detectLocale(req);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  const locale = firstSegment as Locale;
  const nextUrl = req.nextUrl.clone();
  const rest = pathname.replace(`/${locale}`, "") || "/";
  nextUrl.pathname = rest;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-cola-locale", locale);

  const res = NextResponse.rewrite(nextUrl, { request: { headers: requestHeaders } });
  res.cookies.set("cola_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

