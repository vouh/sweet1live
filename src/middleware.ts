import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Per-instance in-memory limiter — enough for dev/single-node; use Redis at scale. */
const hits = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = hits.get(key) ?? [];
  const cutoff = now - windowMs;
  while (bucket.length && bucket[0] < cutoff) bucket.shift();
  if (bucket.length >= limit) {
    hits.set(key, bucket);
    return true;
  }
  bucket.push(now);
  hits.set(key, bucket);
  return false;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const ip = clientIp(request);
    const key = `${ip}:${request.method}:${pathname.split("/").slice(0, 4).join("/")}`;
    const limit = request.method === "GET" ? 120 : 60;
    if (isRateLimited(key, limit, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
