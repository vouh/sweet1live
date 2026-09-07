"use client";

import { useEffect, useState } from "react";
import LuxuryLoader from "@/components/LuxuryLoader";
import { usePathname } from "next/navigation";

// Normal page changes should feel immediate. Only surface loading UI when a
// request is genuinely slow enough that an otherwise blank screen is worse.
const SLOW_PAGE_MS = 2200;

export default function DelayedPublicLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SLOW_PAGE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  const label = pathname.startsWith("/venue-hire") ? "Opening private celebrations"
    : pathname.startsWith("/live-events") ? "Finding your next live night"
    : pathname.startsWith("/reservations") ? "Getting your table booking ready"
    : pathname.startsWith("/menus") ? "Bringing you the menu"
    : pathname.startsWith("/contact") ? "Opening our contact details"
    : "Welcome to Sweet1ne Live";
  return <LuxuryLoader variant="fullscreen" label={label} />;
}
