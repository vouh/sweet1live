"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  StatCard,
  StatGrid,
  useAdminResource,
} from "@/components/admin/AdminUI";
import { adminApi, formatMoney, formatRelative } from "@/lib/adminApi";

const ACTIVITY_ICON: Record<string, string> = {
  reservation: "event_seat",
  "venue-hire": "apartment",
  enquiry: "mail",
  order: "payments",
};

export default function StaffDashboardPage() {
  const load = useCallback(() => adminApi.overview(), []);
  const { data, error, initialising, reload } = useAdminResource(load, []);

  if (error) return <AdminError message={error} onRetry={reload} />;
  if (initialising || !data) return <AdminLoading label="Reading tonight's book…" />;

  return (
    <>
      <AdminPageHeader
        title="Tonight at Sweet1ne"
        blurb="Live numbers straight from the booking database — covers, tickets, deposits, and anything still waiting on a staff reply."
        actions={
          <>
            <Link href="/staff-dashboard/reservations" className="admin-btn-ghost">
              Reservations
            </Link>
            <Link href="/staff-dashboard/events" className="admin-btn-primary">
              <span className="material-symbols-outlined text-[18px]">mic</span>
              Events
            </Link>
          </>
        }
      />

      <StatGrid>
        <StatCard
          icon="event_seat"
          tone="terracotta"
          label="Covers today"
          value={data.covers_today}
          meta={`${data.reservations_today} reservation${data.reservations_today === 1 ? "" : "s"} · ${data.reservations_pending} to confirm`}
        />
        <StatCard
          icon="confirmation_number"
          tone="gold"
          label="Tickets sold"
          value={data.tickets_sold_upcoming}
          meta={`${data.upcoming_events} upcoming · ${data.events_sold_out} sold out`}
        />
        <StatCard
          icon="apartment"
          tone="chocolate"
          label="Hire bookings"
          value={data.bookings_confirmed}
          meta={`${data.bookings_pending} awaiting deposit`}
        />
        <StatCard
          icon="payments"
          tone="rose"
          label="Taken (30 days)"
          value={formatMoney(data.revenue_30d_pence, data.currency)}
          meta={`${data.paid_orders_30d} paid order${data.paid_orders_30d === 1 ? "" : "s"}`}
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="admin-panel lg:col-span-2 p-6 md:p-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h3 className="font-headline-md text-[20px]">Latest activity</h3>
            <Link
              href="/staff-dashboard/notifications"
              className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-accent)]"
            >
              All alerts
            </Link>
          </div>

          {data.activity.length === 0 ? (
            <p className="font-body-md text-[var(--admin-muted)] py-8 text-center">
              Nothing has come through yet. New bookings, orders, and messages land here.
            </p>
          ) : (
            <ul className="flex flex-col">
              {data.activity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-4 py-3.5 border-b border-[var(--admin-border)] last:border-0 group"
                  >
                    <span className="admin-icon-btn shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {ACTIVITY_ICON[item.kind] ?? "bolt"}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-headline-md text-[15px] truncate group-hover:text-[var(--admin-accent)] transition-colors">
                        {item.title}
                      </span>
                      <span className="block text-sm text-[var(--admin-muted)] mt-0.5 truncate">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-[var(--admin-muted)] whitespace-nowrap pt-1">
                      {formatRelative(item.at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel p-6 md:p-7">
          <h3 className="font-headline-md text-[20px] mb-5">Needs a person</h3>
          <ul className="flex flex-col gap-3">
            <QueueRow
              href="/staff-dashboard/reservations?status=pending"
              icon="event_seat"
              label="Reservations to confirm"
              count={data.reservations_pending}
            />
            <QueueRow
              href="/staff-dashboard/venue-hire"
              icon="apartment"
              label="Hire deposits unpaid"
              count={data.bookings_pending}
            />
            <QueueRow
              href="/staff-dashboard/enquiries"
              icon="mail"
              label="Enquiries in the inbox"
              count={data.open_enquiries}
            />
            <QueueRow
              href="/staff-dashboard/guests"
              icon="group"
              label="Guest accounts"
              count={data.guests_total}
            />
          </ul>
        </section>
      </div>
    </>
  );
}

function QueueRow({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3 hover:border-[var(--admin-gold)] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-[var(--admin-gold)]">
          {icon}
        </span>
        <span className="flex-1 font-body-md text-sm">{label}</span>
        <span className="font-display-lg text-[22px] leading-none">{count}</span>
      </Link>
    </li>
  );
}
