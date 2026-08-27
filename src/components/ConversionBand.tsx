import Link from "next/link";
import Reveal from "@/components/Reveal";
import StickyMediaBg from "@/components/StickyMediaBg";

const DEFAULT_IMAGE = "/images/guests-toast.png";

/**
 * Sticky photo only — cream card scrolls over then off as the next section arrives.
 */
export default function ConversionBand({
  eyebrow = "Tonight is reserved for the decisive",
  title = "Tables fill before the first set",
  body = "Secure your evening now — or start a conversation with our concierge for private dining and celebrations.",
  image = DEFAULT_IMAGE,
  primaryHref = "/reservations",
  primaryLabel = "Reserve a table",
  secondaryHref = "/contact",
  secondaryLabel = "Start a conversation",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  image?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <StickyMediaBg image={image}>
      <Reveal variant="up">
        <div className="max-w-lg bg-background p-8 md:p-10 hairline-gold">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-3">
            {eyebrow}
          </span>
          <h2 className="font-headline-lg text-[26px] md:text-[40px] leading-tight uppercase tracking-[0.03em] mb-4">
            {title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">{body}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={primaryHref} className="btn-ink font-label-caps text-label-caps px-6 py-3.5 text-center">
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="btn-primary font-label-caps text-label-caps px-6 py-3.5 text-center"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </Reveal>
    </StickyMediaBg>
  );
}
