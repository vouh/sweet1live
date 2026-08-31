"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DEMO_EVENT_ACCENTS, DEMO_EVENT_PHOTOS } from "@/lib/demoEvents";
import { eventPhoto } from "@/lib/images";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
  type VenueEvent,
} from "@/lib/ticketing";

gsap.registerPlugin(ScrollTrigger);

function photoFor(event: VenueEvent) {
  return DEMO_EVENT_PHOTOS[event.slug] ?? eventPhoto(event.slug);
}

function priceLabel(event: VenueEvent) {
  if (event.sold_out) return "Sold out";
  if (event.from_price_pence != null) {
    return `From ${formatPrice(event.from_price_pence, event.currency)}`;
  }
  return "Tickets soon";
}

function EventSplitRow({
  event,
  reverse = false,
  accentIndex = 0,
}: {
  event: VenueEvent;
  reverse?: boolean;
  accentIndex?: number;
}) {
  const rowRef = useRef<HTMLElement>(null);
  const doors = event.doors_at ?? event.starts_at;
  const accent = DEMO_EVENT_ACCENTS[accentIndex % DEMO_EVENT_ACCENTS.length];

  useGSAP(
    () => {
      const row = rowRef.current;
      if (!row) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const panel = row.querySelector(".event-split__text");
      if (!panel) return;

      if (reduce) {
        gsap.set(panel, { opacity: 1, x: 0 });
        return;
      }

      const fromX = reverse ? 56 : -56;
      gsap.set(panel, { opacity: 0, x: fromX });

      gsap.to(panel, {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: row,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: rowRef, dependencies: [event.slug, reverse] }
  );

  return (
    <article
      ref={rowRef}
      className={["event-split", reverse ? "event-split--reverse" : ""].filter(Boolean).join(" ")}
    >
      <div className={`event-split__text ${accent}`}>
        <p className="event-split__eyebrow">{event.subtitle || "Live at Sweet1ne"}</p>
        <h2 className="event-split__title">{event.title}</h2>
        <p className="event-split__meta">
          {formatEventDate(event.starts_at)} · Doors {formatEventTime(doors)}
        </p>
        <p className="event-split__room">{event.room_name}</p>
        {event.description && <p className="event-split__copy">{event.description}</p>}
        <div className="event-split__footer">
          <span className="event-split__price">{priceLabel(event)}</span>
          <Link href={`/live-events/${event.slug}`} className="event-split__cta">
            Book ticket
          </Link>
        </div>
      </div>

      <div
        className="event-split__photo-wrap"
        style={{ backgroundImage: `url('${photoFor(event)}')` }}
      />
    </article>
  );
}

export default function EventsSplitStack({ events }: { events: VenueEvent[] }) {
  return (
    <div className="event-split-stack">
      {events.map((event, index) => (
        <EventSplitRow
          key={event.slug}
          event={event}
          reverse={index % 2 === 1}
          accentIndex={index}
        />
      ))}
    </div>
  );
}
