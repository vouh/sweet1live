"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Magnetic from "@/components/motion/Magnetic";
import ImageBrownSwipe from "@/components/motion/ImageBrownSwipe";
import { DEFAULT_LIFESTYLE } from "@/lib/images";

gsap.registerPlugin(ScrollTrigger);

type EventsClosingSectionProps = {
  imageSrc?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
  panelPrimaryHref?: string;
  panelPrimaryLabel?: string;
  panelSecondaryHref?: string;
  panelSecondaryLabel?: string;
};

/** Cream split with brown swipe reveal on the photo. */
export default function EventsClosingSection({
  imageSrc = DEFAULT_LIFESTYLE,
  panelEyebrow = "Dinner and a set",
  panelTitle = "The best seats are at the table",
  panelBody = "Book a table for a performance night and you keep it through the last set — no queue, no standing, no rush to leave.",
  panelPrimaryHref = "/reservations",
  panelPrimaryLabel = "Book for the show",
  panelSecondaryHref = "/contact",
  panelSecondaryLabel = "Private lounge enquiry",
}: EventsClosingSectionProps) {
  const copyRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const copy = copyRef.current;
      if (!copy) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.fromTo(
        copy,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: copy,
            start: "top 86%",
            once: true,
          },
        }
      );
    },
    { scope: copyRef }
  );

  return (
    <section className="wave-color-section events-closing-section">
      <div className="wave-color-section__cream">
        <div className="wave-color-section__split max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[72svh] md:min-h-[78svh]">
          <ImageBrownSwipe
            imageSrc={imageSrc}
            className="events-closing-section__media relative min-h-[42svh] md:min-h-full order-1 md:order-1"
          />

          <div
            ref={copyRef}
            className="wave-color-section__copy relative z-[2] flex flex-col justify-center px-margin-mobile md:px-gutter py-10 md:py-14 order-2 md:order-2"
          >
            <div className="wave-panel-card hairline-gold bg-surface-container-lowest p-8 md:p-10 shadow-[0_24px_64px_-28px_rgba(44,24,16,0.18)]">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.35em] block mb-4">
                {panelEyebrow}
              </span>
              <h2 className="font-headline-lg text-[26px] md:text-[38px] leading-tight uppercase tracking-[0.03em] mb-5 text-on-background">
                {panelTitle}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-md">
                {panelBody}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Magnetic>
                  <Link
                    href={panelPrimaryHref}
                    className="btn-ink font-label-caps text-label-caps px-7 py-4 inline-block text-center"
                  >
                    {panelPrimaryLabel}
                  </Link>
                </Magnetic>
                <Link
                  href={panelSecondaryHref}
                  className="btn-primary font-label-caps text-label-caps px-7 py-4 inline-block text-center"
                >
                  {panelSecondaryLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
