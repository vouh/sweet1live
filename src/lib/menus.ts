/**
 * Public menu catalogue + collection checkout.
 */

import type { CheckoutSession, Result } from "@/lib/ticketing";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type MenuItem = {
  id: string;
  course: string;
  name: string;
  description: string;
  tag: string;
  price_pence: number;
  sort_order: number;
  is_active: boolean;
  currency: string;
};

export type MenuCourse = {
  no: string;
  title: string;
  note: string;
  image: string;
  items: MenuItem[];
};

const COURSE_NOTES: Record<string, string> = {
  "Small Plates": "To open the evening — light, precise, and built for the table to share.",
  Mains: "The centre of the table — fire, patience, and provenance.",
  "The Cellar": "Poured by the glass, or chosen for the whole table.",
};

const COLLECTION_COURSES = new Set(["Small Plates", "Mains"]);

export function isCollectionEligible(item: MenuItem): boolean {
  return COLLECTION_COURSES.has(item.course) && item.price_pence > 0 && item.is_active;
}

function readDetail(body: unknown, fallback: string): string {
  if (typeof body !== "object" || body === null) return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Could not reach the server. Please try again in a moment." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { ok: false, message: readDetail(body, "Something went wrong. Please try again.") };
  }

  return { ok: true, data: (await response.json()) as T };
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const result = await request<MenuItem[]>("/menus");
  return result.ok ? result.data : [];
}

export function groupMenuByCourse(items: MenuItem[], courseImages: Record<string, string>): MenuCourse[] {
  const byCourse = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = byCourse.get(item.course) ?? [];
    list.push(item);
    byCourse.set(item.course, list);
  }

  const order = ["Small Plates", "Mains", "The Cellar"];
  return order
    .filter((title) => byCourse.has(title))
    .map((title, index) => ({
      no: String(index + 1).padStart(2, "0"),
      title,
      note: COURSE_NOTES[title] ?? "",
      image: courseImages[title] ?? courseImages["Small Plates"],
      items: (byCourse.get(title) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }));
}

export async function startCollectionCheckout(body: {
  customer_name: string;
  customer_email: string;
  pickup_time: string;
  lines: { menu_item_id: string; quantity: number }[];
}): Promise<Result<CheckoutSession>> {
  return request<CheckoutSession>("/checkout/collection", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function formatPrice(pence: number, currency = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export const COLLECTION_TIMES = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
