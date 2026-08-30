"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Order } from "@/lib/ticketing";

/** Fires GA4 purchase/reservation conversion once per paid order render. */
export default function CheckoutAnalytics({ order }: { order: Order }) {
  useEffect(() => {
    if (order.status !== "paid") return;
    trackEvent("purchase", {
      kind: order.kind,
      value: order.subtotal_pence / 100,
      currency: order.currency.toUpperCase(),
      reference: order.reference,
    });
  }, [order]);

  return null;
}
