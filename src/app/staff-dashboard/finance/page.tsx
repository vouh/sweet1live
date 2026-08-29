"use client";

import { useCallback, useState } from "react";
import {
  AdminError,
  AdminFilter,
  AdminLoading,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  AdminTableEmpty,
  AdminToolbar,
  StatCard,
  StatGrid,
  StatusBadge,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import { adminApi, formatDateTime, formatMoney } from "@/lib/adminApi";

const WINDOWS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "12 months" },
];

const STATUSES = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

const COLUMNS = ["Reference", "Customer", "Items", "Type", "Amount", "Status", "Taken"];

export default function AdminFinancePage() {
  const [days, setDays] = useState("90");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);

  const load = useCallback(
    () => adminApi.finance({ days: Number(days), status, q: search }),
    [days, status, search]
  );
  const { data, error, initialising, reload } = useAdminResource(load, [days, status, search]);

  if (error) return <AdminError message={error} onRetry={reload} />;
  if (initialising || !data) return <AdminLoading label="Counting the takings…" />;

  return (
    <>
      <AdminPageHeader
        title="Finance"
        blurb={`Every order the venue has taken in the last ${data.window_days} days — ticket sales and hire deposits, settled through Stripe.`}
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      {!data.stripe_enabled && (
        <div className="admin-panel border-l-4 border-l-[var(--admin-gold)] px-5 py-4 mb-5">
          <p className="font-body-md text-sm">
            <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1.5 text-[var(--admin-gold)]">
              info
            </span>
            Stripe isn&apos;t configured on this environment, so no new payments can be taken.
            Figures below are whatever is already in the orders table.
          </p>
        </div>
      )}

      <StatGrid>
        <StatCard
          icon="payments"
          tone="terracotta"
          label="Taken"
          value={formatMoney(data.gross_paid_pence, data.currency)}
          meta={`${data.paid_count} paid order${data.paid_count === 1 ? "" : "s"}`}
        />
        <StatCard
          icon="confirmation_number"
          tone="gold"
          label="Ticket sales"
          value={formatMoney(data.tickets_pence, data.currency)}
        />
        <StatCard
          icon="savings"
          tone="chocolate"
          label="Hire deposits"
          value={formatMoney(data.deposits_pence, data.currency)}
        />
        <StatCard
          icon="receipt_long"
          tone="rose"
          label="Average order"
          value={formatMoney(data.average_order_pence, data.currency)}
        />
      </StatGrid>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="admin-panel px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              In checkout
            </p>
            <p className="font-body-md text-sm mt-1 text-[var(--admin-muted)]">
              {data.pending_count} unfinished order{data.pending_count === 1 ? "" : "s"} holding
              inventory
            </p>
          </div>
          <p className="font-display-lg text-[26px] leading-none">
            {formatMoney(data.pending_pence, data.currency)}
          </p>
        </div>
        <div className="admin-panel px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Refunded
            </p>
            <p className="font-body-md text-sm mt-1 text-[var(--admin-muted)]">
              {data.refunded_count} order{data.refunded_count === 1 ? "" : "s"} returned
            </p>
          </div>
          <p className="font-display-lg text-[26px] leading-none">
            {formatMoney(data.refunded_pence, data.currency)}
          </p>
        </div>
      </div>

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by reference, name, or email" />
        <AdminFilter options={STATUSES} value={status} onChange={setStatus} label="Order status" />
        <AdminFilter options={WINDOWS} value={days} onChange={setDays} label="Time window" />
      </AdminToolbar>

      <AdminTable columns={COLUMNS} minWidth={1020}>
        {data.orders.map((order) => (
          <tr key={order.id} className="admin-table-row">
            <td className="px-5 py-4 font-label-caps text-[11px] tracking-[0.12em] whitespace-nowrap">
              {order.reference}
            </td>
            <td className="px-5 py-4">
              <p className="font-headline-md text-[15px]">{order.customer_name}</p>
              <p className="text-sm text-[var(--admin-muted)] mt-0.5">{order.customer_email}</p>
            </td>
            <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] max-w-[280px]">
              <span className="line-clamp-2">{order.summary}</span>
            </td>
            <td className="px-5 py-4">
              <StatusBadge
                status={order.kind === "tickets" ? "tickets" : "deposit"}
                tone="neutral"
              />
            </td>
            <td className="px-5 py-4 font-headline-md text-[15px] whitespace-nowrap">
              {formatMoney(order.subtotal_pence, order.currency)}
            </td>
            <td className="px-5 py-4">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] whitespace-nowrap">
              {formatDateTime(order.paid_at ?? order.created_at)}
            </td>
          </tr>
        ))}
        {data.orders.length === 0 && (
          <AdminTableEmpty
            colSpan={COLUMNS.length}
            message={
              query || status
                ? "No orders match that filter."
                : "No orders in this window yet."
            }
          />
        )}
      </AdminTable>
    </>
  );
}
