"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminBulkBar,
  AdminDetailModal,
  AdminRowActions,
  AdminRowCheckbox,
  confirmDelete,
  useBulkSelect,
  reservationDetailFields,
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
  StatusSelect,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import {
  adminApi,
  formatDate,
  type AdminReservation,
} from "@/lib/adminApi";

const STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled"] as const;

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS = ["Guest", "Party", "Date", "Time", "Notes", "Status", "Set status", "Actions"];

export default function AdminReservationsPage() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminReservation[]>([]);
  const [detail, setDetail] = useState<AdminReservation | null>(null);

  const load = useCallback(
    () => adminApi.reservations({ status: status || undefined, q: search || undefined }),
    [status, search]
  );

  const { data, error, initialising, reload, refreshing } = useAdminResource(load, [status, search]);

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const visibleIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const bulk = useBulkSelect(visibleIds);

  const totals = useMemo(() => {
    const live = rows.filter((row) => row.status !== "cancelled");
    return {
      count: rows.length,
      covers: live.reduce((sum, row) => sum + row.party_size, 0),
      pending: rows.filter((row) => row.status === "pending").length,
      cancelled: rows.length - live.length,
    };
  }, [rows]);

  async function changeStatus(reservation: AdminReservation, next: string) {
    setBusyId(reservation.id);
    setNotice(null);
    setRows((current) =>
      current.map((row) => (row.id === reservation.id ? { ...row, status: next } : row))
    );
    try {
      await adminApi.setReservationStatus(reservation.id, next);
      reload();
    } catch (err) {
      setRows((current) =>
        current.map((row) =>
          row.id === reservation.id ? { ...row, status: reservation.status } : row
        )
      );
      setNotice(err instanceof Error ? err.message : "Could not update that reservation.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOne(row: AdminReservation) {
    if (!(await confirmDelete(`reservation for ${row.name}`))) return;
    setDeletingId(row.id);
    setNotice(null);
    try {
      await adminApi.deleteReservation(row.id);
      bulk.clear();
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete that reservation.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (bulk.count === 0) return;
    if (!(await confirmDelete("reservation", bulk.count))) return;
    setBulkBusy(true);
    setNotice(null);
    try {
      await adminApi.bulkDeleteReservations(bulk.selectedIds);
      bulk.clear();
      reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete those reservations.");
    } finally {
      setBulkBusy(false);
    }
  }

  const emptyColSpan = COLUMNS.length + 1;

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader title="Reservations" onRefresh={reload} refreshing={refreshing} />

      <StatGrid>
        <StatCard icon="event_seat" tone="terracotta" label="Reservations" value={totals.count} />
        <StatCard
          icon="group"
          tone="gold"
          label="Covers"
          value={totals.covers}
          meta="Total guests across every non-cancelled reservation"
        />
        <StatCard icon="pending" tone="chocolate" label="Pending" value={totals.pending} />
        <StatCard icon="cancel" tone="rose" label="Cancelled" value={totals.cancelled} />
      </StatGrid>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      <AdminToolbar>
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email, or note"
        />
        <AdminFilter options={FILTERS} value={status} onChange={setStatus} label="Status filter" />
      </AdminToolbar>

      <AdminBulkBar
        count={bulk.count}
        onDelete={deleteSelected}
        onClear={bulk.clear}
        busy={bulkBusy}
        noun="reservation"
      />

      {initialising ? (
        <AdminLoading label="Loading the book…" />
      ) : (
        <AdminTable
          columns={COLUMNS}
          minWidth={980}
          selectable
          allSelected={bulk.allSelected}
          someSelected={bulk.someSelected}
          onToggleAll={bulk.toggleAll}
        >
          {rows.map((row) => (
            <tr key={row.id} className="admin-table-row">
              <td className="px-5 py-4 w-12">
                <AdminRowCheckbox
                  checked={bulk.selected.has(row.id)}
                  onChange={() => bulk.toggle(row.id)}
                  label={`Select reservation for ${row.name}`}
                />
              </td>
              <td className="px-5 py-4">
                <p className="font-headline-md text-[16px] flex items-center gap-1.5">
                  {row.name}
                  {row.status === "pending" && (
                    <span
                      title="Needs confirmation"
                      aria-label="Needs confirmation"
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none shrink-0"
                    >
                      !
                    </span>
                  )}
                </p>
                <p className="text-sm text-[var(--admin-muted)] mt-0.5">{row.email}</p>
              </td>
              <td className="px-5 py-4 font-body-md text-sm">{row.party_size}</td>
              <td className="px-5 py-4 font-body-md text-sm whitespace-nowrap">
                {formatDate(row.date)}
              </td>
              <td className="px-5 py-4 numeral font-body-md text-sm">{row.time}</td>
              <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] max-w-[240px]">
                <span className="line-clamp-2">{row.notes || "—"}</span>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-5 py-4">
                <StatusSelect
                  label={`Status for ${row.name}`}
                  value={row.status}
                  options={STATUSES}
                  busy={busyId === row.id}
                  onChange={(next) => changeStatus(row, next)}
                />
              </td>
              <td className="px-5 py-4">
                <AdminRowActions
                  viewLabel={row.name}
                  onView={() => setDetail(row)}
                  onDelete={() => deleteOne(row)}
                  deleting={deletingId === row.id}
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <AdminTableEmpty
              colSpan={emptyColSpan}
              message={
                query || status
                  ? "No reservations match that filter."
                  : "No reservations yet. Bookings taken on the site land here."
              }
            />
          )}
        </AdminTable>
      )}

      <AdminDetailModal
        open={detail !== null}
        title={detail ? `Reservation — ${detail.name}` : ""}
        fields={detail ? reservationDetailFields(detail) : []}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
