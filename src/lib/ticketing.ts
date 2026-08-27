/**
 * Client for the ticketing + room-booking API.
 *
 * Money crosses the wire as integer pence, exactly as Stripe wants it — format
 * only at the edge, with `formatPrice`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TicketType = {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  max_per_order: number;
  quantity_available: number;
  on_sale: boolean;
};

export type VenueEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  room_name: string;
  room_slug: string;
  doors_at: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  currency: string;
  from_price_pence: number | null;
  sold_out: boolean;
  ticket_types: TicketType[];
};

export type Room = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capacity_seated: number;
  capacity_standing: number;
  min_party: number;
  hire_fee_pence: number;
  deposit_pence: number;
  image_url: string;
  features: string[];
  sort_order: number;
};

export type RoomSlot = {
  start_time: string;
  end_time: string;
  label: string;
  available: boolean;
};

export type RoomAvailability = {
  room_id: string;
  room_slug: string;
  date: string;
  slots: RoomSlot[];
};

export type Ticket = {
  id: string;
  code: string;
  status: string;
  holder_name: string;
  ticket_type_name: string;
  event_title: string;
  event_slug: string;
  room_name: string;
  starts_at: string;
  doors_at: string | null;
};

export type Order = {
  id: string;
  reference: string;
  status: string;
  kind: string;
  customer_name: string;
  customer_email: string;
  subtotal_pence: number;
  currency: string;
  created_at: string;
  paid_at: string | null;
  items: { description: string; quantity: number; unit_price_pence: number }[];
  tickets: Ticket[];
};

export type RoomBooking = {
  id: string;
  reference: string;
  room_name: string;
  room_slug: string;
  name: string;
  email: string;
  party_size: number;
  date: string;
  start_time: string;
  end_time: string;
  event_type: string;
  status: string;
  deposit_pence: number;
  currency: string;
  notes: string | null;
  created_at: string;
};

export type CheckoutSession = {
  order_reference: string;
  checkout_url: string | null;
  settled_without_payment: boolean;
};

export type Result<T> = { ok: true; data: T } | { ok: false; message: string };

/** FastAPI returns `detail` as a string for HTTPException, or a list for 422. */
function readDetail(body: unknown, fallback: string): string {
  if (typeof body !== "object" || body === null) return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg) return first.msg;
  }
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

// ---------------------------------------------------------------------
// Catalogue (read from Server Components)
// ---------------------------------------------------------------------

export async function getEvents(roomSlug?: string): Promise<VenueEvent[]> {
  const query = roomSlug ? `?room=${encodeURIComponent(roomSlug)}` : "";
  const result = await request<VenueEvent[]>(`/events${query}`);
  return result.ok ? result.data : [];
}

export async function getEvent(slug: string): Promise<VenueEvent | null> {
  const result = await request<VenueEvent>(`/events/${encodeURIComponent(slug)}`);
  return result.ok ? result.data : null;
}

export async function getRooms(): Promise<Room[]> {
  const result = await request<Room[]>("/rooms");
  return result.ok ? result.data : [];
}

export async function getRoomAvailability(
  slug: string,
  date: string
): Promise<Result<RoomAvailability>> {
  return request<RoomAvailability>(
    `/rooms/${encodeURIComponent(slug)}/availability?date=${encodeURIComponent(date)}`
  );
}

// ---------------------------------------------------------------------
// Checkout (called from Client Components)
// ---------------------------------------------------------------------

/** Same key AuthProvider writes — a signed-in guest gets the order attached. */
const TOKEN_KEY = "sweet1ne-auth-token";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startTicketCheckout(body: {
  event_slug: string;
  customer_name: string;
  customer_email: string;
  lines: { ticket_type_id: string; quantity: number }[];
}): Promise<Result<CheckoutSession>> {
  return request<CheckoutSession>("/checkout/tickets", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export async function createRoomBooking(body: {
  room_slug: string;
  name: string;
  email: string;
  phone?: string;
  party_size: number;
  date: string;
  start_time: string;
  event_type?: string;
  notes?: string | null;
}): Promise<Result<CheckoutSession>> {
  return request<CheckoutSession>("/rooms/bookings", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * Either credential identifies the buyer: the email they gave at checkout, or
 * the Stripe session id from the success redirect.
 */
export type OrderCredential = { email?: string; sessionId?: string };

function credentialQuery({ email, sessionId }: OrderCredential): string {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  if (sessionId) params.set("session_id", sessionId);
  return params.toString();
}

/** Reconcile against Stripe on the success page, ahead of the webhook. */
export async function syncOrder(
  reference: string,
  credential: OrderCredential
): Promise<Result<Order>> {
  return request<Order>(
    `/orders/${encodeURIComponent(reference)}/sync?${credentialQuery(credential)}`,
    { method: "POST" }
  );
}

export async function getOrder(
  reference: string,
  credential: OrderCredential
): Promise<Result<Order>> {
  return request<Order>(
    `/orders/${encodeURIComponent(reference)}?${credentialQuery(credential)}`
  );
}

// ---------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------

export function formatPrice(pence: number, currency = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    // Whole pounds read better on a price list; keep pence when they exist.
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

/**
 * The API sends naive UTC timestamps (no offset). Append `Z` so the browser
 * does not read them as local time.
 */
export function parseApiDate(value: string): Date {
  return new Date(/[Z+]|-\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
}

export function formatEventDate(value: string): string {
  return parseApiDate(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatEventTime(value: string): string {
  return parseApiDate(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLongDate(value: string): string {
  return parseApiDate(value).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
