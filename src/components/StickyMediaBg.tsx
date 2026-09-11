import type { ReactNode } from "react";
import LazyBackground from "@/components/LazyBackground";

/**
 * Pins only the background image. Overlay children (cards / copy) scroll
 * normally so the page appears to meet and cover the photo.
 */
export default function StickyMediaBg({
  image,
  children,
  className = "",
  align = "start",
  priority = false,
  /** Darken bright venue lighting so white/cream type stays readable. */
  veil = "auto",
}: {
  image: string;
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
  priority?: boolean;
  veil?: "auto" | "soft" | "strong" | "none";
}) {
  const veilStrength = veil === "auto" ? (align === "center" ? "strong" : "soft") : veil;

  return (
    <section className={`relative ${className}`}>
      <div className="sticky top-0 z-0 h-[75svh] md:h-[85svh] overflow-hidden">
        <LazyBackground
          src={image}
          priority={priority}
          className="absolute inset-0 bg-cover bg-center"
        />
        {veilStrength !== "none" && (
          <div
            className={`sticky-media-veil sticky-media-veil--${veilStrength}`}
            aria-hidden
          />
        )}
      </div>

      <div className="relative z-10 -mt-[75svh] md:-mt-[85svh]">
        <div
          className={`min-h-[75svh] md:min-h-[85svh] flex ${
            align === "center" ? "items-center justify-center" : "items-center"
          } px-margin-mobile md:px-gutter py-section-gap-mobile`}
        >
          <div className="w-full max-w-container-max mx-auto">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Sticky image column for editorial splits — photo holds while copy scrolls past. */
export function StickyImageColumn({
  image,
  className = "",
  side = "right",
}: {
  image: string;
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <div
      className={`sticky-image-col relative md:sticky md:top-24 md:self-start h-[55vw] max-h-[420px] md:h-[min(72svh,640px)] md:max-h-none overflow-hidden hairline-gold ${className}`}
      data-side={side}
    >
      <LazyBackground src={image} className="absolute inset-0 bg-cover bg-center" />
    </div>
  );
}
