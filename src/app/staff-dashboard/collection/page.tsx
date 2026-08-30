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
import { getStaffSession } from "@/lib/staffAuth";

const WINDOWS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const STATUSES = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

const COLUMNS = ["Reference", "Customer", "Dishes", "Amount", "Status", "Time", "Actions"];

export default function AdminCollectionPage() {
  const canDelete = useMemo(() => {
    const session = getStaffSession();
    return Boolean(session?.is_super_admin || session?.permissions.includes("collection.delete"));
  }, []);
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState("paid");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(
    () =>
      adminApi.collectionOrders({
        days: Number(days),
        status,
        q: search,
      }),
    [days, status, search]
  );
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, [
    days,
    status,
    search,
  ]);

  const orders = data?.orders ?? [];
  const visibleIds = useMemo(() => orders.map((order) => order.id), [orders]);
  const bulk = useBulkSelect(visibleIds);

  async function viewOrder(order: AdminOrderRow) {
    setDetailLoading(true);
    setNotice(null);
    try {
      const full = await adminApi.getCollectionOrder(order.id);
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
      await adminApi.deleteCollectionOrder(order.id);
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
      await adminApi.bulkDeleteCollectionOrders(bulk.selectedIds);
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
        <AdminLoading label="Reading the pass…" />
      </>
    );
  }

  const paidCollection = orders.filter((o) => o.status === "paid");
  const emptyColSpan = COLUMNS.length + (canDelete ? 1 : 0);

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader
        title="Collection orders"
        blurb="Paid pickup orders from the menu — dishes, collection time, and customer details."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <StatGrid>
        <StatCard
          icon="takeout_dining"
          tone="terracotta"
          label="Collection (window)"
          value={formatMoney(data.collection_pence, data.currency)}
          meta={`${paidCollection.length} paid order${paidCollection.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon="hourglass_top"
          tone="gold"
          label="In checkout"
          value={String(data.pending_count)}
          meta="Awaiting Stripe payment"
        />
      </StatGrid>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by reference, name, or email" />
        <AdminFilter options={STATUSES} value={status} onChange={setStatus} label="Order status" />
        <AdminFilter options={WINDOWS} value={days} onChange={setDays} label="Time window" />
      </AdminToolbar>

      {canDelete && <AdminBulkBar
        count={bulk.count}
        onDelete={deleteSelected}
        onClear={bulk.clear}
        busy={bulkBusy}
        noun="order"
      />}

      <AdminTable
        columns={COLUMNS}
        minWidth={1040}
        selectable={canDelete}
        allSelected={bulk.allSelected}
        someSelected={bulk.someSelected}
        onToggleAll={bulk.toggleAll}
      >
        {orders.map((order) => (
          <tr key={order.id} className="admin-table-row">
            {canDelete && <td className="px-5 py-4 w-12">
              <AdminRowCheckbox
                checked={bulk.selected.has(order.id)}
                onChange={() => bulk.toggle(order.id)}
                label={`Select order ${order.reference}`}
              />
            </td>}
            <td className="px-5 py-4 font-label-caps text-[11px] tracking-[0.12em] whitespace-nowrap">
              {order.reference}
            </td>
            <td className="px-5 py-4">
              <p className="font-headline-md text-[15px]">{order.customer_name}</p>
              <p className="text-sm text-[var(--admin-muted)] mt-0.5">{order.customer_email}</p>
            </td>
            <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] max-w-[320px]">
              <span className="line-clamp-3">{order.summary}</span>
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
                onDelete={canDelete ? () => deleteOne(order) : undefined}
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
                ? "No collection orders match that filter."
                : "No collection orders in this window yet."
            }
          />
        )}
      </AdminTable>

      <AdminDetailModal
        open={detail !== null}
        title={detail ? `Collection order — ${detail.reference}` : ""}
        fields={detail ? orderDetailFields(detail) : []}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
