"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminError,
  AdminFilter,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  AdminSearch,
  AdminToolbar,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusSelect,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import { adminApi, formatDateTime, formatMoney, type AdminEvent } from "@/lib/adminApi";

const STATUSES = ["draft", "published", "cancelled"] as const;

const WHEN = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

export default function AdminEventsPage() {
  const [when, setWhen] = useState("upcoming");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminEvent[] | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.events({ when, q: search });
    setEvents(result);
    return result;
  }, [when, search]);

  const { error, initialising, reload } = useAdminResource(load, [when, search]);

  const totals = useMemo(() => {
    const list = events ?? [];
    return {
      events: list.length,
      sold: list.reduce((sum, event) => sum + event.sold, 0),
      available: list.reduce((sum, event) => sum + event.available, 0),
      gross: list.reduce((sum, event) => sum + event.gross_pence, 0),
      currency: list[0]?.currency ?? "gbp",
    };
  }, [events]);

  async function changeStatus(event: AdminEvent, next: string) {
    setBusyId(event.id);
    setNotice(null);
    setEvents((current) =>
      (current ?? []).map((row) => (row.id === event.id ? { ...row, status: next } : row))
    );
    try {
      await adminApi.setEventStatus(event.id, next);
    } catch (err) {
      setEvents((current) =>
        (current ?? []).map((row) =>
          row.id === event.id ? { ...row, status: event.status } : row
        )
      );
      setNotice(err instanceof Error ? err.message : "Could not update that event.");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <AdminError message={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader
        title="Events"
        blurb="The live programme with real ticket counts — sold, held by in-flight checkouts, and still on sale. Drafts are visible here only."
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      <StatGrid>
        <StatCard icon="mic" tone="terracotta" label="Events" value={totals.events} />
        <StatCard icon="confirmation_number" tone="gold" label="Tickets sold" value={totals.sold} />
        <StatCard icon="event_available" tone="chocolate" label="Still on sale" value={totals.available} />
        <StatCard
          icon="payments"
          tone="rose"
          label="Face value sold"
          value={formatMoney(totals.gross, totals.currency)}
        />
      </StatGrid>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice(null)} />}

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search events by title" />
        <AdminFilter options={WHEN} value={when} onChange={setWhen} label="Date range" />
      </AdminToolbar>

      {initialising ? (
        <AdminLoading label="Loading the programme…" />
      ) : (events ?? []).length === 0 ? (
        <div className="admin-panel p-12 text-center text-[var(--admin-muted)]">
          <span className="material-symbols-outlined text-[30px] opacity-50 block mb-2">mic_off</span>
          No events match that filter.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(events ?? []).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              busy={busyId === event.id}
              onStatus={(next) => changeStatus(event, next)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function EventCard({
  event,
  busy,
  onStatus,
}: {
  event: AdminEvent;
  busy: boolean;
  onStatus: (next: string) => void;
}) {
  const soldPct = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;

  return (
    <article className="admin-panel p-5 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-headline-md text-[20px]">{event.title}</h3>
            <StatusBadge status={event.status} />
            {event.available === 0 && event.capacity > 0 && (
              <StatusBadge status="sold out" tone="accent" />
            )}
          </div>
          <p className="font-body-md text-sm text-[var(--admin-muted)] mt-1">
            {event.subtitle || event.room_name}
          </p>
          <p className="font-body-md text-sm mt-2">
            <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1 text-[var(--admin-gold)]">
              schedule
            </span>
            {formatDateTime(event.starts_at)}
            {event.doors_at && ` · doors ${formatDateTime(event.doors_at).split(", ")[1] ?? ""}`}
            <span className="mx-2 opacity-40">|</span>
            <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1 text-[var(--admin-gold)]">
              location_on
            </span>
            {event.room_name}
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
                {event.sold} of {event.capacity} sold
                {event.reserved > 0 && ` · ${event.reserved} held in checkout`}
              </span>
              <span className="font-body-md text-[var(--admin-muted)]">{soldPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--admin-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--admin-accent)]"
                style={{ width: `${Math.min(100, soldPct)}%` }}
              />
            </div>
          </div>

          {event.ticket_types.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.ticket_types.map((type) => (
                <div
                  key={type.id}
                  className="rounded-xl border border-[var(--admin-border)] px-4 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-body-md text-sm truncate">{type.name}</p>
                    <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                      {type.quantity_sold} sold · {type.quantity_available} left
                    </p>
                  </div>
                  <p className="font-headline-md text-[15px] whitespace-nowrap">
                    {formatMoney(type.price_pence, event.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-52 shrink-0 flex flex-row lg:flex-col gap-3 lg:border-l lg:border-[var(--admin-border)] lg:pl-5">
          <div className="flex-1">
            <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Face value
            </p>
            <p className="font-display-lg text-[26px] leading-none mt-1">
              {formatMoney(event.gross_pence, event.currency)}
            </p>
            {event.checked_in > 0 && (
              <p className="text-xs text-[var(--admin-muted)] mt-1.5">
                {event.checked_in} checked in at the door
              </p>
            )}
          </div>
          <div className="flex-1 lg:flex-none">
            <label className="admin-label">Status</label>
            <StatusSelect
              label={`Status for ${event.title}`}
              value={event.status}
              options={STATUSES}
              busy={busy}
              onChange={onStatus}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
