"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function isAdminPath(pathname: string | null) {
  return Boolean(
    pathname?.startsWith("/staff-dashboard") ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/portal")
  );
}

/**
 * Soft cross-fade between public routes — CSS-only to avoid motion/Turbopack issues.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAdminPath(pathname)) {
    return <div className="min-h-screen flex flex-col flex-grow">{children}</div>;
  }

  return (
    <div key={pathname} className="page-transition min-h-screen flex flex-col flex-grow">
      {children}
    </div>
  );
}
