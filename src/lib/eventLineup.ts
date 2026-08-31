import type { VenueEvent } from "@/lib/ticketing";

/** Headline act for the live-events page — pinned in admin, else next upcoming. */
export function pickTopEvent(events: VenueEvent[]): VenueEvent | null {
  if (events.length === 0) return null;
  return events.find((event) => event.is_top_event) ?? events[0];
}

export function lineupWithoutTop(events: VenueEvent[], top: VenueEvent | null): VenueEvent[] {
  if (!top) return events;
  return events.filter((event) => event.slug !== top.slug);
}
