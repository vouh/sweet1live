import Link from "next/link";
import { BRAND_TAGLINE, BRAND_TAGLINE_SPLIT } from "@/lib/brand";

type BrandTaglineProps = {
  variant?: "eyebrow" | "inline" | "closer" | "footer";
  className?: string;
  /** Light text for photography / video overlays */
  onMedia?: boolean;
};

/** Shared tagline — kept out of logo wordmarks and image assets. */
export default function BrandTagline({
  variant = "inline",
  className = "",
  onMedia = false,
}: BrandTaglineProps) {
  const tone = onMedia ? "text-white/82" : "text-on-surface-variant";

  if (variant === "eyebrow") {
    return (
      <p
        className={`font-headline-md italic text-[14px] md:text-[15px] tracking-[0.04em] ${tone} ${className}`}
      >
        {BRAND_TAGLINE}
      </p>
    );
  }

  if (variant === "closer") {
    return (
      <p
        className={`font-headline-md italic text-[15px] md:text-[17px] tracking-[0.05em] text-on-surface-variant ${className}`}
      >
        {BRAND_TAGLINE}
      </p>
    );
  }

  if (variant === "footer") {
    return (
      <p
        className={`font-headline-md italic text-[14px] md:text-[15px] tracking-[0.04em] text-white/55 ${className}`}
      >
        {BRAND_TAGLINE}
      </p>
    );
  }

  return (
    <p className={`font-body-md text-body-md ${tone} ${className}`}>{BRAND_TAGLINE}</p>
  );
}

type HeroBookPanelProps = {
  className?: string;
  href?: string;
  label?: string;
};

/** Hero overlay — tagline frames a reservation / booking link. */
export function HeroBookPanel({
  className = "",
  href = "/reservations",
  label = "Reserve a Table",
}: HeroBookPanelProps) {
  return (
    <div className={`hero-book-panel text-center ${className}`}>
      <p className="font-headline-md italic text-[15px] md:text-[18px] text-white/90 tracking-[0.05em] drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]">
        {BRAND_TAGLINE_SPLIT.lead}
      </p>

      <div className="hero-book-panel__row my-4 md:my-5 flex items-center justify-center gap-4 md:gap-7">
        <span className="hero-book-panel__flourish hidden sm:block" aria-hidden />
        <Link
          href={href}
          className="group inline-flex items-center gap-3 font-headline-md text-[18px] md:text-[22px] text-white underline underline-offset-[10px] decoration-white/45 hover:decoration-white transition-colors drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)]"
        >
          {label}
          <span className="material-symbols-outlined text-[22px] transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-1">
            arrow_outward
          </span>
        </Link>
        <span className="hero-book-panel__flourish hidden sm:block" aria-hidden />
      </div>

      <p className="font-display-lg text-[12px] md:text-[14px] uppercase tracking-[0.48em] text-[#d4a574] drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
        {BRAND_TAGLINE_SPLIT.accent}
      </p>
    </div>
  );
}
