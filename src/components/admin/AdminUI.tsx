"use client";

/**
 * Shared furniture for the staff dashboard pages: page header, stat cards,
 * table shell, status pills, and the loading / empty / error states. Pages
 * compose these so every screen reads the same way.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AdminSelectHeader } from "@/components/admin/AdminTableTools";
import { AdminApiError } from "@/lib/adminApi";

// ---------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------

type Loader<T> = () => Promise<T>;

export type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** True only on the first load — refreshes keep the current data on screen. */
  initialising: boolean;
  /** True while re-fetching with data already on screen (e.g. after Refresh). */
  refreshing: boolean;
  reload: () => void;
};

type ResourceState<T> = { key: string | null; data: T | null; error: string | null };

/**
 * Fetch on mount and whenever `deps` change.
 *
 * `loading` is derived by comparing the deps we last resolved against the deps
 * we have now, rather than being flipped in the effect — so changing a filter
 * shows as loading on the very same render, with no extra pass. Out-of-order
 * responses are dropped, so fast typing in a search box can't leave stale rows
 * on screen.
 *
 * `loader` must be memoised by the caller (useCallback over the same deps).
 */
export function useAdminResource<T>(loader: Loader<T>, deps: unknown[]): Resource<T> {
  const key = JSON.stringify(deps);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({ key: null, data: null, error: null });
  const [fetching, setFetching] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    setFetching(true);
    loader()
      .then((result) => {
        if (ticket !== latest.current) return;
        setState({ key, data: result, error: null });
      })
      .catch((err: unknown) => {
        if (ticket !== latest.current) return;
        const message =
          err instanceof AdminApiError || err instanceof Error
            ? err.message
            : "Something went wrong.";
        setState((current) => ({ key, data: current.data, error: message }));
      })
      .finally(() => {
        if (ticket === latest.current) setFetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const hasData = state.data !== null;
  const settled = state.key === key && !fetching;

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    loading: fetching || state.key !== key,
    initialising: fetching && !hasData,
    refreshing: fetching && hasData,
    reload,
  };
}

/** Debounce a search box so we don't fire a request per keystroke. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------

export function AdminPageHeader({
  title,
  blurb,
  actions,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  blurb?: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const trailing = (onRefresh || actions) && (
    <div className="flex flex-wrap items-center gap-3 shrink-0">
      {onRefresh && <AdminRefreshButton onClick={onRefresh} loading={refreshing} />}
      {actions}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
      <div className="min-w-0">
        <h2 className="font-headline-lg text-[28px] md:text-[36px] leading-tight">{title}</h2>
        {blurb && <p className="font-body-md text-[var(--admin-muted)] mt-2 max-w-2xl">{blurb}</p>}
      </div>
      {trailing}
    </div>
  );
}

export type StatTone = "terracotta" | "gold" | "chocolate" | "rose";

export function StatCard({
  label,
  value,
  meta,
  icon,
  tone = "chocolate",
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  icon: string;
  tone?: StatTone;
}) {
  return (
    <article className={`admin-kpi admin-kpi--${tone}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="material-symbols-outlined text-[22px] opacity-80">{icon}</span>
        <p className="font-display-lg text-[34px] leading-none">{value}</p>
      </div>
      <h3 className="font-label-caps text-[10px] tracking-[0.2em] uppercase opacity-70">{label}</h3>
      {meta && <p className="font-body-md text-sm mt-1 opacity-60">{meta}</p>}
    </article>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">{children}</div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex-1 min-w-[220px] relative">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-muted)] text-[20px] pointer-events-none">
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="admin-input"
      />
    </div>
  );
}

export function AdminRefreshButton({
  onClick,
  loading = false,
  label = "Refresh",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      aria-label={loading ? "Refreshing…" : label}
      className="admin-refresh-btn shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span
        className={`material-symbols-outlined admin-refresh-btn__icon ${loading ? "admin-refresh-btn__icon--spin" : ""}`}
        aria-hidden
      >
        refresh
      </span>
      <span className="admin-refresh-btn__label">{label}</span>
    </button>
  );
}

export function AdminFilter({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="admin-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            value === option.value ? "admin-seg__btn admin-seg__btn--on" : "admin-seg__btn"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">{children}</div>;
}

// ---------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------

export function AdminTable({
  columns,
  minWidth = 820,
  children,
  selectable = false,
  allSelected = false,
  someSelected = false,
  onToggleAll,
}: {
  columns: string[];
  minWidth?: number;
  children: ReactNode;
  selectable?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: () => void;
}) {
  return (
    <div className="admin-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth }}>
          <thead>
            <tr className="admin-table-head">
              {selectable && (
                <th className="px-5 py-4 w-12">
                  <AdminSelectHeader
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={() => onToggleAll?.()}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-4 font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-[var(--admin-muted)]">
        <span className="material-symbols-outlined text-[28px] opacity-50 block mb-2">
          inbox
        </span>
        {message}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------
// Status pills
// ---------------------------------------------------------------------

export type BadgeTone = "positive" | "pending" | "neutral" | "negative" | "accent";

const BADGE_TONE: Record<BadgeTone, string> = {
  positive: "bg-emerald-500/15 text-emerald-700 border-emerald-600/25 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-800 border-amber-600/25 dark:text-amber-200",
  neutral: "bg-[var(--admin-ink)]/10 text-[var(--admin-ink)] border-[var(--admin-ink)]/20",
  negative: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
  accent:
    "bg-[var(--admin-accent)]/12 text-[var(--admin-accent)] border-[var(--admin-accent)]/30",
};

/** How each backend status word should read on screen. */
const STATUS_TONES: Record<string, BadgeTone> = {
  paid: "positive",
  confirmed: "positive",
  published: "positive",
  seated: "neutral",
  completed: "neutral",
  valid: "positive",
  checked_in: "neutral",
  pending: "pending",
  pending_payment: "pending",
  draft: "pending",
  cancelled: "negative",
  expired: "negative",
  refunded: "negative",
  void: "negative",
};

export function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status] ?? "neutral";
}

export function StatusBadge({ status, tone }: { status: string; tone?: BadgeTone }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 font-label-caps text-[9px] tracking-[0.16em] uppercase whitespace-nowrap ${
        BADGE_TONE[tone ?? statusTone(status)]
      }`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------
// States
// ---------------------------------------------------------------------

export function AdminLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="admin-panel p-12 flex flex-col items-center justify-center text-[var(--admin-muted)]">
      <span className="material-symbols-outlined text-[28px] animate-spin mb-3">progress_activity</span>
      <p className="font-body-md">{label}</p>
    </div>
  );
}

/** True/false, kept live via the browser's online/offline events. */
function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

/** Best-guess next step, based on the browser's connectivity and the error text. */
function errorSuggestion(message: string, online: boolean): string {
  if (!online) {
    return "You appear to be offline. Check your connection, then retry.";
  }
  const text = message.toLowerCase();
  if (
    text.includes("fetch") ||
    text.includes("network") ||
    text.includes("connect") ||
    text.includes("timeout")
  ) {
    return "The server didn't respond. If you're running locally, check the backend is up with npm run backend, then retry.";
  }
  if (text.includes("401") || text.includes("unauthorized") || text.includes("session")) {
    return "Your session may have expired. Try signing in again.";
  }
  if (text.includes("500") || text.includes("database")) {
    return "The database might be unreachable right now. Wait a moment and retry — tell someone if it keeps happening.";
  }
  return "This might be a one-off. Try again, or refresh the page if it keeps happening.";
}

/**
 * Blocking dialog for a failed data load. Sits on top of whatever the page
 * already has on screen (stale data, an empty table shell, a loading card)
 * instead of replacing it, so a background refresh failure doesn't wipe out
 * data the guest can still see.
 */
export function AdminErrorModal({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Once an error clears, forget it was dismissed — so if the same message
  // comes back later it isn't silently swallowed. Adjusting state during
  // render (rather than in an effect) avoids an extra render pass.
  const [prevError, setPrevError] = useState(error);
  if (prevError !== error) {
    setPrevError(error);
    if (error === null && dismissed !== null) setDismissed(null);
  }

  if (!error || dismissed === error) return null;

  function retry() {
    setDismissed(null);
    onRetry();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#1a100c]/60"
      onClick={() => setDismissed(error)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-error-modal-title"
        className="admin-panel max-w-md w-full p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px] text-[var(--admin-accent)]">
            {online ? "error" : "wifi_off"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="admin-error-modal-title" className="font-headline-md text-[20px]">
              Couldn&apos;t load this page
            </h3>
            <p className="font-body-md text-[var(--admin-muted)] mt-2">{error}</p>
            <p className="font-body-md text-sm text-[var(--admin-muted)] mt-2">
              {errorSuggestion(error, online)}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button type="button" onClick={retry} className="admin-btn-primary">
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="admin-btn-ghost"
              >
                Refresh page
              </button>
              <button
                type="button"
                onClick={() => setDismissed(error)}
                className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminEmpty({
  icon,
  title,
  blurb,
}: {
  icon: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="admin-panel p-12 flex flex-col items-center text-center">
      <span className="material-symbols-outlined text-[32px] text-[var(--admin-gold)] mb-3">
        {icon}
      </span>
      <h3 className="font-headline-md text-[20px]">{title}</h3>
      <p className="font-body-md text-[var(--admin-muted)] mt-2 max-w-md">{blurb}</p>
    </div>
  );
}

/** Inline banner for a failed write — the page keeps its data, the action didn't land. */
export function AdminNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="admin-panel border-l-4 border-l-[var(--admin-accent)] px-5 py-4 mb-5 flex items-start justify-between gap-4">
      <p className="font-body-md text-sm">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

/** Status dropdown used in row actions. Disabled while its write is in flight. */
export function StatusSelect({
  value,
  options,
  onChange,
  busy,
  label,
}: {
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
  busy?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      className="admin-select"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
