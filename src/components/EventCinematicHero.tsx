"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Magnetic from "@/components/motion/Magnetic";
import { DEMO_EVENT_PHOTOS } from "@/lib/demoEvents";
import { eventPhoto } from "@/lib/images";
import {
  eventEyebrow,
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

/** Pinned cinematic opener — full image under the nav, halves unite on scroll. */
export default function EventCinematicHero({ event }: { event: VenueEvent }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imageSrc = photoFor(event);
  const doors = event.doors_at ?? event.starts_at;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const q = gsap.utils.selector(root);

      if (reduce) {
        gsap.set(q(".cine-hero-copy"), { opacity: 0 });
        gsap.set(q(".cine-assemble"), { autoAlpha: 1 });
        gsap.set(q(".cine-side-left, .cine-side-right"), { x: 0, xPercent: 0, yPercent: 0 });
        gsap.set(q(".cine-seam, .cine-link"), { scaleY: 1, scaleX: 1, opacity: 1 });
        return;
      }

      const mobile = window.matchMedia("(max-width: 767px)").matches;

      gsap.set(q(".cine-assemble"), { autoAlpha: 0 });
      if (mobile) {
        gsap.set(q(".cine-side-left"), { yPercent: -55, x: 0 });
        gsap.set(q(".cine-side-right"), { yPercent: 55, x: 0 });
      } else {
        gsap.set(q(".cine-side-left"), { xPercent: -42, x: 0 });
        gsap.set(q(".cine-side-right"), { xPercent: 42, x: 0 });
      }
      gsap.set(q(".cine-seam"), { scaleY: 0, opacity: 0, transformOrigin: "center center" });
      gsap.set(q(".cine-link"), { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      gsap.set(q(".cine-hero-media"), { scale: 1.06 });
      gsap.set(q(".cine-veil"), { opacity: 0.35 });
      gsap.set(q(".cine-hero-copy"), { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * (mobile ? 2.1 : 2.35))}`,
          pin: true,
          scrub: mobile ? 0.9 : 1.05,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          pinType: "fixed",
        },
      });

      tl.to({}, { duration: 0.22 });
      tl.to(q(".cine-hero-media"), { scale: 1.12, duration: 0.12 }, 0.18);
      tl.to(q(".cine-veil"), { opacity: 0.62, duration: 0.12 }, 0.18);
      tl.to(q(".cine-hero-copy"), { opacity: 0, y: -28, filter: "blur(5px)", duration: 0.12 }, 0.2);
      tl.to(q(".cine-assemble"), { autoAlpha: 1, duration: 0.04 }, 0.24);
      tl.to(q(".cine-side-left"), { xPercent: 0, yPercent: 0, x: 0, duration: 0.58 }, 0.27);
      tl.to(q(".cine-side-right"), { xPercent: 0, yPercent: 0, x: 0, duration: 0.58 }, 0.27);
      tl.to(q(".cine-seam"), { scaleY: 1, opacity: 1, duration: 0.14 }, 0.78);
      tl.to(q(".cine-link"), { scaleX: 1, opacity: 1, duration: 0.12, stagger: 0.03 }, 0.84);

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: rootRef, dependencies: [event.slug, imageSrc] }
  );

  return (
    <div ref={rootRef} className="cinematic-scroll-stage relative z-10 w-full max-w-full overflow-hidden">
      <div className="cinematic-scroll-stage__pin relative h-[100svh] w-full max-w-full overflow-hidden bg-[#131313]">
        <div
          className="cine-hero-media absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url('${imageSrc}')` }}
        />
        <div className="cine-veil absolute inset-0 events-flat-veil" aria-hidden="true" />

        <div className="cine-hero-copy absolute inset-0 z-10 flex flex-col items-center justify-center px-margin-mobile pt-24 text-center md:px-gutter md:pt-28">
          <p className="font-label-caps mb-4 text-[10px] uppercase tracking-[0.34em] text-[#d8b632]">
            Top event
          </p>
          <h1 className="font-headline-lg max-w-[12ch] text-[clamp(2.5rem,9vw,6.5rem)] uppercase leading-[0.92] tracking-[0.02em] text-[#f7f3ea] drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
            {event.title}
          </h1>
          <p className="font-body-md mx-auto mt-5 max-w-lg text-[16px] text-[#cfc6af] md:text-[18px]">
            {eventEyebrow(event)} · {formatEventDate(event.starts_at)}
          </p>
        </div>

        <div
          className="cine-assemble absolute inset-0 z-20 overflow-hidden pointer-events-none"
          style={{ visibility: "hidden", opacity: 0 }}
        >
          <div className="relative flex h-full w-full flex-col gap-0 md:flex-row pointer-events-auto">
            <section className="cine-side-left event-split__panel--chocolate relative z-[1] flex h-[48%] w-full flex-col md:h-full md:w-1/2 will-change-transform">
              <div className="relative flex min-h-0 flex-1 flex-col justify-center px-5 pb-6 pt-[7.25rem] md:px-7 md:pb-10 md:pt-[8.25rem] lg:px-9">
                <div className="cine-image-stage relative mx-auto w-full max-w-[min(100%,520px)]">
                  <div className="pointer-events-none absolute -inset-3 md:-inset-4" aria-hidden="true">
                    <span className="absolute left-0 top-0 h-10 w-px bg-[#d8b632]/45" />
                    <span className="absolute left-0 top-0 h-px w-10 bg-[#d8b632]/45" />
                    <span className="absolute right-0 top-0 h-10 w-px bg-[#d8b632]/45" />
                    <span className="absolute right-0 top-0 h-px w-10 bg-[#d8b632]/45" />
                    <span className="absolute bottom-0 left-0 h-10 w-px bg-[#d8b632]/45" />
                    <span className="absolute bottom-0 left-0 h-px w-10 bg-[#d8b632]/45" />
                    <span className="absolute bottom-0 right-0 h-10 w-px bg-[#d8b632]/45" />
                    <span className="absolute bottom-0 right-0 h-px w-10 bg-[#d8b632]/45" />
                  </div>
                  <div
                    className="cine-image-frame relative aspect-[3/4] w-full max-h-[min(76vh,640px)] overflow-hidden bg-cover bg-center shadow-[0_28px_64px_-24px_rgba(0,0,0,0.55)]"
                    style={{ backgroundImage: `url('${imageSrc}')` }}
                  >
                    <div className="absolute inset-3 border border-[#f7f3ea]/14" aria-hidden="true" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <span className="font-label-caps text-[10px] uppercase tracking-[0.32em] text-[#f7f3ea]/65">
                        {event.venue_name || event.room_name}
                      </span>
                      <span className="h-px flex-1 bg-[#f7f3ea]/20" aria-hidden="true" />
                      <span className="font-label-caps text-[10px] uppercase tracking-[0.32em] text-[#d8b632]/90">
                        Top event
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div
              className="cine-seam absolute left-1/2 top-[7.25rem] bottom-8 z-[3] hidden w-px -translate-x-1/2 bg-[#d8b632]/30 md:top-[8.25rem] md:block"
              aria-hidden="true"
            />

            <section className="cine-side-right event-split__panel--chocolate-warm relative z-[1] flex h-[52%] w-full flex-col overflow-hidden md:h-full md:w-1/2 will-change-transform">
              <div className="cine-link absolute left-0 right-0 top-0 z-[2] hidden h-px origin-left bg-[#d8b632]/35 md:block" />
              <div className="relative flex min-h-0 flex-1 flex-col justify-center px-margin-mobile py-8 pt-[7.25rem] md:px-gutter md:py-10 md:pt-[8.25rem]">
                <div className="relative mx-auto w-full max-w-lg md:mx-0 text-[#f7f3ea]">
                  <div className="mb-5 flex items-center gap-4">
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.38em] text-[#cfc6af]">
                      {eventEyebrow(event)}
                    </span>
                    <span className="h-px flex-1 bg-[#d8b632]/20" aria-hidden="true" />
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-[#d8b632]">
                      01
                    </span>
                  </div>

                  <div className="relative border border-[rgba(216,182,50,0.28)] bg-[#1a100c]/80 p-7 md:p-10">
                    <div className="cine-link absolute left-7 right-7 top-0 h-px origin-left bg-[#d8b632]/35 md:left-10 md:right-10" />
                    <h2 className="font-headline-lg mb-3 max-w-[14ch] text-[24px] uppercase leading-[1.02] tracking-[0.03em] md:text-[38px]">
                      {event.title}
                    </h2>
                    <p className="font-body-md mb-2 text-sm text-[#d8b632] md:text-base">
                      {formatEventDate(event.starts_at)} · Doors {formatEventTime(doors)}
                    </p>
                    <p className="font-body-md mb-2 text-sm text-[#cfc6af]">{event.venue_name || event.room_name}</p>
                    <p className={`font-body-md text-xs text-[#cfc6af] ${event.event_type === "external" ? "mb-2" : "mb-6"}`}>{event.venue_address}</p>
                    {event.event_type === "external" && (
                      <p className="event-split__external-note mb-6">
                        <span className="material-symbols-outlined text-[13px]">info</span>
                        Not held at Sweet1ne Live
                      </p>
                    )}
                    {event.description && (
                      <p className="font-body-md mb-8 max-w-md text-sm leading-relaxed text-[#cfc6af] md:text-base">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-headline-md text-[20px] text-[#f6d24c]">
                        {priceLabel(event)}
                      </span>
                      <Magnetic>
                        <Link href={`/live-events/${event.slug}`} className="event-split__cta">
                          Book ticket
                        </Link>
                      </Magnetic>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
