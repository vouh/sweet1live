"use client";

import { useCallback } from "react";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  StatCard,
  StatGrid,
  StatusBadge,
  useAdminResource,
} from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/adminApi";

export default function AdminSettingsPage() {
  const load = useCallback(() => adminApi.settings(), []);
  const { data, error, initialising, reload } = useAdminResource(load, []);

  if (error) return <AdminError message={error} onRetry={reload} />;
  if (initialising || !data) return <AdminLoading label="Reading configuration…" />;

  const integrations = [
    {
      name: "Stripe payments",
      icon: "credit_card",
      on: data.stripe_enabled,
      detail: data.stripe_enabled
        ? "Checkout is live — tickets and deposits can be paid."
        : "STRIPE_SECRET_KEY is unset. The catalogue reads fine; checkout returns 503.",
    },
    {
      name: "Stripe webhooks",
      icon: "webhook",
      on: data.stripe_webhook_configured,
      detail: data.stripe_webhook_configured
        ? "Payment confirmations arrive automatically."
        : "STRIPE_WEBHOOK_SECRET is unset — orders settle only when the guest returns to the success page.",
    },
    {
      name: "Supabase",
      icon: "database",
      on: data.supabase_configured,
      detail: data.supabase_configured
        ? "Project URL configured."
        : "No Supabase project configured for this environment.",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Settings"
        blurb="How this deployment is wired, read live from the API. Values live in environment variables — no secret is ever sent to the browser, only whether it is set."
        actions={
          <button type="button" onClick={reload} className="admin-btn-ghost">
            Refresh
          </button>
        }
      />

      <StatGrid>
        <StatCard
          icon="database"
          tone="terracotta"
          label="Database"
          value={data.database_backend}
          meta={`${data.tables.reduce((sum, t) => sum + t.rows, 0)} rows tracked`}
        />
        <StatCard
          icon="meeting_room"
          tone="gold"
          label="Rooms on sale"
          value={`${data.rooms_active}/${data.rooms_total}`}
        />
        <StatCard
          icon="hourglass_top"
          tone="chocolate"
          label="Checkout hold"
          value={`${data.checkout_hold_minutes}m`}
          meta="Seats released after this"
        />
        <StatCard
          icon="payments"
          tone="rose"
          label="Currency"
          value={data.currency.toUpperCase()}
          meta="Stored as integer pence"
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="admin-panel p-6">
          <h3 className="font-headline-md text-[20px] mb-4">Integrations</h3>
          <ul className="flex flex-col gap-3">
            {integrations.map((item) => (
              <li
                key={item.name}
                className="flex items-start gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3"
              >
                <span className="material-symbols-outlined text-[20px] text-[var(--admin-gold)] mt-0.5">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-headline-md text-[15px]">{item.name}</p>
                    <StatusBadge
                      status={item.on ? "configured" : "not set"}
                      tone={item.on ? "positive" : "pending"}
                    />
                  </div>
                  <p className="text-sm text-[var(--admin-muted)] mt-1">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-panel p-6">
          <h3 className="font-headline-md text-[20px] mb-4">Environment</h3>
          <dl className="flex flex-col">
            <Row label="Public site" value={data.public_site_url} />
            <Row label="Allowed origins" value={data.cors_origins.join(", ") || "—"} />
            <Row label="Database backend" value={data.database_backend} />
            <Row label="Checkout hold" value={`${data.checkout_hold_minutes} minutes`} />
            <Row
              label="Guest session length"
              value={`${Math.round(data.session_hours / 24)} days`}
            />
            <Row label="Currency" value={data.currency.toUpperCase()} />
          </dl>
          <p className="text-xs text-[var(--admin-muted)] mt-5 pt-4 border-t border-[var(--admin-border)]">
            These are read-only here. Change them in <code>.env.local</code> (or the host&apos;s
            environment settings) and restart the API.
          </p>
        </section>

        <section className="admin-panel p-6 lg:col-span-2">
          <h3 className="font-headline-md text-[20px] mb-4">What&apos;s in the database</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.tables.map((table) => (
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
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--admin-border)] last:border-0">
      <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] pt-0.5">
        {label}
      </dt>
      <dd className="font-body-md text-sm text-right break-all">{value}</dd>
    </div>
  );
}
