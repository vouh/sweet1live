/**
 * Typed client for the staff dashboard.
 *
 * Every call goes through the same-origin `/api/admin/*` proxy, which attaches
 * the staff key server-side — the browser never sees it. Types mirror the
 * response models in `backend/app/routers/admin.py`.
 */

export type ActivityItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: string;
  href: string;
};

export type AdminOverview = {
  currency: string;
  reservations_today: number;
  covers_today: number;
  reservations_pending: number;
  upcoming_events: number;
  tickets_sold_upcoming: number;
  events_sold_out: number;
  open_enquiries: number;
  bookings_pending: number;
  bookings_confirmed: number;
  revenue_30d_pence: number;
  paid_orders_30d: number;
  guests_total: number;
  activity: ActivityItem[];
};

export type AdminReservation = {
  id: string;
  name: string;
  email: string;
  party_size: number;
  date: string;
  time: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export type AdminTicketType = {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  quantity_available: number;
  is_active: boolean;
};

export type AdminEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: string;
  room_name: string;
  room_slug: string;
  image_url: string;
  doors_at: string | null;
  starts_at: string;
  ends_at: string | null;
  currency: string;
  capacity: number;
  sold: number;
  reserved: number;
  available: number;
  gross_pence: number;
  checked_in: number;
  ticket_types: AdminTicketType[];
};

export type AdminMenuItem = {
  id: string;
  course: string;
  name: string;
  description: string;
  tag: string;
  price_pence: number;
  sort_order: number;
  is_active: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type AdminRoom = {
  id: string;
  slug: string;
  name: string;
  capacity_seated: number;
  capacity_standing: number;
  hire_fee_pence: number;
  deposit_pence: number;
  is_active: boolean;
  bookings_upcoming: number;
};

export type AdminBooking = {
  id: string;
  reference: string;
  room_id: string;
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

export type AdminVenueHire = {
  currency: string;
  pending: number;
  confirmed: number;
  deposits_held_pence: number;
  rooms: AdminRoom[];
  bookings: AdminBooking[];
};

export type AdminEnquiry = {
  id: string;
  kind: "contact" | "venue";
  name: string;
  email: string;
  subject: string;
  message: string;
  event_type: string | null;
  guests: number | null;
  date: string | null;
  created_at: string;
};

export type AdminGuest = {
  id: string;
  name: string;
  email: string;
  has_account: boolean;
  created_at: string | null;
  orders_count: number;
  tickets_count: number;
  reservations_count: number;
  bookings_count: number;
  spend_pence: number;
  currency: string;
  last_seen_at: string | null;
};

export type AdminOrderRow = {
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
  summary: string;
  stripe_payment_intent_id: string | null;
};

export type AdminFinance = {
  currency: string;
  stripe_enabled: boolean;
  window_days: number;
  gross_paid_pence: number;
  tickets_pence: number;
  deposits_pence: number;
  pending_pence: number;
  refunded_pence: number;
  paid_count: number;
  pending_count: number;
  refunded_count: number;
  average_order_pence: number;
  orders: AdminOrderRow[];
};

export type TableCount = { table: string; label: string; rows: number };

export type AdminSettings = {
  currency: string;
  public_site_url: string;
  cors_origins: string[];
  database_backend: string;
  checkout_hold_minutes: number;
  session_hours: number;
  stripe_enabled: boolean;
  stripe_webhook_configured: boolean;
  email_configured: boolean;
  supabase_configured: boolean;
  rooms_active: number;
  rooms_total: number;
  tables: TableCount[];
};

export type AdminNotification = {
  id: string;
  kind: string;
  severity: "action" | "warning" | "info" | "success";
  title: string;
  detail: string;
  at: string;
  href: string;
};

export class AdminApiError extends Error {}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return `/api/admin/${path}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api/admin/${path}${qs ? `?${qs}` : ""}`;
}

async function request<T>(path: string, init?: RequestInit & { query?: Query }): Promise<T> {
  const { query, ...rest } = init ?? {};
  let response: Response;
  try {
    response = await fetch(withQuery(path, query), {
      ...rest,
      headers: rest.body ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    });
  } catch {
    throw new AdminApiError("Could not reach the server. Check your connection and try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      (data as { error?: string; detail?: string | { msg?: string }[] } | null) ?? null;
    let message = `Request failed (${response.status}).`;
    if (detail?.error) {
      message = detail.error;
    } else if (typeof detail?.detail === "string") {
      message = detail.detail;
    } else if (Array.isArray(detail?.detail) && detail.detail[0]?.msg) {
      message = detail.detail[0].msg as string;
    }
    throw new AdminApiError(message);
  }

  return data as T;
}

export const adminApi = {
  overview: () => request<AdminOverview>("overview"),

  reservations: (query?: { status?: string; q?: string }) =>
    request<AdminReservation[]>("reservations", { query }),
  setReservationStatus: (id: string, status: string) =>
    request<AdminReservation>(`reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  events: (query?: { status?: string; q?: string; when?: string }) =>
    request<AdminEvent[]>("events", { query }),
  setEventStatus: (id: string, status: string) =>
    request<AdminEvent>(`events/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  menus: (query?: { course?: string; q?: string }) =>
    request<AdminMenuItem[]>("menus", { query }),
  createMenuItem: (body: Partial<AdminMenuItem>) =>
    request<AdminMenuItem>("menus", { method: "POST", body: JSON.stringify(body) }),
  updateMenuItem: (id: string, body: Partial<AdminMenuItem>) =>
    request<AdminMenuItem>(`menus/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMenuItem: (id: string) => request<void>(`menus/${id}`, { method: "DELETE" }),

  venueHire: (query?: { status?: string; q?: string }) =>
    request<AdminVenueHire>("venue-hire", { query }),
  setBookingStatus: (id: string, status: string) =>
    request<AdminBooking>(`venue-hire/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  enquiries: (query?: { kind?: string; q?: string }) =>
    request<AdminEnquiry[]>("enquiries", { query }),

  guests: (query?: { q?: string; accounts_only?: boolean }) =>
    request<AdminGuest[]>("guests", { query }),

  finance: (query?: { days?: number; status?: string; kind?: string; q?: string }) =>
    request<AdminFinance>("finance", { query }),

  settings: () => request<AdminSettings>("settings"),

  notifications: () => request<AdminNotification[]>("notifications"),
};

// ---------------------------------------------------------------------
// Formatting helpers — the admin shows money and dates the same way
// everywhere, so the rules live here rather than in each page.
// ---------------------------------------------------------------------

export function formatMoney(pence: number, currency = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const future = seconds < 0;
  const abs = Math.abs(seconds);
  // [upper bound in seconds, seconds per unit, label]
  const units: [number, number, string][] = [
    [60, 1, "second"],
    [3600, 60, "minute"],
    [86400, 3600, "hour"],
    [604800, 86400, "day"],
  ];
  for (const [limit, perUnit, unit] of units) {
    if (abs < limit) {
      const amount = Math.max(1, Math.round(abs / perUnit));
      const label = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
      return future ? `in ${label}` : `${label} ago`;
    }
  }
  return formatDate(value);
}
