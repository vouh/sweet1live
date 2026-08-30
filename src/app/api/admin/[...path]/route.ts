import { NextResponse } from "next/server";

/**
 * Server-side proxy for the FastAPI `/admin` API.
 *
 * The staff key is a shared secret — it must never reach the browser, so admin
 * pages call these same-origin routes and this handler attaches the key.
 *
 * Note: this proxy is only as strong as whatever gates the dashboard itself.
 * Staff sign-in is still the localStorage stub in `src/lib/staffAuth.ts`, so
 * treat these routes as unauthenticated until real staff sessions land.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Everything the dashboard is allowed to reach, so a bug in a page can never
// turn this into an open proxy for the rest of the API.
const ALLOWED = [
  "overview",
  "reservations",
  "events",
  "menus",
  "menu-categories",
  "venue-hire",
  "enquiries",
  "guests",
  "finance",
  "orders",
  "settings",
  "notifications",
  "rbac",
];

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: Context, method: string) {
  const { path } = await context.params;
  const segments = path ?? [];

  if (segments.length === 0 || !ALLOWED.includes(segments[0])) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  // The caller must present their own staff session — this proxy must never
  // fill in the server's own M2M key on a browser's behalf. Every legitimate
  // admin-dashboard request already carries a real bearer token via
  // staffAuthHeaders() (see src/lib/adminApi.ts), so an anonymous request
  // reaching here (no Authorization header) is never a case to "help out" —
  // it's an unauthenticated caller, and must be rejected, not upgraded to
  // full staff access.
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Staff authentication required." }, { status: 401 });
  }
  const headers: HeadersInit = { Authorization: authHeader };

  const search = new URL(request.url).search;
  const target = `${API_URL}/admin/${segments.join("/")}${search}`;

  // A file upload arrives as multipart/form-data — forward the raw bytes and
  // the original header (it carries the multipart boundary) instead of
  // reading it as text and stamping application/json over it.
  const incomingContentType = request.headers.get("content-type") ?? "";
  const isMultipart = incomingContentType.startsWith("multipart/form-data");

  let body: string | ArrayBuffer | undefined;
  if (method !== "GET" && method !== "DELETE") {
    if (isMultipart) {
      body = await request.arrayBuffer();
      headers["Content-Type"] = incomingContentType;
    } else {
      body = await request.text();
      headers["Content-Type"] = "application/json";
    }
  }

  let response: Response;
  try {
    response = await fetch(target, { method, headers, body, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the API. Is the backend running?" },
      { status: 502 }
    );
  }

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET(request: Request, context: Context) {
  return forward(request, context, "GET");
}

export async function POST(request: Request, context: Context) {
  return forward(request, context, "POST");
}

export async function PATCH(request: Request, context: Context) {
  return forward(request, context, "PATCH");
}

export async function DELETE(request: Request, context: Context) {
  return forward(request, context, "DELETE");
}
