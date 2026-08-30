"use client";

import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

/** Staff portal shell — same layout as the super-admin dashboard, filtered by role permissions. */
export default function StaffShell({ children }: { children: ReactNode }) {
  return (
    <AdminShell basePath="/portal" superAdminOnly={false}>
      {children}
    </AdminShell>
  );
}
