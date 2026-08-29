"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Magnetic from "@/components/motion/Magnetic";
import { HeroBookPanel } from "@/components/BrandTagline";

gsap.registerPlugin(ScrollTrigger);

type CinematicScrollStageProps = {
  imageSrc: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
  panelPrimaryHref?: string;
  panelPrimaryLabel?: string;
  panelSecondaryHref?: string;
  panelSecondaryLabel?: string;
};

/**
 * After 25% hero scroll: left image section + right cream section start parted
 * at the screen edges, then slide in and unite at the center.
 */
export default function CinematicScrollStage({
  imageSrc,
  panelEyebrow = "Dinner and a set",
  panelTitle = "The best seats are at the table",
  panelBody = "Book a table for a performance night and you keep it through the last set — no queue, no standing, no rush to leave.",
  panelPrimaryHref = "/reservations",
  panelPrimaryLabel = "Book for the show",
  panelSecondaryHref = "/contact",
  panelSecondaryLabel = "Private lounge enquiry",
}: CinematicScrollStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const q = gsap.utils.selector(root);

      if (reduce) {
        gsap.set(q(".cine-hero-copy"), { opacity: 0 });
        gsap.set(q(".cine-assemble"), { autoAlpha: 1 });
        gsap.set(q(".cine-side-left, .cine-side-right"), { x: 0, xPercent: 0 });
        gsap.set(q(".cine-seam, .cine-link"), { scaleY: 1, scaleX: 1, opacity: 1 });
        return;
      }

      const mobile = window.matchMedia("(max-width: 767px)").matches;

      gsap.set(q(".cine-assemble"), { autoAlpha: 0 });
      // Parted on-screen: edges visible at sides, gap open in the middle
      if (mobile) {
        gsap.set(q(".cine-side-left"), { yPercent: -55, x: 0 });
        gsap.set(q(".cine-side-right"), { yPercent: 55, x: 0 });
      } else {
        gsap.set(q(".cine-side-left"), { xPercent: -42, x: 0 });
        gsap.set(q(".cine-side-right"), { xPercent: 42, x: 0 });
      }
      gsap.set(q(".cine-seam"), { scaleY: 0, opacity: 0, transformOrigin: "center center" });
      gsap.set(q(".cine-link"), { scaleX: 0, opacity: 0, transformOrigin: "left center" });
      gsap.set(q(".cine-hero-media"), { scale: 1.04 });
      gsap.set(q(".cine-veil"), { opacity: 0.4 });
      gsap.set(q(".cine-hero-copy"), { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * (mobile ? 2.05 : 2.25))}`,
          pin: true,
          scrub: mobile ? 0.85 : 1.0,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          pinType: "fixed",
        },
      });

      // 0–25%: hold hero
      tl.to({}, { duration: 0.25 });

      tl.to(q(".cine-hero-media"), { scale: 1.08, duration: 0.1 }, 0.2);
      tl.to(q(".cine-veil"), { opacity: 0.55, duration: 0.1 }, 0.2);
      tl.to(q(".cine-hero-copy"), { opacity: 0, y: -24, filter: "blur(4px)", duration: 0.1 }, 0.22);

      // Reveal parted halves, then close the gap a bit more slowly
      tl.to(q(".cine-assemble"), { autoAlpha: 1, duration: 0.04 }, 0.25);
      tl.to(q(".cine-side-left"), { xPercent: 0, yPercent: 0, x: 0, duration: 0.55 }, 0.28);
      tl.to(q(".cine-side-right"), { xPercent: 0, yPercent: 0, x: 0, duration: 0.55 }, 0.28);
      tl.to(q(".cine-seam"), { scaleY: 1, opacity: 1, duration: 0.14 }, 0.78);
      tl.to(q(".cine-link"), { scaleX: 1, opacity: 1, duration: 0.12, stagger: 0.03 }, 0.85);

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: rootRef, dependencies: [imageSrc] }
  );

  return (
    <div ref={rootRef} className="cinematic-scroll-stage relative z-10 w-full max-w-full overflow-hidden">
      <div className="cinematic-scroll-stage__pin relative h-[100svh] w-full max-w-full overflow-hidden bg-[#1a100c]">
        <div
          className="cine-hero-media absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url('${imageSrc}')`, transform: "scale(1.04)" }}
        />
        <div className="cine-veil absolute inset-0 hero-media-veil" aria-hidden="true" />

        <div className="cine-hero-copy absolute inset-0 z-10 flex flex-col items-center justify-center px-margin-mobile text-center md:px-gutter">
          <h1 className="font-display-lg text-[clamp(3rem,11vw,9rem)] leading-[0.92] uppercase tracking-[0.02em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
            Live &amp; Events
          </h1>
          <p className="font-headline-md mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/88 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] md:mt-8 md:text-[20px]">
            Intimate jazz, headline lounge sets, and ticketed nights where the room, the music, and
            the pour move together.
          </p>
          <div className="mt-10 md:mt-12">
            <HeroBookPanel href="/reservations" label="Book for the show" />
          </div>
        </div>

        <div
          className="cine-assemble absolute inset-0 z-20 overflow-hidden pointer-events-none"
          style={{ visibility: "hidden", opacity: 0 }}
        >
          <div className="relative flex h-full w-full flex-col gap-0 md:flex-row pointer-events-auto">
            {/* LEFT section — image with framed lines */}
            <section className="cine-side-left relative z-[1] flex h-[48%] w-full flex-col bg-[#1a100c] md:h-full md:w-1/2 will-change-transform">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(245,239,232,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(245,239,232,0.07) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
                aria-hidden="true"
              />
              <div className="relative flex min-h-0 flex-1 flex-col justify-center px-5 pb-6 pt-[7.25rem] md:px-7 md:pb-10 md:pt-[8.25rem] lg:px-9">
                <div className="cine-image-stage relative mx-auto w-full max-w-[min(100%,520px)]">
                  {/* Outer frame lines */}
                  <div className="pointer-events-none absolute -inset-3 md:-inset-4" aria-hidden="true">
                    <span className="absolute left-0 top-0 h-10 w-px bg-[#d4a574]/55" />
                    <span className="absolute left-0 top-0 h-px w-10 bg-[#d4a574]/55" />
                    <span className="absolute right-0 top-0 h-10 w-px bg-[#d4a574]/55" />
                    <span className="absolute right-0 top-0 h-px w-10 bg-[#d4a574]/55" />
                    <span className="absolute bottom-0 left-0 h-10 w-px bg-[#d4a574]/55" />
                    <span className="absolute bottom-0 left-0 h-px w-10 bg-[#d4a574]/55" />
                    <span className="absolute bottom-0 right-0 h-10 w-px bg-[#d4a574]/55" />
                    <span className="absolute bottom-0 right-0 h-px w-10 bg-[#d4a574]/55" />
                  </div>

                  <div
                    className="cine-image-frame relative aspect-[3/4] w-full max-h-[min(76vh,640px)] overflow-hidden bg-cover bg-center shadow-[0_28px_64px_-24px_rgba(0,0,0,0.55)]"
                    style={{ backgroundImage: `url('${imageSrc}')` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(160deg, color-mix(in srgb, #2c1810 10%, transparent) 0%, color-mix(in srgb, #1a100c 22%, transparent) 100%)",
                      }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-3 border border-[#f5efe8]/18" aria-hidden="true" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <span className="font-label-caps text-[10px] uppercase tracking-[0.32em] text-[#f5efe8]/70">
                        Live room
                      </span>
                      <span className="h-px flex-1 bg-[#f5efe8]/25" aria-hidden="true" />
                      <span className="font-label-caps text-[10px] uppercase tracking-[0.32em] text-[#d4a574]/90">
                        Tonight
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div
              className="cine-seam absolute left-1/2 top-[7.25rem] bottom-8 z-[3] hidden w-px -translate-x-1/2 bg-primary/35 md:top-[8.25rem] md:block"
              aria-hidden="true"
            />

            {/* RIGHT section — richer cream editorial panel */}
            <section className="cine-side-right relative z-[1] flex h-[52%] w-full flex-col overflow-hidden bg-[#f5efe8] md:h-full md:w-1/2 will-change-transform">
              <div className="cine-link absolute left-0 right-0 top-0 z-[2] hidden h-px origin-left bg-primary/40 md:block" />
              {/* Soft atmosphere */}
              <div
                className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, #d4a57455 0%, transparent 70%)" }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 18% 22%, rgba(44,24,16,0.04) 0 1px, transparent 1.5px)",
                  backgroundSize: "18px 18px",
                }}
                aria-hidden="true"
              />

              <div className="relative flex min-h-0 flex-1 flex-col justify-center px-margin-mobile py-8 pt-[7.25rem] md:px-gutter md:py-10 md:pt-[8.25rem]">
                <div className="relative mx-auto w-full max-w-lg md:mx-0">
                  {/* Vertical rail label */}
                  <div className="mb-5 flex items-center gap-4">
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.38em] text-[#2c1810]/55">
                      Table &amp; set
                    </span>
                    <span className="h-px flex-1 bg-[#2c1810]/18" aria-hidden="true" />
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-primary">
                      01
                    </span>
                  </div>

                  <div className="wave-panel-card hairline-gold relative bg-[#faf6f1] p-7 shadow-[0_24px_64px_-28px_rgba(44,24,16,0.15)] md:p-10">
                    <div className="cine-link absolute left-7 right-7 top-0 h-px origin-left bg-primary/35 md:left-10 md:right-10" />
                    {/* Corner ticks */}
                    <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-primary/45" aria-hidden="true" />
                    <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-primary/45" aria-hidden="true" />
                    <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-primary/45" aria-hidden="true" />
                    <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-primary/45" aria-hidden="true" />

                    <span className="font-display-lg pointer-events-none absolute -top-2 right-6 text-[64px] leading-none text-[#2c1810]/08 md:right-8 md:text-[88px]" aria-hidden="true">
                      ”
                    </span>

                    <span className="font-label-caps text-label-caps mb-4 block uppercase tracking-[0.35em] text-primary">
                      {panelEyebrow}
                    </span>
                    <h2 className="font-headline-lg mb-4 max-w-[14ch] text-[24px] uppercase leading-[1.05] tracking-[0.03em] text-on-background md:text-[34px]">
                      {panelTitle}
                    </h2>
                    <div className="mb-5 flex items-center gap-3" aria-hidden="true">
                      <span className="h-px w-8 bg-primary/50" />
                      <span className="h-1 w-1 rounded-full bg-primary/70" />
                      <span className="h-px flex-1 bg-[#2c1810]/12" />
                    </div>
                    <p className="font-body-md mb-8 max-w-md text-sm leading-relaxed text-on-surface-variant md:text-body-md">
                      {panelBody}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Magnetic>
                        <Link
                          href={panelPrimaryHref}
                          className="btn-ink font-label-caps text-label-caps inline-block px-6 py-3.5 text-center"
                        >
                          {panelPrimaryLabel}
                        </Link>
                      </Magnetic>
                      <Link
                        href={panelSecondaryHref}
                        className="btn-primary font-label-caps text-label-caps inline-block px-6 py-3.5 text-center"
                      >
                        {panelSecondaryLabel}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3 text-[#2c1810]/45">
                    <span className="font-label-caps text-[10px] uppercase tracking-[0.3em]">
                      Keep the table through the last set
                    </span>
                    <span className="h-px flex-1 bg-[#2c1810]/12" aria-hidden="true" />
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
