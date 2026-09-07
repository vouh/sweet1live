"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Magnetic from "@/components/motion/Magnetic";
import { DEMO_EVENT_ACCENTS, DEMO_EVENT_PHOTOS } from "@/lib/demoEvents";
import { eventPhoto } from "@/lib/images";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
  type VenueEvent,
} from "@/lib/ticketing";

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

/**
 * Homepage events stage — one act at a time, chocolate/image split,
 * arrow-driven with a wipe + clip transition.
 */
export default function HomeEventsSwap({ events }: { events: VenueEvent[] }) {
  const photoRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);

  const total = events.length;
  const event = events[displayIndex] ?? events[0];
  const accent = DEMO_EVENT_ACCENTS[displayIndex % DEMO_EVENT_ACCENTS.length];

  const goTo = useCallback(
    (next: number, direction: 1 | -1) => {
      if (busyRef.current || total < 2) return;
      const target = ((next % total) + total) % total;
      if (target === displayIndex) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setIndex(target);
        setDisplayIndex(target);
        return;
      }

      const photo = photoRef.current;
      const shade = shadeRef.current;
      const copy = copyRef.current;
      if (!photo || !shade || !copy) return;

      busyRef.current = true;
      const originX = direction > 0 ? "0% 50%" : "100% 50%";

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          busyRef.current = false;
        },
      });

      tl.to(
        copy,
        {
          opacity: 0,
          y: direction * 18,
          duration: 0.35,
          ease: "power2.in",
        },
        0
      )
        .to(
          shade,
          {
            scaleX: 1,
            transformOrigin: originX,
            duration: 0.55,
          },
          0.05
        )
        .to(
          photo,
          {
            scale: 1.08,
            duration: 0.55,
            ease: "power2.in",
          },
          0.05
        )
        .add(() => {
          setDisplayIndex(target);
          setIndex(target);
        })
        .set(copy, { y: direction * -22, opacity: 0 })
        .set(photo, { scale: 1.1 })
        .to(
          shade,
          {
            scaleX: 0,
            transformOrigin: direction > 0 ? "100% 50%" : "0% 50%",
            duration: 0.65,
            ease: "power3.out",
          },
          "+=0.02"
        )
        .to(
          photo,
          {
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
          },
          "<"
        )
        .to(
          copy,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
          },
          "-=0.35"
        );
    },
    [displayIndex, total]
  );

  useEffect(() => {
    const shade = shadeRef.current;
    if (shade) gsap.set(shade, { scaleX: 0, transformOrigin: "0% 50%" });
  }, []);

  if (!event) return null;

  const doors = event.doors_at ?? event.starts_at;
  const reverse = displayIndex % 2 === 1;

  return (
    <section
      className="home-events-swap relative z-10"
      aria-roledescription="carousel"
      aria-label="Upcoming live events"
    >
      <div className="home-events-swap__frame">
        <div
          className={`home-events-swap__panel ${accent} ${
            reverse ? "home-events-swap__panel--right" : ""
          }`}
        >
          <div ref={copyRef} className="home-events-swap__copy">
            <div className="home-events-swap__top">
              <p className="home-events-swap__eyebrow">
                {displayIndex === 0 && event.is_top_event ? "Top event" : "What's on"}
              </p>
              <div className="home-events-swap__pager" aria-hidden>
                <span className="numeral">
                  {String(displayIndex + 1).padStart(2, "0")}
                </span>
                <span className="home-events-swap__pager-sep">/</span>
                <span className="numeral">{String(total).padStart(2, "0")}</span>
              </div>
            </div>

            <p className="home-events-swap__subtitle">
              {event.subtitle || "Live at Sweet1ne"}
            </p>
            <h2 className="home-events-swap__title">{event.title}</h2>
            <p className="home-events-swap__meta">
              {formatEventDate(event.starts_at)} · Doors {formatEventTime(doors)}
            </p>
            <p className="home-events-swap__room">{event.room_name}</p>
            {event.description && (
              <p className="home-events-swap__body">{event.description}</p>
            )}

            <div className="home-events-swap__footer">
              <span className="home-events-swap__price">{priceLabel(event)}</span>
              <Magnetic>
                <Link href={`/live-events/${event.slug}`} className="home-events-swap__cta">
                  Book ticket
                  <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>

        <div
          className={`home-events-swap__media ${
            reverse ? "home-events-swap__media--left" : ""
          }`}
        >
          <div
            ref={photoRef}
            className="home-events-swap__photo"
            style={{ backgroundImage: `url('${photoFor(event)}')` }}
            role="img"
            aria-label={event.title}
          />
          <div ref={shadeRef} className="home-events-swap__shade" aria-hidden />
        </div>
        <div className="home-events-swap__arrows">
          <button
            type="button"
            className="home-events-swap__arrow"
            aria-label="Previous event"
            disabled={total < 2}
            onClick={() => goTo(index - 1, -1)}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button
            type="button"
            className="home-events-swap__arrow"
            aria-label="Next event"
            disabled={total < 2}
            onClick={() => goTo(index + 1, 1)}
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

      </div>

      <div className="home-events-swap__controls">
        <div className="home-events-swap__dots" role="tablist" aria-label="Choose event">
          {events.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === displayIndex}
              aria-label={`${item.title}`}
              className={`home-events-swap__dot ${
                i === displayIndex ? "home-events-swap__dot--active" : ""
              }`}
              onClick={() => goTo(i, i > displayIndex ? 1 : -1)}
            />
          ))}
        </div>

        <Link href="/live-events" className="home-events-swap__all">
          All events
          <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
        </Link>
      </div>
    </section>
  );
}
