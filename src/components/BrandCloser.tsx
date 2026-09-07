import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import DrawLine from "@/components/motion/DrawLine";
import Magnetic from "@/components/motion/Magnetic";
import BrandTagline from "@/components/BrandTagline";
import ScrollMarquee from "@/components/motion/ScrollMarquee";

/**
 * Sweet1ne brand closer — sticky so the chocolate footer flies over it.
 */
export default function BrandCloser() {
  return (
    <section
      id="brand-closer"
      className="sticky top-0 z-0 min-h-[58svh] flex flex-col items-center justify-center bg-surface-container-lowest pt-12 md:pt-16 pb-8 md:pb-10 overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center opacity-[0.06] overflow-hidden pointer-events-none">
        <ScrollMarquee
          text="SWEET1NE · LATE NIGHT ·"
          className="font-display-lg text-[18vw] leading-none uppercase tracking-[0.06em]"
        />
      </div>
      <Reveal variant="scale" className="relative z-10 text-center px-margin-mobile">
        <Image
          src="/images/sweet1nelive_logo-transparent.png"
          alt="Sweet1ne Live"
          width={1774}
          height={887}
          sizes="(max-width: 768px) 88vw, 62vw"
          className="w-[88vw] sm:w-[74vw] md:w-[62vw] max-w-[900px] h-auto mx-auto object-contain"
        />
        <DrawLine className="mx-auto mt-8 h-px w-40 text-primary" orientation="horizontal" />
        <BrandTagline variant="closer" className="mt-6" />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Magnetic>
            <Link href="/reservations" className="btn-ink font-label-caps text-label-caps px-8 py-4">
              Book a table
            </Link>
          </Magnetic>
          <Link href="/contact" className="btn-primary font-label-caps text-label-caps px-8 py-4">
            Talk to us
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** Wraps footer so it sits above sticky BrandCloser / sticky media. */
export function FooterFlyover({ children }: { children: React.ReactNode }) {
  return <div className="relative z-20">{children}</div>;
}
