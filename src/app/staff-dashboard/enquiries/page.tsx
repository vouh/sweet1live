"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminError,
  AdminFilter,
  AdminLoading,
  AdminPageHeader,
  AdminSearch,
  AdminToolbar,
  StatCard,
  StatGrid,
  StatusBadge,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import { adminApi, formatDate, formatRelative, type AdminEnquiry } from "@/lib/adminApi";

const KINDS = [
  { value: "all", label: "All" },
  { value: "contact", label: "Messages" },
  { value: "venue", label: "Hire enquiries" },
];

export default function AdminEnquiriesPage() {
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => adminApi.enquiries({ kind, q: search }), [kind, search]);
  const { data, error, initialising, reload } = useAdminResource(load, [kind, search]);

  const totals = useMemo(() => {
    const list = data ?? [];
    return {
      all: list.length,
      contact: list.filter((item) => item.kind === "contact").length,
      venue: list.filter((item) => item.kind === "venue").length,
      // The API sorts newest first, so the last row is the longest-waiting one.
      oldest: list.length ? list[list.length - 1].created_at : null,
    };
  }, [data]);

  if (error) return <AdminError message={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        blurb="One inbox for the contact form and the venue-hire enquiry form. Open a message to read it in full and reply by email."
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      <StatGrid>
        <StatCard icon="inbox" tone="terracotta" label="In the inbox" value={totals.all} />
        <StatCard icon="mail" tone="gold" label="Messages" value={totals.contact} />
        <StatCard icon="apartment" tone="chocolate" label="Hire enquiries" value={totals.venue} />
        <StatCard
          icon="schedule"
          tone="rose"
          label="Longest waiting"
          value={totals.oldest ? formatRelative(totals.oldest).replace(" ago", "") : "—"}
          meta={totals.oldest ? "Since the oldest enquiry arrived" : undefined}
        />
      </StatGrid>

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by name, email, or subject" />
        <AdminFilter options={KINDS} value={kind} onChange={setKind} label="Enquiry type" />
      </AdminToolbar>

      {initialising ? (
        <AdminLoading label="Opening the inbox…" />
      ) : (data ?? []).length === 0 ? (
        <div className="admin-panel p-12 text-center text-[var(--admin-muted)]">
          <span className="material-symbols-outlined text-[30px] opacity-50 block mb-2">
            mark_email_read
          </span>
          {query ? "Nothing matches that search." : "The inbox is empty."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((item) => (
            <EnquiryCard
              key={`${item.kind}-${item.id}`}
              enquiry={item}
              expanded={open === `${item.kind}-${item.id}`}
              onToggle={() =>
                setOpen((current) =>
                  current === `${item.kind}-${item.id}` ? null : `${item.kind}-${item.id}`
                )
              }
            />
          ))}
        </div>
      )}
    </>
  );
}

function EnquiryCard({
  enquiry,
  expanded,
  onToggle,
}: {
  enquiry: AdminEnquiry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isVenue = enquiry.kind === "venue";
  const replySubject = encodeURIComponent(`Re: ${enquiry.subject}`);

  return (
    <article className="admin-panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-[color-mix(in_srgb,var(--admin-bg)_55%,var(--admin-surface))] transition-colors"
      >
        <span className="admin-icon-btn shrink-0">
          <span className="material-symbols-outlined text-[18px]">
            {isVenue ? "apartment" : "mail"}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-headline-md text-[16px]">{enquiry.subject}</span>
            <StatusBadge
              status={isVenue ? "hire" : "message"}
              tone={isVenue ? "accent" : "neutral"}
            />
          </span>
          <span className="block text-sm text-[var(--admin-muted)] mt-1">
            {enquiry.name} · {enquiry.email}
          </span>
          {!expanded && enquiry.message && (
            <span className="block text-sm text-[var(--admin-muted)] mt-1.5 line-clamp-1 opacity-80">
              {enquiry.message}
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs text-[var(--admin-muted)] whitespace-nowrap pt-1">
          {formatRelative(enquiry.created_at)}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--admin-border)]">
          {isVenue && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
              <Detail label="Event type" value={enquiry.event_type?.replace(/-/g, " ") ?? "—"} />
              <Detail label="Guests" value={enquiry.guests ? String(enquiry.guests) : "—"} />
              <Detail label="Preferred date" value={formatDate(enquiry.date)} />
            </dl>
          )}
          <p className="font-body-md text-[15px] leading-relaxed whitespace-pre-wrap mt-3">
            {enquiry.message || "No message was left with this enquiry."}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <a
              href={`mailto:${enquiry.email}?subject=${replySubject}`}
              className="admin-btn-primary"
            >
              <span className="material-symbols-outlined text-[18px]">reply</span>
              Reply by email
            </a>
            <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Received {formatDate(enquiry.created_at)}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
        {label}
      </dt>
      <dd className="font-body-md text-sm mt-1 capitalize">{value}</dd>
    </div>
  );
}
