"use client";

import { useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import type { AdminOrderRow } from "@/lib/adminApi";

export default function FinanceCharts({ orders, currency }: { orders: AdminOrderRow[]; currency: string }) {
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const mixRef = useRef<HTMLCanvasElement>(null);
  const series = useMemo(() => {
    const byDay = new Map<string, number>();
    const byKind = new Map<string, number>();
    for (const order of orders) {
      const day = (order.paid_at ?? order.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + order.subtotal_pence / 100);
      const label = order.kind === "food_collection" ? "Collection" : order.kind === "room_deposit" ? "Hire deposits" : "Tickets";
      byKind.set(label, (byKind.get(label) ?? 0) + order.subtotal_pence / 100);
    }
    return { daily: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)), kinds: [...byKind.entries()] };
  }, [orders]);

  useEffect(() => {
    if (!revenueRef.current || !mixRef.current) return;
    const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() });
    const common = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#8f8178" } }, tooltip: { callbacks: { label: (item: { raw: unknown }) => money.format(Number(item.raw)) } } } };
    const revenue = new Chart(revenueRef.current, { type: "line", data: { labels: series.daily.map(([day]) => day), datasets: [{ label: "Order value", data: series.daily.map(([, value]) => value), borderColor: "#c45c3a", backgroundColor: "rgba(196,92,58,.15)", fill: true, tension: .3 }] }, options: { ...common, scales: { x: { ticks: { color: "#8f8178" }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: "#8f8178", callback: (value) => money.format(Number(value)) } } } } });
    const mix = new Chart(mixRef.current, { type: "doughnut", data: { labels: series.kinds.map(([kind]) => kind), datasets: [{ data: series.kinds.map(([, value]) => value), backgroundColor: ["#c45c3a", "#d8b632", "#6f4e37"], borderWidth: 0 }] }, options: common });
    return () => { revenue.destroy(); mix.destroy(); };
  }, [currency, series]);

  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
    <section className="admin-panel p-5 lg:col-span-2"><h3 className="font-headline-md text-[18px]">Revenue over time</h3><p className="text-xs text-[var(--admin-muted)] mt-1 mb-4">Updates with the filters above.</p><div className="h-72"><canvas ref={revenueRef} /></div></section>
    <section className="admin-panel p-5"><h3 className="font-headline-md text-[18px]">Revenue mix</h3><p className="text-xs text-[var(--admin-muted)] mt-1 mb-4">By order type.</p><div className="h-72"><canvas ref={mixRef} /></div></section>
  </div>;
}
