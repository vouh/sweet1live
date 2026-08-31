"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminErrorModal,
  AdminFilter,
  AdminLoading,
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
import { adminApi, formatDate, formatMoney, formatRelative } from "@/lib/adminApi";

const SCOPE = [
  { value: "everyone", label: "Everyone" },
  { value: "accounts", label: "Account holders" },
];

const COLUMNS = ["Guest", "Account", "Visits", "Tickets", "Spend", "Last seen", "Since"];

export default function AdminGuestsPage() {
  const [scope, setScope] = useState("everyone");
  const [query, setQuery] = useState("");
  const search = useDebounced(query);

  const load = useCallback(
    () => adminApi.guests({ q: search, accounts_only: scope === "accounts" }),
    [search, scope]
  );
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, [search, scope]);

  const totals = useMemo(() => {
    const list = data ?? [];
    const spend = list.reduce((sum, guest) => sum + guest.spend_pence, 0);
    const spenders = list.filter((guest) => guest.spend_pence > 0);
    return {
      people: list.length,
      accounts: list.filter((guest) => guest.has_account).length,
      mailingList: list.filter((guest) => guest.mailing_list).length,
      spend,
      average: spenders.length ? Math.round(spend / spenders.length) : 0,
      currency: list[0]?.currency ?? "gbp",
    };
  }, [data]);

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />
      <AdminPageHeader
        title="Guests"
        blurb="Everyone the venue knows, matched on email — reservations, ticket orders, room bookings, and footer mailing-list signups."
        onRefresh={reload}
        refreshing={refreshing}
      />

      <StatGrid>
        <StatCard icon="group" tone="terracotta" label="Known guests" value={totals.people} />
        <StatCard icon="badge" tone="gold" label="With accounts" value={totals.accounts} />
        <StatCard icon="mail" tone="rose" label="Mailing list" value={totals.mailingList} />
        <StatCard
          icon="payments"
          tone="chocolate"
          label="Lifetime spend"
          value={formatMoney(totals.spend, totals.currency)}
        />
        <StatCard
          icon="trending_up"
          tone="rose"
          label="Average per spender"
          value={formatMoney(totals.average, totals.currency)}
        />
      </StatGrid>

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search guests by name or email" />
        <AdminFilter options={SCOPE} value={scope} onChange={setScope} label="Guest scope" />
      </AdminToolbar>

      {initialising ? (
        <AdminLoading label="Looking up guests…" />
      ) : (
        <AdminTable columns={COLUMNS} minWidth={940}>
          {(data ?? []).map((guest) => (
            <tr key={guest.id} className="admin-table-row">
              <td className="px-5 py-4">
                <p className="font-headline-md text-[16px]">{guest.name}</p>
                <p className="text-sm text-[var(--admin-muted)] mt-0.5">{guest.email}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={guest.has_account ? "registered" : "guest"}
                    tone={guest.has_account ? "positive" : "neutral"}
                  />
                  {guest.mailing_list && (
                    <StatusBadge status="mailing list" tone="accent" />
                  )}
                </div>
              </td>
              <td className="px-5 py-4 font-body-md text-sm">
                <span title="Reservations">{guest.reservations_count}</span>
                <span className="text-[var(--admin-muted)]"> tables</span>
                {guest.bookings_count > 0 && (
                  <>
                    <span className="mx-1.5 opacity-40">·</span>
                    <span title="Room hire bookings">{guest.bookings_count}</span>
                    <span className="text-[var(--admin-muted)]"> hires</span>
                  </>
                )}
              </td>
              <td className="px-5 py-4 font-body-md text-sm">
                {guest.tickets_count}
                {guest.orders_count > 0 && (
                  <span className="text-[var(--admin-muted)]">
                    {" "}
                    / {guest.orders_count} order{guest.orders_count === 1 ? "" : "s"}
                  </span>
                )}
              </td>
              <td className="px-5 py-4 font-headline-md text-[15px] whitespace-nowrap">
                {guest.spend_pence > 0 ? formatMoney(guest.spend_pence, guest.currency) : "—"}
              </td>
              <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] whitespace-nowrap">
                {formatRelative(guest.last_seen_at)}
              </td>
              <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] whitespace-nowrap">
                {guest.created_at ? formatDate(guest.created_at) : "—"}
              </td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <AdminTableEmpty
              colSpan={COLUMNS.length}
              message={
                query
                  ? "No guests match that search."
                  : "No guests on record yet — the first booking creates one."
              }
            />
          )}
        </AdminTable>
      )}
    </>
  );
}
