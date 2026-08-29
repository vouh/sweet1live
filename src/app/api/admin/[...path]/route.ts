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
  "venue-hire",
  "enquiries",
  "guests",
  "finance",
  "settings",
  "notifications",
];

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: Context, method: string) {
  const { path } = await context.params;
  const segments = path ?? [];

  if (segments.length === 0 || !ALLOWED.includes(segments[0])) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  const staffKey = process.env.STAFF_API_KEY;
  if (!staffKey) {
    return NextResponse.json(
      { error: "STAFF_API_KEY is not set — add it to .env.local and restart the dev server." },
      { status: 503 }
    );
  }

  const search = new URL(request.url).search;
  const target = `${API_URL}/admin/${segments.join("/")}${search}`;

  const headers: HeadersInit = { "X-Staff-Key": staffKey };
  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = await request.text();
    headers["Content-Type"] = "application/json";
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
