"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LuxuryLoader from "@/components/LuxuryLoader";

const SESSION_KEY = "sweet1ne-preload-done";
const MIN_MS = 900;
const MAX_MS = 3200;
const EXIT_MS = 550;

function isAdminPath(pathname: string | null) {
  return Boolean(
    pathname?.startsWith("/staff-dashboard") ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/portal")
  );
}

/** One elegant reveal per session on public pages — replaces jarring spinners. */
export default function SitePreloader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "show" | "exit">("hidden");

  useEffect(() => {
    if (isAdminPath(pathname)) {
      setPhase("hidden");
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem(SESSION_KEY) === "1") {
      setPhase("hidden");
      return;
    }

    setPhase("show");
    const started = performance.now();
    let done = false;

    function finish() {
      if (done) return;
      done = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setPhase("exit");
      window.setTimeout(() => setPhase("hidden"), EXIT_MS);
    }

    function tryFinish() {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(finish, wait);
    }

    if (document.readyState === "complete") {
      tryFinish();
    } else {
      window.addEventListener("load", tryFinish, { once: true });
    }

    const cap = window.setTimeout(finish, MAX_MS);
    return () => {
      window.clearTimeout(cap);
      window.removeEventListener("load", tryFinish);
    };
  }, [pathname]);

  if (phase === "hidden") return null;

  return (
    <div className={phase === "exit" ? "luxury-preloader-exit" : undefined}>
      <LuxuryLoader variant="fullscreen" label="Setting the room" />
    </div>
  );
}
