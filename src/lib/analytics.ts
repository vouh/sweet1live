/**
 * Lightweight analytics — GA4 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * Conversion helpers fire on completed customer journeys only.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "reservation_submitted"
  | "venue_enquiry_submitted"
  | "contact_submitted"
  | "ticket_checkout_started"
  | "collection_checkout_started"
  | "purchase";

export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
