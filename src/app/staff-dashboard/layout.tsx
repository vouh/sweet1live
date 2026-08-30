"use client";

import AdminShell from "@/components/admin/AdminShell";

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root h-dvh overflow-hidden">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
