"use client";

import { useEffect, useState } from "react";
import LuxuryLoader from "@/components/LuxuryLoader";

// Normal page changes should feel immediate. Only surface loading UI when a
// request is genuinely slow enough that an otherwise blank screen is worse.
const SLOW_PAGE_MS = 2200;

export default function DelayedPublicLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SLOW_PAGE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <LuxuryLoader variant="fullscreen" label="Still setting the room" />;
}
