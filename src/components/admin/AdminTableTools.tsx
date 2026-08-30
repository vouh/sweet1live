"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  type AdminBooking,
  type AdminEnquiry,
  type AdminOrderDetail,
  type AdminReservation,
  type AdminStaffMember,
} from "@/lib/adminApi";

export type DetailField = { label: string; value: ReactNode };

export function useBulkSelect(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected((current) => {
      const allowed = new Set(visibleIds);
      const next = new Set([...current].filter((id) => allowed.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visibleIds]);

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((current) => {
      if (visibleIds.length > 0 && visibleIds.every((id) => current.has(id))) {
        return new Set();
      }
      return new Set(visibleIds);
    });
  }, [visibleIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  return {
    selected,
    selectedIds: useMemo(() => [...selected], [selected]),
    toggle,
    toggleAll,
    clear,
    count: selected.size,
    allSelected,
    someSelected,
  };
}

export function AdminSelectHeader({
  checked,
  indeterminate,
  onChange,
  label = "Select all rows",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate && !checked);
      }}
      onChange={onChange}
      className="h-4 w-4 accent-[var(--admin-accent)]"
    />
  );
}

export function AdminRowCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 accent-[var(--admin-accent)]"
    />
  );
}

export function AdminRowActions({
  viewLabel,
  onView,
  onDelete,
  deleting = false,
}: {
  viewLabel: string;
  onView: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${viewLabel}`}
        title="View details"
        className="admin-icon-btn admin-icon-btn--view !w-9 !h-9"
      >
        <span className="material-symbols-outlined text-[18px]">visibility</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${viewLabel}`}
        title="Delete"
        className="admin-icon-btn !w-9 !h-9 text-rose-600 hover:border-rose-400 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">
          {deleting ? "hourglass_top" : "delete"}
        </span>
      </button>
    </div>
  );
}

export function AdminBulkBar({
  count,
  onDelete,
  onClear,
  busy = false,
  noun = "item",
}: {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  busy?: boolean;
  noun?: string;
}) {
  if (count === 0) return null;

  return (
    <div className="admin-panel px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-[var(--admin-accent)]">
      <p className="font-body-md text-sm">
        <span className="font-headline-md">{count}</span> {noun}
        {count === 1 ? "" : "s"} selected
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClear} className="admin-btn-ghost text-sm" disabled={busy}>
          Clear
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="admin-btn-primary !bg-rose-700 !border-rose-700 text-sm"
        >
          {busy ? "Deleting…" : "Delete selected"}
        </button>
      </div>
    </div>
  );
}

export function AdminDetailModal({
  open,
  title,
  fields,
  onClose,
}: {
  open: boolean;
  title: string;
  fields: DetailField[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admin-panel w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 md:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-detail-title"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <h3 id="admin-detail-title" className="font-headline-md text-[22px] leading-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="admin-icon-btn shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <dl className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.label} className="border-b border-[var(--admin-border)] pb-3 last:border-0">
              <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] mb-1">
                {field.label}
              </dt>
              <dd className="font-body-md text-sm text-[var(--admin-ink)] whitespace-pre-wrap break-words">
                {field.value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Delete confirmation — a custom modal instead of the browser's native
// window.confirm(), which can't be styled and reads jarringly against the
// rest of the admin UI.
// ---------------------------------------------------------------------

type ConfirmRequest = { message: string; resolve: (ok: boolean) => void };

// The host below registers itself here on mount, so confirmDelete() can be
// called from any page's delete handler without prop-drilling a dialog
// through every component that needs one.
let requestConfirm: ((message: string) => Promise<boolean>) | null = null;

/** Mount once, high in the tree (AdminShell) — every confirmDelete() call renders through it. */
export function AdminConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    requestConfirm = (message: string) =>
      new Promise<boolean>((resolve) => setRequest({ message, resolve }));
    return () => {
      requestConfirm = null;
    };
  }, []);

  function respond(ok: boolean) {
    request?.resolve(ok);
    setRequest(null);
  }

  useEffect(() => {
    if (!request) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") respond(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50"
      onClick={() => respond(false)}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="admin-panel w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[24px] text-rose-600 shrink-0">
            warning
          </span>
          <div>
            <h3 id="admin-confirm-title" className="font-headline-md text-[18px]">
              Delete this?
            </h3>
            <p className="font-body-md text-sm text-[var(--admin-muted)] mt-2">
              {request.message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={() => respond(false)} className="admin-btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => respond(true)}
            className="admin-btn-primary !bg-rose-700 !border-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export async function confirmDelete(label: string, count = 1): Promise<boolean> {
  const what = count === 1 ? label : `${count} ${label}s`;
  const message = `Are you sure you want to delete ${what}? This cannot be undone.`;
  // Falls back to the native dialog only if the host somehow isn't mounted.
  return requestConfirm ? requestConfirm(message) : window.confirm(message);
}

export function reservationDetailFields(row: AdminReservation): DetailField[] {
  return [
    { label: "Guest", value: row.name },
    { label: "Email", value: row.email },
    { label: "Party size", value: String(row.party_size) },
    { label: "Date", value: formatDate(row.date) },
    { label: "Time", value: row.time },
    { label: "Status", value: row.status },
    { label: "Notes", value: row.notes || "—" },
    { label: "Booked", value: formatDateTime(row.created_at) },
    { label: "ID", value: row.id },
  ];
}

export function bookingDetailFields(row: AdminBooking): DetailField[] {
  return [
    { label: "Reference", value: row.reference },
    { label: "Client", value: row.name },
    { label: "Email", value: row.email },
    { label: "Room", value: row.room_name },
    { label: "Date", value: formatDate(row.date) },
    { label: "Window", value: `${row.start_time}–${row.end_time}` },
    { label: "Party size", value: String(row.party_size) },
    { label: "Event type", value: row.event_type?.replace(/-/g, " ") ?? "—" },
    { label: "Status", value: row.status },
    {
      label: "Deposit",
      value:
        row.deposit_pence > 0 ? formatMoney(row.deposit_pence, row.currency) : "—",
    },
    { label: "Notes", value: row.notes || "—" },
    { label: "Booked", value: formatDateTime(row.created_at) },
    { label: "ID", value: row.id },
  ];
}

export function enquiryDetailFields(row: AdminEnquiry): DetailField[] {
  const fields: DetailField[] = [
    { label: "Type", value: row.kind === "venue" ? "Hire enquiry" : "Contact message" },
    { label: "From", value: row.name },
    { label: "Email", value: row.email },
    { label: "Subject", value: row.subject },
  ];
  if (row.kind === "venue") {
    fields.push(
      { label: "Event type", value: row.event_type?.replace(/-/g, " ") ?? "—" },
      { label: "Guests", value: row.guests ? String(row.guests) : "—" },
      { label: "Preferred date", value: formatDate(row.date) }
    );
  }
  fields.push(
    { label: "Message", value: row.message || "—" },
    { label: "Received", value: formatDateTime(row.created_at) },
    { label: "ID", value: row.id }
  );
  return fields;
}

export function staffMemberDetailFields(member: AdminStaffMember): DetailField[] {
  return [
    { label: "Full name", value: member.name },
    { label: "Email", value: member.email },
    { label: "Phone", value: member.phone || "—" },
    { label: "Location", value: member.location || "—" },
    { label: "Job title", value: member.job_title || "—" },
    { label: "Notes", value: member.notes || "—" },
    { label: "Status", value: member.status },
    { label: "Roles", value: member.roles.join(", ") || "—" },
    {
      label: "Access",
      value: member.is_super_admin ? "Super Admin (all permissions)" : member.permissions.join(", ") || "—",
    },
    { label: "ID", value: member.id },
  ];
}

export function orderDetailFields(order: AdminOrderDetail): DetailField[] {
  const lines =
    order.items.length > 0
      ? order.items
          .map(
            (item) =>
              `${item.quantity} × ${item.description} (${formatMoney(item.unit_price_pence * item.quantity, order.currency)})`
          )
          .join("\n")
      : order.summary;

  const fields: DetailField[] = [
    { label: "Reference", value: order.reference },
    { label: "Customer", value: order.customer_name },
    { label: "Email", value: order.customer_email },
    { label: "Type", value: order.kind.replace(/_/g, " ") },
    { label: "Amount", value: formatMoney(order.subtotal_pence, order.currency) },
    ...(order.charged_currency &&
    order.charged_amount_pence != null &&
    order.charged_currency.toLowerCase() !== order.currency.toLowerCase()
      ? [
          {
            label: "Stripe charge",
            value: `${formatMoney(order.charged_amount_pence, order.charged_currency)} → ${formatMoney(order.subtotal_pence, order.currency)}`,
          },
        ]
      : []),
    { label: "Status", value: order.status },
    { label: "Line items", value: lines },
    { label: "Taken", value: formatDateTime(order.paid_at ?? order.created_at) },
  ];

  if (order.paid_at) {
    fields.push({ label: "Paid", value: formatDateTime(order.paid_at) });
  }
  if (order.stripe_payment_intent_id) {
    fields.push({ label: "Stripe payment", value: order.stripe_payment_intent_id });
  }
  if (order.ticket_codes.length > 0) {
    fields.push({ label: "Ticket codes", value: order.ticket_codes.join("\n") });
  }
  fields.push({ label: "ID", value: order.id });
  return fields;
}
