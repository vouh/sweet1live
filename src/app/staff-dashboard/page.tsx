"use client";

import Link from "next/link";
import { useState } from "react";

type Guest = {
  name: string;
  email: string;
  phone: string;
  party: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Seated" | "Cancelled";
};

const GUESTS: Guest[] = [
  {
    name: "Amelia Hart",
    email: "amelia.h@email.com",
    phone: "+44 7700 900121",
    party: "2",
    date: "27 Aug",
    time: "20:00",
    status: "Confirmed",
  },
  {
    name: "James Okonkwo",
    email: "james.o@email.com",
    phone: "+44 7700 900214",
    party: "4",
    date: "27 Aug",
    time: "20:30",
    status: "Pending",
  },
  {
    name: "Sofia Mendes",
    email: "sofia.m@email.com",
    phone: "+44 7700 900338",
    party: "6",
    date: "28 Aug",
    time: "19:30",
    status: "Confirmed",
  },
  {
    name: "Noah Patel",
    email: "noah.p@email.com",
    phone: "+44 7700 900451",
    party: "2",
    date: "28 Aug",
    time: "21:00",
    status: "Seated",
  },
  {
    name: "Elena Rossi",
    email: "elena.r@email.com",
    phone: "+44 7700 900562",
    party: "3",
    date: "29 Aug",
    time: "20:00",
    status: "Cancelled",
  },
];

const KPIS = [
  {
    title: "Reservations Tonight",
    icon: "event_seat",
    value: "42",
    meta: "+12% vs last Fri",
    tone: "terracotta",
  },
  {
    title: "Events (7 days)",
    icon: "mic",
    value: "5",
    meta: "2 sold out",
    tone: "gold",
  },
  {
    title: "Collection Orders",
    icon: "shopping_basket",
    value: "18",
    meta: "4 pending",
    tone: "chocolate",
  },
  {
    title: "Open Enquiries",
    icon: "mail",
    value: "7",
    meta: "Needs action",
    tone: "rose",
  },
] as const;

const STATUS_STYLE: Record<Guest["status"], string> = {
  Confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-600/25 dark:text-emerald-300",
  Pending: "bg-amber-500/15 text-amber-800 border-amber-600/25 dark:text-amber-200",
  Seated: "bg-[var(--admin-ink)]/10 text-[var(--admin-ink)] border-[var(--admin-ink)]/20",
  Cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
};

const KPI_TONE: Record<(typeof KPIS)[number]["tone"], string> = {
  terracotta: "admin-kpi--terracotta",
  gold: "admin-kpi--gold",
  chocolate: "admin-kpi--chocolate",
  rose: "admin-kpi--rose",
};

export default function StaffDashboardPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");

  const filtered = GUESTS.filter((g) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-[28px] md:text-[36px] leading-tight">
            Guest Management
          </h2>
          <p className="font-body-md text-[var(--admin-muted)] mt-2 max-w-xl">
            Search tonight&apos;s book, confirm covers, and keep the floor moving.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="admin-seg" role="group" aria-label="View mode">
            <button
              type="button"
              className={view === "cards" ? "admin-seg__btn admin-seg__btn--on" : "admin-seg__btn"}
              onClick={() => setView("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              className={view === "table" ? "admin-seg__btn admin-seg__btn--on" : "admin-seg__btn"}
              onClick={() => setView("table")}
            >
              Table
            </button>
          </div>
          <Link href="/staff-dashboard/reservations" className="admin-btn-primary">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            New reservation
          </Link>
        </div>
      </div>

      {view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {KPIS.map((kpi) => (
            <article key={kpi.title} className={`admin-kpi ${KPI_TONE[kpi.tone]}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="material-symbols-outlined text-[22px] opacity-80">{kpi.icon}</span>
                <p className="font-display-lg text-[34px] leading-none">{kpi.value}</p>
              </div>
              <h3 className="font-label-caps text-[10px] tracking-[0.2em] uppercase opacity-70">
                {kpi.title}
              </h3>
              <p className="font-body-md text-sm mt-1 opacity-60">{kpi.meta}</p>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-muted)] text-[20px]">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests by name, email, or phone"
            className="admin-input"
          />
        </div>
        <button type="button" className="admin-btn-ink">
          Search
        </button>
        <button type="button" className="admin-btn-ghost">
          Export CSV
        </button>
      </div>

      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="admin-table-head">
                {["Name", "Phone", "Party", "Date", "Time", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.email} className="admin-table-row">
                  <td className="px-5 py-4">
                    <p className="font-headline-md text-[16px]">{g.name}</p>
                    <p className="text-sm text-[var(--admin-muted)] mt-0.5">{g.email}</p>
                  </td>
                  <td className="px-5 py-4 font-body-md text-sm opacity-80">{g.phone}</td>
                  <td className="px-5 py-4 font-body-md text-sm">{g.party}</td>
                  <td className="px-5 py-4 font-body-md text-sm">{g.date}</td>
                  <td className="px-5 py-4 numeral font-body-md text-sm">{g.time}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 font-label-caps text-[9px] tracking-[0.16em] uppercase ${STATUS_STYLE[g.status]}`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`View ${g.name}`}
                        className="admin-icon-btn"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <Link
                        href="/staff-dashboard/reservations"
                        aria-label={`Edit booking for ${g.name}`}
                        className="admin-icon-btn admin-icon-btn--accent"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--admin-muted)]">
                    No guests match that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
