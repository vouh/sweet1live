import Link from "next/link";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import SplitReveal from "@/components/motion/SplitReveal";

type MustardCtaBandProps = {
  eyebrow?: string;
  title?: string;
  accentWord?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/**
 * Full-bleed mustard gold CTA band. Use once per page as a selective accent —
 * do not replace cream/chocolate page chrome with this.
 */
export default function MustardCtaBand({
  eyebrow = "Tonight",
  title = "Plan your night with us",
  accentWord = "night",
  body = "Tables, tickets, and celebrations — tell us how you want the evening to feel.",
  primaryHref = "/reservations",
  primaryLabel = "Reserve a table",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to us",
}: MustardCtaBandProps) {
  return (
    <section className="band-mustard relative z-10 py-section-gap-mobile md:py-section-gap-desktop px-margin-mobile md:px-gutter">
      <Reveal variant="up" className="max-w-container-max mx-auto text-center">
        {eyebrow ? (
          <span className="font-label-caps text-label-caps band-mustard__accent uppercase tracking-[0.35em] block mb-4">
            {eyebrow}
          </span>
        ) : null}
        <SplitReveal
          as="h2"
          text={title}
          accentWord={accentWord}
          className="band-mustard__title font-headline-lg text-[28px] md:text-[44px] uppercase tracking-[0.04em] mb-5"
        />
        <p className="band-mustard__muted font-body-md text-body-md max-w-xl mx-auto mb-10">{body}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Magnetic>
            <Link href={primaryHref} className="btn-ink font-label-caps text-label-caps px-8 py-4">
              {primaryLabel}
            </Link>
          </Magnetic>
          <Link
            href={secondaryHref}
            className="btn-primary font-label-caps text-label-caps px-8 py-4"
          >
            {secondaryLabel}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
