"use client";

import { useCallback, useState } from "react";
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
import { adminApi, formatDate, formatMoney, type AdminVenueHire } from "@/lib/adminApi";

const STATUSES = ["pending_payment", "confirmed", "cancelled", "expired"] as const;

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Deposit due" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS = ["Reference", "Client", "Room", "Date", "Window", "Party", "Deposit", "Status", "Set status"];

export default function AdminVenueHirePage() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState<AdminVenueHire | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.venueHire({ status, q: search });
    setData(result);
    return result;
  }, [status, search]);

  const { error, initialising, reload } = useAdminResource(load, [status, search]);

  async function changeStatus(id: string, previous: string, next: string) {
    setBusyId(id);
    setNotice(null);
    setData((current) =>
      current
        ? {
            ...current,
            bookings: current.bookings.map((b) => (b.id === id ? { ...b, status: next } : b)),
          }
        : current
    );
    try {
      await adminApi.setBookingStatus(id, next);
      reload();
    } catch (err) {
      setData((current) =>
        current
          ? {
              ...current,
              bookings: current.bookings.map((b) =>
                b.id === id ? { ...b, status: previous } : b
              ),
            }
          : current
      );
      setNotice(err instanceof Error ? err.message : "Could not update that booking.");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <AdminError message={error} onRetry={reload} />;
  if (initialising || !data) return <AdminLoading label="Loading room hire…" />;

  return (
    <>
      <AdminPageHeader
        title="Venue Hire"
        blurb="Private hire across the seven rooms — who booked what, which deposits have cleared Stripe, and what is still holding a date."
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      <StatGrid>
        <StatCard icon="apartment" tone="terracotta" label="Bookings" value={data.bookings.length} />
        <StatCard icon="task_alt" tone="gold" label="Confirmed" value={data.confirmed} />
        <StatCard icon="hourglass_top" tone="chocolate" label="Deposit due" value={data.pending} />
        <StatCard
          icon="savings"
          tone="rose"
          label="Deposits held"
          value={formatMoney(data.deposits_held_pence, data.currency)}
        />
      </StatGrid>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      <section className="mb-8">
        <h3 className="font-headline-md text-[20px] mb-4">The rooms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.rooms.map((room) => (
            <article key={room.id} className="admin-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-headline-md text-[16px]">{room.name}</h4>
                {!room.is_active && <StatusBadge status="off sale" tone="negative" />}
              </div>
              <p className="text-sm text-[var(--admin-muted)] mt-1.5">
                Seats {room.capacity_seated} · Standing {room.capacity_standing}
              </p>
              <dl className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <dt className="font-label-caps text-[9px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
                    Hire from
                  </dt>
                  <dd className="font-headline-md text-[17px] mt-0.5">
                    {formatMoney(room.hire_fee_pence, data.currency)}
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="font-label-caps text-[9px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
                    Deposit
                  </dt>
                  <dd className="font-headline-md text-[17px] mt-0.5">
                    {room.deposit_pence > 0
                      ? formatMoney(room.deposit_pence, data.currency)
                      : "Enquiry"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-[var(--admin-muted)] mt-4 pt-3 border-t border-[var(--admin-border)]">
                {room.bookings_upcoming} upcoming booking
                {room.bookings_upcoming === 1 ? "" : "s"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <h3 className="font-headline-md text-[20px] mb-4">Hire bookings</h3>

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by name, email, or reference" />
        <AdminFilter options={FILTERS} value={status} onChange={setStatus} label="Status filter" />
      </AdminToolbar>

      <AdminTable columns={COLUMNS} minWidth={1080}>
        {data.bookings.map((booking) => (
          <tr key={booking.id} className="admin-table-row">
            <td className="px-5 py-4 font-label-caps text-[11px] tracking-[0.12em] whitespace-nowrap">
              {booking.reference}
            </td>
            <td className="px-5 py-4">
              <p className="font-headline-md text-[15px]">{booking.name}</p>
              <p className="text-sm text-[var(--admin-muted)] mt-0.5">{booking.email}</p>
            </td>
            <td className="px-5 py-4 font-body-md text-sm">{booking.room_name}</td>
            <td className="px-5 py-4 font-body-md text-sm whitespace-nowrap">
              {formatDate(booking.date)}
            </td>
            <td className="px-5 py-4 numeral font-body-md text-sm whitespace-nowrap">
              {booking.start_time}–{booking.end_time}
            </td>
            <td className="px-5 py-4 font-body-md text-sm">{booking.party_size}</td>
            <td className="px-5 py-4 font-body-md text-sm whitespace-nowrap">
              {booking.deposit_pence > 0
                ? formatMoney(booking.deposit_pence, booking.currency)
                : "—"}
            </td>
            <td className="px-5 py-4">
              <StatusBadge status={booking.status} />
            </td>
            <td className="px-5 py-4">
              <StatusSelect
                label={`Status for ${booking.reference}`}
                value={booking.status}
                options={STATUSES}
                busy={busyId === booking.id}
                onChange={(next) => changeStatus(booking.id, booking.status, next)}
              />
            </td>
          </tr>
        ))}
        {data.bookings.length === 0 && (
          <AdminTableEmpty
            colSpan={COLUMNS.length}
            message={
              query || status
                ? "No hire bookings match that filter."
                : "No room bookings yet. Hire requests taken on the site land here."
            }
          />
        )}
      </AdminTable>
    </>
  );
}
