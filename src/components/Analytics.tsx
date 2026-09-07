"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

const CONSENT_COOKIE = "sweet1ne_cookie_consent";
const CONSENT_EVENT = "sweet1ne:open-cookie-settings";
type Consent = "accepted" | "essential" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

function readConsent(): Consent {
  const value = document.cookie.split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE}=`))?.split("=")[1];
  return value === "accepted" || value === "essential" ? value : null;
}

function saveConsent(value: Exclude<Consent, null>) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function isInternalPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/staff-dashboard") || pathname.startsWith("/portal");
}

export default function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const initialPath = useRef(pathname);
  const internal = isInternalPath(pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setConsent(readConsent());
      setReady(true);
    });
    const openSettings = () => setConsent(null);
    window.addEventListener(CONSENT_EVENT, openSettings);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(CONSENT_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (consent !== "accepted" || internal || pathname === initialPath.current) return;
    window.dataLayer?.push({ event: "virtual_page_view", page_path: pathname });
    window.fbq?.("track", "PageView");
  }, [consent, internal, pathname]);

  function choose(value: Exclude<Consent, null>) {
    const trackingWasActive = readConsent() === "accepted";
    saveConsent(value);
    if (value === "essential" && trackingWasActive) {
      window.location.reload();
      return;
    }
    setConsent(value);
    if (value === "accepted") window.dispatchEvent(new Event("sweet1ne:tracking-consent"));
  }

  if (internal) return null;

  return (
    <>
      {consent === "accepted" && GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
          `}</Script>
        </>
      )}

      {ready && consent === null && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
          className="fixed left-3 bottom-3 z-[120] w-[min(20.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#d4a574]/35 bg-[#1a100c] text-[#f5efe8] shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:left-5 sm:bottom-5"
        >
          <div className="flex flex-col gap-3 p-4">
            <div>
              <p className="font-label-caps text-[9px] uppercase tracking-[0.24em] text-[#d4a574]">Your privacy</p>
              <h2 id="cookie-consent-title" className="mt-1 font-headline-md text-[16px] leading-tight">
                Cookies at Sweet1ne Live
              </h2>
              <p className="mt-1.5 text-[12px] leading-5 text-[#f5efe8]/70">
                Essential cookies run the site. With permission, Google and Meta help us understand visits and advertising.
              </p>
              <Link href="/cookie-policy" className="mt-1.5 inline-block text-[11px] text-[#d4a574] underline underline-offset-4">
                Read our cookie policy
              </Link>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="flex-1 rounded-md bg-[#d8b632] px-3 py-2 font-label-caps text-[9px] font-semibold uppercase tracking-[0.14em] text-[#231b00]"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => choose("essential")}
                className="flex-1 rounded-md border border-[#f5efe8]/25 px-3 py-2 font-label-caps text-[9px] uppercase tracking-[0.14em] text-[#f5efe8]"
              >
                Essential only
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
