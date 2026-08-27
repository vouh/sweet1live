import type { ReactNode } from "react";

/**
 * Pins only the background image. Overlay children (cards / copy) scroll
 * normally so the page appears to meet and cover the photo.
 */
export default function StickyMediaBg({
  image,
  children,
  className = "",
  align = "start",
}: {
  image: string;
  children: ReactNode;
  className?: string;
  /** Where the overlay sits within the first viewport of the sticky image. */
  align?: "start" | "center";
}) {
  return (
    <section className={`relative ${className}`}>
      <div className="sticky top-0 z-0 h-[75svh] md:h-[85svh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')` }}
        />
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

/**
 * Sticky image column for editorial splits — photo holds while copy scrolls past.
 */
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
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')` }}
      />
    </div>
  );
}
