"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { DEFAULT_LIFESTYLE } from "@/lib/images";

type WaveColorSectionProps = {
  imageSrc?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
  panelPrimaryHref?: string;
  panelPrimaryLabel?: string;
  panelSecondaryHref?: string;
  panelSecondaryLabel?: string;
  chocolateTitle?: string;
  chocolateBody?: string;
  chocolatePrimaryHref?: string;
  chocolatePrimaryLabel?: string;
  chocolateSecondaryHref?: string;
  chocolateSecondaryLabel?: string;
  children?: ReactNode;
};

/**
 * Cream + chocolate zones joined by an organic SVG wave.
 * Events uses CinematicScrollStage for the scroll = film scrub experience.
 */
export default function WaveColorSection({
  imageSrc = DEFAULT_LIFESTYLE,
  panelEyebrow = "Dinner and a set",
  panelTitle = "The best seats are at the table",
  panelBody = "Book a table for a performance night and you keep it through the last set — no queue, no standing, no rush to leave.",
  panelPrimaryHref = "/reservations",
  panelPrimaryLabel = "Book for the show",
  panelSecondaryHref = "/contact",
  panelSecondaryLabel = "Private lounge enquiry",
  chocolateTitle = "Some nights you remember for the music alone",
  chocolateBody = "Brass, candlelight, and a table that stays yours until the final chord.",
  chocolatePrimaryHref = "/reservations",
  chocolatePrimaryLabel = "Book your experience",
  chocolateSecondaryHref = "/menus",
  chocolateSecondaryLabel = "Explore the menu",
  children,
}: WaveColorSectionProps) {
  return (
    <section className="wave-color-section">
      <div className="wave-color-section__cream">
        <div className="wave-color-section__split max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[72svh] md:min-h-[78svh]">
          <div
            className="wave-color-section__media relative min-h-[42svh] md:min-h-full order-1 md:order-1"
            style={{ backgroundImage: `url('${imageSrc}')` }}
          >
            <div className="wave-color-section__media-veil absolute inset-0" aria-hidden="true" />
          </div>

          <div className="wave-color-section__copy flex flex-col justify-center px-margin-mobile md:px-gutter py-10 md:py-14 order-2 md:order-2">
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

      <div className="wave-color-section__wave" aria-hidden="true">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block w-full h-[72px] md:h-[100px]"
        >
          <path
            className="wave-color-section__wave-fill"
            d="M0,48 C240,110 480,8 720,56 C960,104 1200,24 1440,64 L1440,120 L0,120 Z"
          />
        </svg>
      </div>

      <div className="wave-color-section__chocolate">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-14 md:py-20 text-center">
          <h3 className="font-headline-lg text-[24px] md:text-[36px] uppercase tracking-[0.04em] text-[#f5efe8] mb-4">
            {chocolateTitle}
          </h3>
          <p className="font-body-md text-body-md text-white/75 max-w-lg mx-auto mb-10">
            {chocolateBody}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Magnetic>
              <Link
                href={chocolatePrimaryHref}
                className="inline-flex font-label-caps text-label-caps uppercase tracking-[0.22em] px-8 py-4 bg-[#f5efe8] text-[#2c1810] hover:opacity-90 transition-opacity"
              >
                {chocolatePrimaryLabel}
              </Link>
            </Magnetic>
            <Link
              href={chocolateSecondaryHref}
              className="inline-flex font-label-caps text-label-caps uppercase tracking-[0.22em] px-8 py-4 border border-white/35 text-[#f5efe8] hover:bg-white/10 transition-colors"
            >
              {chocolateSecondaryLabel}
            </Link>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
