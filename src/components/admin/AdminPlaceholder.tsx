"use client";

import Link from "next/link";

export default function AdminPlaceholder({
  title,
  blurb,
  icon = "construction",
}: {
  title: string;
  blurb: string;
  icon?: string;
}) {
  return (
    <div className="admin-panel max-w-3xl p-8 md:p-10">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-[32px] text-[var(--admin-gold)]">
          {icon}
        </span>
        <div>
          <h2 className="font-headline-lg text-[28px] md:text-[34px] leading-tight">{title}</h2>
          <p className="font-body-md text-[var(--admin-muted)] mt-3 max-w-xl">{blurb}</p>
          <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)] mt-6">
            Staff-only admin view — not the public site
          </p>
          <Link href="/staff-dashboard" className="admin-btn-ghost inline-flex mt-6">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
