"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminBulkBar,
  AdminDetailModal,
  AdminRowActions,
  AdminRowCheckbox,
  confirmDelete,
  orderDetailFields,
  useBulkSelect,
} from "@/components/admin/AdminTableTools";
import {
  AdminErrorModal,
  AdminFilter,
  AdminLoading,
  AdminNotice,
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
import {
  adminApi,
  formatDateTime,
  formatMoney,
  type AdminOrderDetail,
  type AdminOrderRow,
} from "@/lib/adminApi";

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

const KINDS = [
  { value: "", label: "All types" },
  { value: "tickets", label: "Tickets" },
  { value: "food_collection", label: "Collection" },
  { value: "room_deposit", label: "Hire deposit" },
];

const COLUMNS = ["Reference", "Customer", "Items", "Type", "Amount", "Status", "Taken", "Actions"];

function orderKindLabel(kind: string): string {
  if (kind === "food_collection") return "collection";
  if (kind === "room_deposit") return "deposit";
  return kind;
}

export default function AdminFinancePage() {
  const [days, setDays] = useState("90");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(
    () => adminApi.finance({ days: Number(days), status, kind, q: search }),
    [days, status, kind, search]
  );
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, [
    days,
    status,
    kind,
    search,
  ]);

  const orders = data?.orders ?? [];
  const visibleIds = useMemo(() => orders.map((order) => order.id), [orders]);
  const bulk = useBulkSelect(visibleIds);

  async function viewOrder(order: AdminOrderRow) {
    setDetailLoading(true);
    setNotice(null);
    try {
      const full = await adminApi.getOrder(order.id);
      setDetail(full);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load order details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteOne(order: AdminOrderRow) {
    if (!(await confirmDelete(`order ${order.reference}`))) return;
    setDeletingId(order.id);
    setNotice(null);
    try {
      await adminApi.deleteOrder(order.id);
      bulk.clear();
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete that order.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (bulk.count === 0) return;
    if (!(await confirmDelete("order", bulk.count))) return;
    setBulkBusy(true);
    setNotice(null);
    try {
      await adminApi.bulkDeleteOrders(bulk.selectedIds);
      bulk.clear();
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete those orders.");
    } finally {
      setBulkBusy(false);
    }
  }

  if (initialising || !data) {
    return (
      <>
        <AdminErrorModal error={error} onRetry={reload} />
        <AdminLoading label="Counting the takings…" />
      </>
    );
  }

  const emptyColSpan = COLUMNS.length + 1;

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader
        title="Finance"
        blurb={`Every order the venue has taken in the last ${data.window_days} days — tickets, collection, and hire deposits through Stripe.`}
        onRefresh={reload}
        refreshing={refreshing}
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
          icon="takeout_dining"
          tone="rose"
          label="Collection"
          value={formatMoney(data.collection_pence, data.currency)}
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

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by reference, name, or email" />
        <AdminFilter options={STATUSES} value={status} onChange={setStatus} label="Order status" />
        <AdminFilter options={KINDS} value={kind} onChange={setKind} label="Order type" />
        <AdminFilter options={WINDOWS} value={days} onChange={setDays} label="Time window" />
      </AdminToolbar>

      <AdminBulkBar
        count={bulk.count}
        onDelete={deleteSelected}
        onClear={bulk.clear}
        busy={bulkBusy}
        noun="order"
      />

      <AdminTable
        columns={COLUMNS}
        minWidth={1100}
        selectable
        allSelected={bulk.allSelected}
        someSelected={bulk.someSelected}
        onToggleAll={bulk.toggleAll}
      >
        {orders.map((order) => (
          <tr key={order.id} className="admin-table-row">
            <td className="px-5 py-4 w-12">
              <AdminRowCheckbox
                checked={bulk.selected.has(order.id)}
                onChange={() => bulk.toggle(order.id)}
                label={`Select order ${order.reference}`}
              />
            </td>
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
              <StatusBadge status={orderKindLabel(order.kind)} tone="neutral" />
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
            <td className="px-5 py-4">
              <AdminRowActions
                viewLabel={order.reference}
                onView={() => viewOrder(order)}
                onDelete={() => deleteOne(order)}
                deleting={deletingId === order.id || (detailLoading && detail?.id === order.id)}
              />
            </td>
          </tr>
        ))}
        {orders.length === 0 && (
          <AdminTableEmpty
            colSpan={emptyColSpan}
            message={
              query || status
                ? "No orders match that filter."
                : "No orders in this window yet."
            }
          />
        )}
      </AdminTable>

      <AdminDetailModal
        open={detail !== null}
        title={detail ? `Order — ${detail.reference}` : ""}
        fields={detail ? orderDetailFields(detail) : []}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
