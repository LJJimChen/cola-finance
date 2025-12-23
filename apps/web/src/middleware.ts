import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Locale = "en" | "zh";

const SUPPORTED_LOCALES: Locale[] = ["en", "zh"];
const DEFAULT_LOCALE: Locale = "en";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function base64UrlToUint8Array(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

type JwtPayload = {
  sub: string;
  kind?: string;
  exp?: number;
};

async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(JWT_SECRET);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);
  const signature = base64UrlToUint8Array(signatureB64);
  const ok = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!ok) {
    return null;
  }
  const normalizedPayloadB64 =
    payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((payloadB64.length + 3) % 4);
  const payloadJson = atob(normalizedPayloadB64);
  const parsed: unknown = JSON.parse(payloadJson);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const payload = parsed as JwtPayload;
  if (typeof payload.sub !== "string") {
    return null;
  }
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    return null;
  }
  return payload;
}

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("cola_token")?.value;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const token = bearerToken || cookieToken;
    if (!token) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const headers = new Headers(req.headers);
    headers.set("x-cola-user-id", payload.sub);
    return NextResponse.next({ request: { headers } });
  }

  // Skip internal asset paths
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return;
  }

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

  const protectedPaths = ["/dashboard", "/portfolio", "/analysis", "/family", "/notifications", "/settings"];
  const token = req.cookies.get("cola_token")?.value;
  if (protectedPaths.some((p) => rest.startsWith(p)) && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(loginUrl);
  }

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
  matcher: ["/api/:path*", "/((?!api|_next|.*\\..*).*)"],
};
