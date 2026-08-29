"use client";

/**
 * Shared furniture for the staff dashboard pages: page header, stat cards,
 * table shell, status pills, and the loading / empty / error states. Pages
 * compose these so every screen reads the same way.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
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
        // Keep whatever is on screen; the page decides whether to show the error.
        setState((current) => ({ key, data: current.data, error: message }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const settled = state.key === key;
  return {
    data: state.data,
    // An error from an earlier set of filters isn't this view's error.
    error: settled ? state.error : null,
    loading: !settled,
    initialising: !settled && state.data === null,
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
}: {
  title: string;
  blurb: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
      <div>
        <h2 className="font-headline-lg text-[28px] md:text-[36px] leading-tight">{title}</h2>
        <p className="font-body-md text-[var(--admin-muted)] mt-2 max-w-2xl">{blurb}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
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
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-muted)] text-[20px]">
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-input"
      />
    </div>
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
}: {
  columns: string[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="admin-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth }}>
          <thead>
            <tr className="admin-table-head">
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

export function AdminError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="admin-panel p-8 md:p-10 max-w-2xl">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-[28px] text-[var(--admin-accent)]">
          error
        </span>
        <div>
          <h3 className="font-headline-md text-[20px]">Couldn&apos;t load this page</h3>
          <p className="font-body-md text-[var(--admin-muted)] mt-2">{message}</p>
          <p className="font-body-md text-sm text-[var(--admin-muted)] mt-2">
            The dashboard reads live data from the API. If you&apos;re running locally, check the
            backend is up with <code>npm run backend</code>.
          </p>
          <button type="button" onClick={onRetry} className="admin-btn-ghost mt-6">
            Try again
          </button>
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
