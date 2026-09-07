"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  AdminErrorModal,
  AdminLoading,
  AdminPageHeader,
  StatCard,
  StatGrid,
  useAdminResource,
} from "@/components/admin/AdminUI";
import { adminApi, formatMoney, formatRelative } from "@/lib/adminApi";
import { getStaffSession } from "@/lib/staffAuth";
import { canAccessPath } from "@/lib/staffPermissions";

const ACTIVITY_ICON: Record<string, string> = {
  reservation: "event_seat",
  "venue-hire": "apartment",
  enquiry: "mail",
  order: "payments",
  collection: "takeout_dining",
};

export default function StaffDashboardPage() {
  const pathname = usePathname();
  const portal = pathname.startsWith("/portal");
  const session = useMemo(() => getStaffSession(), []);
  const route = useCallback((path: string) => portal ? path.replace("/staff-dashboard", "/portal") : path, [portal]);
  const allowed = useCallback((path: string) => !portal || Boolean(session && canAccessPath(route(path), session.permissions, session.is_super_admin)), [portal, route, session]);
  const load = useCallback(() => adminApi.overview(), []);
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, []);

  const loadSettings = useCallback(() => session?.is_super_admin ? adminApi.settings() : Promise.resolve(null), [session]);
  const { data: settings } = useAdminResource(loadSettings, []);

  if (initialising || !data) {
    return (
      <>
        <AdminErrorModal error={error} onRetry={reload} />
        <AdminLoading label="Reading tonight's book…" />
      </>
    );
  }

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />

      <AdminPageHeader title="Dashboard" onRefresh={reload} refreshing={refreshing} />

      <StatGrid>
        <StatCard
          icon="event_seat"
          tone="terracotta"
          label="Covers today"
          value={data.covers_today}
          meta={`${data.reservations_today} reservation${data.reservations_today === 1 ? "" : "s"} · ${data.reservations_pending} pending`}
        />
        <StatCard
          icon="confirmation_number"
          tone="gold"
          label="Tickets sold"
          value={data.tickets_sold_upcoming}
          meta={`${data.upcoming_events} upcoming · ${data.events_sold_out} sold out`}
        />
        <StatCard
          icon="mail"
          tone="chocolate"
          label="Hire enquiries"
          value={data.open_enquiries}
          meta="Reply in Enquiries"
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
            {allowed("/staff-dashboard/notifications") && <Link
              href={route("/staff-dashboard/notifications")}
              className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-accent)]"
            >
              All alerts
            </Link>}
          </div>

          {data.activity.length === 0 ? (
            <p className="font-body-md text-[var(--admin-muted)] py-8 text-center">
              Nothing has come through yet. New bookings, orders, and messages land here.
            </p>
          ) : (
            <ul className="flex flex-col">
              {data.activity.filter((item) => allowed(item.href)).map((item) => (
                <li key={item.id}>
                  <Link
                    href={route(item.href)}
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
          <h3 className="font-headline-md text-[20px] mb-5">Action needed</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {allowed("/staff-dashboard/reservations") && <QueueCard
              href={route("/staff-dashboard/reservations?status=pending")}
              icon="event_seat"
              label="Pending reservations"
              count={data.reservations_pending}
            />}
            {allowed("/staff-dashboard/enquiries") && <QueueCard
              href={route("/staff-dashboard/enquiries")}
              icon="mail"
              label="Hire enquiries"
              count={data.open_enquiries}
            />}
            {allowed("/staff-dashboard/collection") && <QueueCard
              href={route("/staff-dashboard/collection")}
              icon="takeout_dining"
              label="Collection in checkout"
              count={data.collection_pending}
            />}
            {allowed("/staff-dashboard/enquiries") && <QueueCard
              href={route("/staff-dashboard/enquiries")}
              icon="mail"
              label="Enquiries in the inbox"
              count={data.open_enquiries}
            />}
            {allowed("/staff-dashboard/guests") && <QueueCard
              href={route("/staff-dashboard/guests")}
              icon="group"
              label="Guest accounts"
              count={data.guests_total}
            />}
          </div>
        </section>
      </div>

      {settings && settings.tables.length > 0 && (
        <section className="admin-panel p-6 md:p-7 mt-5">
          <h3 className="font-headline-md text-[20px] mb-4">What&apos;s in the database</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {settings.tables.map((table) => (
              <div
                key={table.table}
                className="rounded-xl border border-[var(--admin-border)] px-4 py-3"
              >
                <p className="font-display-lg text-[24px] leading-none">{table.rows}</p>
                <p className="font-label-caps text-[10px] tracking-[0.18em] uppercase text-[var(--admin-muted)] mt-2">
                  {table.label}
                </p>
                <p className="text-xs text-[var(--admin-muted)] opacity-70 mt-0.5">
                  {table.table}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function QueueCard({
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
    <Link
      href={href}
      className="rounded-xl border border-[var(--admin-border)] px-4 py-3 flex flex-col gap-3 hover:border-[var(--admin-gold)] transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-[18px] text-[var(--admin-gold)]">
          {icon}
        </span>
        <span className="font-display-lg text-[22px] leading-none">{count}</span>
      </div>
      <span className="font-label-caps text-[9px] tracking-[0.16em] uppercase text-[var(--admin-muted)]">
        {label}
      </span>
    </Link>
  );
}
