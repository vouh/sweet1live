"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AdminErrorModal,
  AdminFilter,
  AdminLoading,
  AdminPageHeader,
  StatCard,
  StatGrid,
  useAdminResource,
} from "@/components/admin/AdminUI";
import { adminApi, formatRelative, type AdminNotification } from "@/lib/adminApi";

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

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState("all");
  const load = useCallback(() => adminApi.notifications(), []);
  const { data, error, initialising, reload, refreshing } = useAdminResource(load, []);

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
      <AdminPageHeader title="Notifications" onRefresh={reload} refreshing={refreshing} />

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
        These alerts are computed from the live tables each time you open the page — there is no
        read/unread state to keep in sync.
      </p>
    </>
  );
}
