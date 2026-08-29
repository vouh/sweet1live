"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminError,
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
import { adminApi, formatDate, type AdminReservation } from "@/lib/adminApi";

const STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled"] as const;

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS = ["Guest", "Party", "Date", "Time", "Notes", "Status", "Set status"];

export default function AdminReservationsPage() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminReservation[] | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.reservations({ status, q: search });
    setRows(result);
    return result;
  }, [status, search]);

  const { error, initialising, reload } = useAdminResource(load, [status, search]);

  const totals = useMemo(() => {
    const list = rows ?? [];
    const live = list.filter((row) => row.status !== "cancelled");
    return {
      count: list.length,
      covers: live.reduce((sum, row) => sum + row.party_size, 0),
      pending: list.filter((row) => row.status === "pending").length,
      cancelled: list.length - live.length,
    };
  }, [rows]);

  async function changeStatus(reservation: AdminReservation, next: string) {
    setBusyId(reservation.id);
    setNotice(null);
    // Optimistic — the row flips immediately, and we roll it back if the write fails.
    setRows((current) =>
      (current ?? []).map((row) => (row.id === reservation.id ? { ...row, status: next } : row))
    );
    try {
      await adminApi.setReservationStatus(reservation.id, next);
    } catch (err) {
      setRows((current) =>
        (current ?? []).map((row) =>
          row.id === reservation.id ? { ...row, status: reservation.status } : row
        )
      );
      setNotice(err instanceof Error ? err.message : "Could not update that reservation.");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <AdminError message={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader
        title="Reservations"
        blurb="Every table booked through the site, straight from the reservations table. Change a status here and the guest record changes with it."
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      <StatGrid>
        <StatCard icon="event_seat" tone="terracotta" label="Reservations" value={totals.count} />
        <StatCard icon="group" tone="gold" label="Covers" value={totals.covers} />
        <StatCard icon="pending" tone="chocolate" label="To confirm" value={totals.pending} />
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

      {initialising ? (
        <AdminLoading label="Loading the book…" />
      ) : (
        <AdminTable columns={COLUMNS} minWidth={900}>
          {(rows ?? []).map((row) => (
            <tr key={row.id} className="admin-table-row">
              <td className="px-5 py-4">
                <p className="font-headline-md text-[16px]">{row.name}</p>
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
            </tr>
          ))}
          {(rows ?? []).length === 0 && (
            <AdminTableEmpty
              colSpan={COLUMNS.length}
              message={
                query || status
                  ? "No reservations match that filter."
                  : "No reservations yet. Bookings taken on the site land here."
              }
            />
          )}
        </AdminTable>
      )}
    </>
  );
}
