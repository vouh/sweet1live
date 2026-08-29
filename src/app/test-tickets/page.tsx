import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventTicketLayout from "@/components/EventTicketLayout";
import { getEvent } from "@/lib/ticketing";

/** Seeded by `python -m app.seed` — always-on sandbox for Stripe checkout tests. */
export const DEMO_EVENT_SLUG = "ticket-demo";

export const metadata: Metadata = {
  title: "Test ticketing | Sweet1ne LIVE",
  description: "Stripe checkout sandbox for ticket purchases.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TestTicketsPage() {
  const event = await getEvent(DEMO_EVENT_SLUG);

  if (!event) {
    notFound();
  }

  return <EventTicketLayout event={event} testMode />;
}
