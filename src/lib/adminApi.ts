/**
 * Typed client for the staff dashboard.
 *
 * Calls go through `/api/admin/*` with the staff JWT when signed in.
 * Types mirror `backend/app/routers/admin.py`.
 */

import { staffAuthHeaders } from "@/lib/staffAuth";

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
  collection_pending: number;
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
  description: string;
  status: string;
  is_top_event: boolean;
  room_name: string;
  room_slug: string;
  image_url: string;
  images: string[];
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
  images: string[];
  ingredients: string;
  nutrition: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type AdminMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  dish_count: number;
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
  mailing_list: boolean;
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
  charged_currency?: string | null;
  charged_amount_pence?: number | null;
  created_at: string;
  paid_at: string | null;
  summary: string;
  stripe_payment_intent_id: string | null;
};

export type AdminOrderDetail = AdminOrderRow & {
  items: { description: string; quantity: number; unit_price_pence: number }[];
  ticket_codes: string[];
};

export type BulkDeleteResult = { deleted: number };

export type EnquiryRef = { kind: "contact" | "venue"; id: string };

export type AdminFinance = {
  currency: string;
  stripe_enabled: boolean;
  window_days: number;
  gross_paid_pence: number;
  tickets_pence: number;
  deposits_pence: number;
  collection_pence: number;
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

export type AdminPermission = {
  id: string;
  category: string;
  label: string;
  sort_order: number;
};

export type AdminAuditLog = {
  id: string;
  actor_email: string;
  action: string;
  target: string;
  detail: string;
  ip_address: string;
  created_at: string;
};

export type AdminRole = {
  id: string;
  name: string;
  is_super_admin: boolean;
  permission_ids: string[];
  member_emails: string[];
  created_at: string;
};

export type AdminStaffMember = {
  id: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  job_title: string;
  notes: string;
  status: string;
  must_reset_password: boolean;
  is_super_admin: boolean;
  roles: string[];
  permissions: string[];
  created_at?: string | null;
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
      // FormData bodies (file uploads) need the browser to set its own
      // multipart boundary header — only stamp JSON for our string bodies.
      headers:
        typeof rest.body === "string"
          ? { "Content-Type": "application/json", ...staffAuthHeaders(), ...rest.headers }
          : { ...staffAuthHeaders(), ...rest.headers },
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
  deleteReservation: (id: string) =>
    request<void>(`reservations/${id}`, { method: "DELETE" }),
  bulkDeleteReservations: (ids: string[]) =>
    request<BulkDeleteResult>("reservations/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  events: (query?: { status?: string; q?: string; when?: string }) =>
    request<AdminEvent[]>("events", { query }),
  setEventStatus: (id: string, status: string) =>
    request<AdminEvent>(`events/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateEvent: (id: string, body: Partial<Pick<AdminEvent, "title" | "subtitle" | "description" | "images" | "status" | "is_top_event">>) =>
    request<AdminEvent>(`events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  menus: (query?: { course?: string; q?: string }) =>
    request<AdminMenuItem[]>("menus", { query }),
  createMenuItem: (body: Partial<AdminMenuItem>) =>
    request<AdminMenuItem>("menus", { method: "POST", body: JSON.stringify(body) }),
  updateMenuItem: (id: string, body: Partial<AdminMenuItem>) =>
    request<AdminMenuItem>(`menus/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMenuItem: (id: string) => request<void>(`menus/${id}`, { method: "DELETE" }),
  uploadMenuImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("menus/upload", { method: "POST", body: form });
  },

  menuCategories: () => request<AdminMenuCategory[]>("menu-categories"),
  createMenuCategory: (name: string) =>
    request<AdminMenuCategory>("menu-categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateMenuCategory: (id: string, body: Partial<Pick<AdminMenuCategory, "name" | "sort_order">>) =>
    request<AdminMenuCategory>(`menu-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMenuCategory: (id: string) =>
    request<void>(`menu-categories/${id}`, { method: "DELETE" }),

  venueHire: (query?: { status?: string; q?: string }) =>
    request<AdminVenueHire>("venue-hire", { query }),
  setBookingStatus: (id: string, status: string) =>
    request<AdminBooking>(`venue-hire/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteBooking: (id: string) => request<void>(`venue-hire/${id}`, { method: "DELETE" }),
  bulkDeleteBookings: (ids: string[]) =>
    request<BulkDeleteResult>("venue-hire/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  enquiries: (query?: { kind?: string; q?: string }) =>
    request<AdminEnquiry[]>("enquiries", { query }),
  deleteEnquiry: (kind: "contact" | "venue", id: string) =>
    request<void>(`enquiries/${kind}/${id}`, { method: "DELETE" }),
  bulkDeleteEnquiries: (items: EnquiryRef[]) =>
    request<BulkDeleteResult>("enquiries/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  guests: (query?: { q?: string; accounts_only?: boolean }) =>
    request<AdminGuest[]>("guests", { query }),

  finance: (query?: { days?: number; status?: string; kind?: string; q?: string }) =>
    request<AdminFinance>("finance", { query }),

  collectionOrders: (query?: { days?: number; status?: string; q?: string }) =>
    request<AdminFinance>("collection-orders", { query }),
  getCollectionOrder: (id: string) => request<AdminOrderDetail>(`collection-orders/${id}`),
  deleteCollectionOrder: (id: string) => request<void>(`collection-orders/${id}`, { method: "DELETE" }),
  bulkDeleteCollectionOrders: (ids: string[]) =>
    request<BulkDeleteResult>("collection-orders/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),

  getOrder: (id: string) => request<AdminOrderDetail>(`orders/${id}`),
  deleteOrder: (id: string) => request<void>(`orders/${id}`, { method: "DELETE" }),
  bulkDeleteOrders: (ids: string[]) =>
    request<BulkDeleteResult>("orders/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  settings: () => request<AdminSettings>("settings"),

  notifications: () => request<AdminNotification[]>("notifications"),

  rbacPermissions: () => request<AdminPermission[]>("rbac/permissions"),
  rbacAuditLogs: () => request<AdminAuditLog[]>("rbac/audit-logs"),
  rbacRoles: () => request<AdminRole[]>("rbac/roles"),
  createRole: (body: { name: string; permission_ids: string[] }) =>
    request<AdminRole>("rbac/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (
    id: string,
    body: Partial<{ name: string; permission_ids: string[]; member_emails: string[] }>
  ) => request<AdminRole>(`rbac/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRole: (id: string) => request<void>(`rbac/roles/${id}`, { method: "DELETE" }),

  rbacStaff: () => request<AdminStaffMember[]>("rbac/staff"),
  getStaff: (id: string) => request<AdminStaffMember>(`rbac/staff/${id}`),
  createStaff: (body: {
    name: string;
    email: string;
    temp_password: string;
    phone?: string;
    location?: string;
    job_title?: string;
    notes?: string;
    role_ids: string[];
    grant_super_admin?: boolean;
    send_invite?: boolean;
  }) => request<AdminStaffMember>("rbac/staff", { method: "POST", body: JSON.stringify(body) }),
  updateStaff: (
    id: string,
    body: Partial<{
      name: string;
      phone: string;
      location: string;
      job_title: string;
      notes: string;
      status: string;
      role_ids: string[];
      grant_super_admin: boolean;
    }>
  ) => request<AdminStaffMember>(`rbac/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  suspendStaff: (id: string) =>
    request<AdminStaffMember>(`rbac/staff/${id}/suspend`, { method: "POST" }),
  reactivateStaff: (id: string) =>
    request<AdminStaffMember>(`rbac/staff/${id}/reactivate`, { method: "POST" }),
  resendStaffInvite: (id: string) =>
    request<{ message: string }>(`rbac/staff/${id}/resend-invite`, { method: "POST" }),
  deleteStaff: (id: string) => request<void>(`rbac/staff/${id}`, { method: "DELETE" }),
  bulkDeleteStaff: (ids: string[]) =>
    request<BulkDeleteResult>("rbac/staff/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
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
