"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminErrorModal,
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
import { compressImage, uploadEventImage } from "@/lib/imageUpload";
import { getStaffSession } from "@/lib/staffAuth";

const STATUSES = ["draft", "published", "cancelled"] as const;

const WHEN = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

export default function AdminEventsPage() {
  const canEdit = useMemo(() => {
    const session = getStaffSession();
    return Boolean(session?.is_super_admin || session?.permissions.includes("events.edit"));
  }, []);
  const [when, setWhen] = useState("upcoming");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [editing, setEditing] = useState<AdminEvent | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.events({ when, q: search });
    setEvents(result);
    return result;
  }, [when, search]);

  const { error, initialising, reload, refreshing } = useAdminResource(load, [when, search]);

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

  async function saveEvent(id: string, changes: Partial<AdminEvent>) {
    const updated = await adminApi.updateEvent(id, changes);
    setEvents((current) => (current ?? []).map((event) => event.id === id ? updated : event));
    setEditing(null);
    setNotice("Event details saved.");
  }

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader
        title="Events"
        onRefresh={reload}
        refreshing={refreshing}
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
              onStatus={canEdit ? (next) => changeStatus(event, next) : undefined}
              onEdit={canEdit ? () => setEditing(event) : undefined}
            />
          ))}
        </div>
      )}
      {editing && <EventEditor event={editing} onClose={() => setEditing(null)} onSave={saveEvent} />}
    </>
  );
}

function EventCard({
  event,
  busy,
  onStatus,
  onEdit,
}: {
  event: AdminEvent;
  busy: boolean;
  onStatus?: (next: string) => void;
  onEdit?: () => void;
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
          {onStatus && <div className="flex-1 lg:flex-none">
            <label className="admin-label">Status</label>
            <StatusSelect
              label={`Status for ${event.title}`}
              value={event.status}
              options={STATUSES}
              busy={busy}
              onChange={onStatus}
            />
          </div>}
          {onEdit && <button type="button" onClick={onEdit} className="admin-btn-ghost text-sm w-full">
            <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1">edit</span>
            Edit details
          </button>}
        </div>
      </div>
    </article>
  );
}

type EventDraft = Pick<AdminEvent, "title" | "subtitle" | "description" | "images">;

function EventEditor({ event, onClose, onSave }: { event: AdminEvent; onClose: () => void; onSave: (id: string, changes: Partial<AdminEvent>) => Promise<void> }) {
  const storageKey = `sweet1ne-event-draft:${event.id}`;
  const [draft, setDraft] = useState<EventDraft>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) try { return JSON.parse(saved) as EventDraft; } catch { /* ignore corrupt draft */ }
    }
    return { title: event.title, subtitle: event.subtitle, description: event.description, images: event.images ?? [] };
  });
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { window.localStorage.setItem(storageKey, JSON.stringify(draft)); }, [draft, storageKey]);

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 4 - draft.images.length);
    setError("");
    try {
      for (let index = 0; index < picked.length; index += 1) {
        setProgress(0);
        const compressed = await compressImage(picked[index]);
        const url = await uploadEventImage(compressed, setProgress);
        setDraft((current) => ({ ...current, images: [...current.images, url].slice(0, 4) }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload interrupted. Your draft has been kept.");
    } finally { setProgress(null); }
  }

  async function submit() {
    if (!draft.title.trim()) { setError("Add an event name."); return; }
    setSaving(true); setError("");
    try {
      await onSave(event.id, { ...draft, title: draft.title.trim(), subtitle: draft.subtitle.trim(), description: draft.description.trim() });
      window.localStorage.removeItem(storageKey);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the event."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[70] bg-[#1a100c]/70 p-4 overflow-y-auto" onClick={onClose}>
    <section className="admin-panel max-w-2xl mx-auto my-8 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between gap-4"><div><h2 className="font-headline-lg text-[26px]">Edit event</h2><p className="text-sm text-[var(--admin-muted)] mt-1">Your draft stays on this device if you leave and return.</p></div><button type="button" onClick={onClose} className="admin-icon-btn"><span className="material-symbols-outlined">close</span></button></div>
      <div className="grid gap-5 mt-6">
        <label><span className="admin-label">Event name</span><input className="admin-input" value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label><span className="admin-label">Subtitle</span><input className="admin-input" value={draft.subtitle} maxLength={240} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></label>
        <label><span className="admin-label">Description / notes</span><textarea className="admin-input min-h-32" value={draft.description} maxLength={3000} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <div><span className="admin-label">Images ({draft.images.length}/4)</span><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">{draft.images.map((url) => <div key={url} className="relative aspect-video rounded-xl overflow-hidden bg-[var(--admin-border)]"><img src={url} alt="Event" className="w-full h-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => setDraft({ ...draft, images: draft.images.filter((image) => image !== url) })} className="absolute top-1 right-1 rounded-full bg-black/70 text-white w-7 h-7">×</button></div>)}</div>
          {draft.images.length < 4 && <label className="admin-btn-ghost text-sm inline-flex mt-3 cursor-pointer"><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addImages(e.target.files)} />Add images</label>}
          {progress !== null && <div className="mt-3"><div className="flex justify-between text-xs text-[var(--admin-muted)]"><span>Compressing and uploading</span><span>{progress}%</span></div><div className="h-2 mt-1 rounded-full bg-[var(--admin-border)] overflow-hidden"><div className="h-full bg-[var(--admin-accent)]" style={{ width: `${progress}%` }} /></div></div>}
        </div>
      </div>
      {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}
      <div className="flex gap-3 mt-6"><button type="button" onClick={submit} disabled={saving || progress !== null} className="admin-btn-primary">{saving ? "Saving…" : "Save event"}</button><button type="button" onClick={onClose} className="admin-btn-ghost">Close</button></div>
    </section>
  </div>;
}
