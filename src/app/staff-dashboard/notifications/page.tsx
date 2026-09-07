"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminErrorModal,
  AdminFilter,
  AdminLoading,
  AdminPageHeader,
  AdminRefreshButton,
  AdminSearch,
  AdminTable,
  AdminTableEmpty,
  AdminToolbar,
  StatCard,
  StatGrid,
  useAdminResource,
  useDebounced,
} from "@/components/admin/AdminUI";
import { adminApi, formatDate, formatRelative, type AdminNotification } from "@/lib/adminApi";
import { markNotificationsSeen } from "@/lib/adminNotifications";
import { getStaffSession } from "@/lib/staffAuth";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "action", label: "Needs action" },
  { value: "warning", label: "Warnings" },
  { value: "info", label: "Info" },
];

const SEVERITY: Record<
  AdminNotification["severity"],
  { icon: string; accent: string; label: string }
> = {
  action: { icon: "pending_actions", accent: "#c45c3a", label: "Needs action" },
  warning: { icon: "warning", accent: "#e11d48", label: "Warning" },
  info: { icon: "info", accent: "#d4a574", label: "Info" },
  success: { icon: "task_alt", accent: "#10b981", label: "Good news" },
};

const KIND_ICON: Record<string, string> = {
  reservation: "event_seat",
  "venue-hire": "apartment",
  enquiry: "mail",
  event: "mic",
  order: "payments",
};

type Tab = "alerts" | "mailing";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<Tab>("alerts");
  const session = useMemo(() => getStaffSession(), []);
  const canSeeMailingList = Boolean(session?.is_super_admin || session?.permissions.includes("guests.view"));

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        blurb="Floor alerts that need attention, plus everyone who signed up through the footer newsletter form."
      />

      {canSeeMailingList && (
        <AdminToolbar>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("alerts")}
              className={tab === "alerts" ? "admin-btn-primary text-sm" : "admin-btn-ghost text-sm"}
            >
              Alerts
            </button>
            <button
              type="button"
              onClick={() => setTab("mailing")}
              className={tab === "mailing" ? "admin-btn-primary text-sm" : "admin-btn-ghost text-sm"}
            >
              Mailing list
            </button>
          </div>
        </AdminToolbar>
      )}

      {tab === "alerts" ? <AlertsTab /> : <MailingListTab />}
    </>
  );
}

function AlertsTab() {
  const [filter, setFilter] = useState("all");
  const load = useCallback(() => adminApi.notifications(), []);
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, []);

  useEffect(() => {
    if (!data?.length) return;
    markNotificationsSeen(data.map((item) => item.id));
  }, [data]);

  const counts = useMemo(() => {
    const list = data ?? [];
    return {
      all: list.length,
      action: list.filter((n) => n.severity === "action").length,
      warning: list.filter((n) => n.severity === "warning").length,
      success: list.filter((n) => n.severity === "success").length,
    };
  }, [data]);

  const shown = useMemo(
    () => (data ?? []).filter((n) => filter === "all" || n.severity === filter),
    [data, filter]
  );

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />

      <div className="flex justify-end mb-4">
        <AdminRefreshButton onClick={reload} loading={refreshing} />
      </div>

      <StatGrid>
        <StatCard icon="notifications" tone="terracotta" label="Alerts" value={counts.all} />
        <StatCard icon="pending_actions" tone="gold" label="Needs action" value={counts.action} />
        <StatCard icon="warning" tone="rose" label="Warnings" value={counts.warning} />
        <StatCard icon="task_alt" tone="chocolate" label="Sold out" value={counts.success} />
      </StatGrid>

      <div className="mb-5">
        <AdminFilter options={FILTERS} value={filter} onChange={setFilter} label="Severity" />
      </div>

      {initialising ? (
        <AdminLoading label="Checking the floor…" />
      ) : shown.length === 0 ? (
        <div className="admin-panel p-12 text-center text-[var(--admin-muted)]">
          <span className="material-symbols-outlined text-[30px] opacity-50 block mb-2">
            notifications_off
          </span>
          {filter === "all"
            ? "Nothing needs your attention. The floor is clear."
            : "Nothing in this category right now."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((item) => {
            const severity = SEVERITY[item.severity] ?? SEVERITY.info;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="admin-panel px-5 py-4 flex items-start gap-4 hover:border-[var(--admin-gold)] transition-colors"
                  style={{ borderLeft: `4px solid ${severity.accent}` }}
                >
                  <span className="admin-icon-btn shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {KIND_ICON[item.kind] ?? severity.icon}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-headline-md text-[16px]">{item.title}</span>
                    <span className="block text-sm text-[var(--admin-muted)] mt-1">
                      {item.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="block font-label-caps text-[9px] tracking-[0.16em] uppercase"
                      style={{ color: severity.accent }}
                    >
                      {severity.label}
                    </span>
                    <span className="block text-xs text-[var(--admin-muted)] mt-1 whitespace-nowrap">
                      {formatRelative(item.at)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-[var(--admin-muted)] mt-6">
        Alerts are computed from live data. The bell badge clears when you open this page.
      </p>
    </>
  );
}

const MAILING_COLUMNS = ["Email", "Name", "Joined"];

function MailingListTab() {
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const load = useCallback(() => adminApi.mailingList({ q: search }), [search]);
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, [search]);
  const rows = data ?? [];

  function exportCsv() {
    const header = "Email,Name,Joined";
    const lines = rows.map((row) => [csvCell(row.email), csvCell(row.name), csvCell(row.created_at)].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mailing-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AdminErrorModal error={error} onRetry={reload} />

      <StatGrid>
        <StatCard icon="mail" tone="rose" label="Subscribers" value={rows.length} />
      </StatGrid>

      <AdminToolbar>
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by email or name" />
        <AdminRefreshButton onClick={reload} loading={refreshing} />
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="admin-btn-primary text-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1">download</span>
          Export CSV
        </button>
      </AdminToolbar>

      {initialising ? (
        <AdminLoading label="Loading subscribers…" />
      ) : (
        <AdminTable columns={MAILING_COLUMNS} minWidth={560}>
          {rows.map((row) => (
            <tr key={row.id} className="admin-table-row">
              <td className="px-5 py-4 font-headline-md text-[15px]">{row.email}</td>
              <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)]">{row.name}</td>
              <td className="px-5 py-4 font-body-md text-sm text-[var(--admin-muted)] whitespace-nowrap">
                {formatDate(row.created_at)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <AdminTableEmpty
              colSpan={MAILING_COLUMNS.length}
              message={query ? "No subscribers match that search." : "No mailing-list signups yet."}
            />
          )}
        </AdminTable>
      )}

      <p className="text-xs text-[var(--admin-muted)] mt-6">
        Collected from the newsletter form in the site footer.
      </p>
    </>
  );
}
