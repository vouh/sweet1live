"use client";

import { useEffect, useState } from "react";
import LuxuryLoader from "@/components/LuxuryLoader";
import { usePathname } from "next/navigation";

// Only show after a short wait so fast navigations stay snappy.
const SLOW_PAGE_MS = 700;

export default function DelayedPublicLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), SLOW_PAGE_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;
  const label = pathname.startsWith("/venue-hire")
    ? "Opening private celebrations"
    : pathname.startsWith("/live-events")
      ? "Finding your next live night"
      : pathname.startsWith("/reservations")
        ? "Getting your table booking ready"
        : pathname.startsWith("/menus")
          ? "Bringing you the menu"
          : pathname.startsWith("/contact")
            ? "Opening our contact details"
            : "Welcome to Sweet1ne Live";
  return <LuxuryLoader variant="fullscreen" label={label} />;
}
