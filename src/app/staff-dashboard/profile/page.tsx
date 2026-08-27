"use client";

import { useEffect, useState } from "react";
import { getStaffSession, type StaffUser } from "@/lib/staffAuth";

export default function AdminProfilePage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);

  useEffect(() => {
    setStaff(getStaffSession());
  }, []);

  return (
    <div className="admin-panel max-w-xl p-8 md:p-10">
      <h2 className="font-headline-lg text-[28px] md:text-[34px] leading-tight">My Profile</h2>
      <p className="font-body-md text-[var(--admin-muted)] mt-3">
        Your staff account details for Sweet1ne Live.
      </p>
      <dl className="mt-8 space-y-5">
        <div>
          <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
            Name
          </dt>
          <dd className="mt-1.5 text-[var(--admin-ink)]">{staff?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
            Email
          </dt>
          <dd className="mt-1.5 text-[var(--admin-ink)]">{staff?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
            Role
          </dt>
          <dd className="mt-1.5 text-[var(--admin-ink)]">{staff?.role ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
