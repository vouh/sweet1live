import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import ImageHover from "@/components/motion/ImageHover";
import DrawLine from "@/components/motion/DrawLine";
import HorizontalScroll from "@/components/motion/HorizontalScroll";
import SplitReveal from "@/components/motion/SplitReveal";
import MaskReveal from "@/components/motion/MaskReveal";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import StickyMediaBg, { StickyImageColumn } from "@/components/StickyMediaBg";
import StripPhoto from "@/components/StripPhoto";
import HeroVideo from "@/components/HeroVideo";
import { HeroBookPanel } from "@/components/BrandTagline";
import { GALLERY_STRIP, HERO_VIDEO, IMG } from "@/lib/images";

const BEST_SELLERS = [
  { image: IMG.cellar, name: "Château Margaux", meta: "2015 · Bordeaux", price: "£240" },
  { image: IMG.wagyu, name: "Dry-Aged Ribeye", meta: "35-day · 300g", price: "£55" },
  { image: IMG.alcove, name: "Black Truffle Tagliatelle", meta: "Hand-rolled", price: "£28" },
];

const STRIP = GALLERY_STRIP;

const EXPERIENCES = [
  { image: IMG.jazz, label: "Live Lounge Experience", href: "/live-events", caption: "below" as const, tilt: "left" as const, level: "low" as const },
  { image: IMG.wagyu, label: "Fine Dining Cuisine", href: "/menus", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.bar, label: "Signature Cocktails", href: "/menus", caption: "below" as const, tilt: "none" as const, level: "low" as const },
  { image: IMG.alcove, label: "Private Dining Rooms", href: "/venue-hire", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.cellar, label: "Wine & Spirits Selection", href: "/venue-hire", caption: "below" as const, tilt: "right" as const, level: "low" as const },
  { image: IMG.experience5, label: "Late Night Atmosphere", href: "/live-events", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.experience6, label: "Celebrations & Toasts", href: "/reservations", caption: "below" as const, tilt: "left" as const, level: "low" as const },
];

export default function HomePage() {
  return (
    <>
      <Nav active="/" overlay />
      <main>
        {/* ---------- Hero — sticky so following content flies over ---------- */}
        <section className="sticky top-0 z-0 h-[100svh] flex flex-col justify-end overflow-hidden pb-16 md:pb-24">
          <HeroVideo src={HERO_VIDEO} />
          <h1 className="sr-only">Sweet1ne Live</h1>

          <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter text-center flex flex-col items-center">
            <Reveal delay={120}>
              <HeroBookPanel />
            </Reveal>
          </div>
        </section>

        {/* Content stack — scrolls over sticky hero */}
        <div className="relative z-10 bg-background">
        {/* ---------- Signature dish — sticky photo, copy scrolls past ---------- */}
        <section className="relative z-10 py-section-gap-mobile md:py-section-gap-desktop bg-background">
          <DrawLine
            className="absolute left-[12%] top-0 hidden h-full w-px text-primary/40 md:block"
            orientation="vertical"
          />
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 md:items-start">
            <Reveal variant="left" className="order-2 md:order-1 md:pt-8 md:pb-[28vh]">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-5">
                Signature Dish
              </span>
              <SplitReveal
                as="h3"
                text="Wagyu Tataki"
                accentWord="Tataki"
                className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em] mb-6"
              />
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-9">
                Lightly seared A5 Wagyu, sliced thin over truffle ponzu with crispy garlic and
                micro-shiso. Each bite is built to deliver depth, comfort, and pure elegance — a
                perfect opening act for the evening.
              </p>
              <Magnetic>
                <ArrowLink href="/menus">Taste the Signature</ArrowLink>
              </Magnetic>
            </Reveal>

            <div className="order-1 md:order-2">
              <MaskReveal>
                <StickyImageColumn image={IMG.stickyA} side="right" />
              </MaskReveal>
            </div>
          </div>
        </section>

        <div className="relative z-10 border-y border-outline-variant/20 py-5 overflow-hidden bg-surface-container-lowest">
          <ScrollMarquee
            text="FINE DINING · LIVE MUSIC · LATE NIGHT · SIGNATURE POUR ·"
            className="font-headline-lg text-[20px] md:text-[34px] uppercase tracking-[0.12em] text-on-surface-variant/20 whitespace-nowrap"
          />
        </div>

        {/* ---------- Signature cocktail — sticky photo, copy scrolls past ---------- */}
        <section className="relative z-10 bg-surface-container-lowest py-section-gap-mobile md:py-section-gap-desktop">
          <DrawLine
            className="absolute right-[12%] top-0 hidden h-full w-px text-primary/35 md:block"
            orientation="vertical"
          />
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 md:items-start">
            <div>
              <MaskReveal>
                <StickyImageColumn image={IMG.stickyB} side="left" />
              </MaskReveal>
            </div>

            <Reveal variant="right" className="md:pt-8 md:pb-[28vh]">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-5">
                Signature Cocktail
              </span>
              <SplitReveal
                as="h3"
                text="Midnight Velvet"
                accentWord="Velvet"
                className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em] mb-6"
              />
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-9">
                Crafted for those who enjoy bold yet smooth flavours. Premium vodka blended with
                fresh espresso and a touch of dark chocolate, finished with a silky foam top — the
                perfect companion for an evening of luxury.
              </p>
              <Magnetic>
                <ArrowLink href="/menus">Sip the Elegance</ArrowLink>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* ---------- Best sellers ---------- */}
        <section className="relative z-10 py-section-gap-mobile md:py-section-gap-desktop bg-background">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-gutter items-stretch">
              <Reveal variant="up" className="flex flex-col justify-center">
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.04em] leading-tight mb-5">
                  Best
                  <br />
                  Sellers
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                  Our most loved dishes and drinks, crafted for every luxurious moment.
                </p>
                <ArrowLink href="/menus">View Full Menu</ArrowLink>
              </Reveal>

              {BEST_SELLERS.map((item, i) => (
                <Reveal key={item.name} delay={100 + i * 140} variant="up">
                  <article className="lux-card group overflow-hidden hairline-gold flex flex-col h-full">
                    <MaskReveal delay={80 + i * 80}>
                      <ImageHover className="relative aspect-[4/5]">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url('${item.image}')` }}
                        />
                      </ImageHover>
                    </MaskReveal>
                    <div className="bg-surface-container-low p-6 flex flex-col flex-grow">
                      <h3 className="font-headline-md text-[22px] leading-tight uppercase tracking-wide mb-1">
                        {item.name}
                      </h3>
                      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-4">
                        {item.meta}
                      </p>
                      <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4 mt-auto">
                        <span className="font-price-display text-price-display text-primary">
                          {item.price}
                        </span>
                        <span className="font-label-caps text-label-caps font-semibold uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors duration-400 inline-flex items-center gap-2">
                          Add to Bag
                          <span className="material-symbols-outlined text-[16px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400">
                            arrow_outward
                          </span>
                        </span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Social toast — only the photo sticks; cream card scrolls off ---------- */}
        <StickyMediaBg image={IMG.bandA}>
          <Reveal variant="blur">
            <div className="max-w-xl bg-background p-8 md:p-12 hairline-gold">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-4">
                The room, the rhythm, the toast
              </span>
              <h2 className="font-headline-lg text-[28px] md:text-[44px] leading-tight uppercase tracking-[0.03em] mb-5">
                Nights worth raising a glass to
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                Bring your people. We&apos;ll set the stage — live music, handcrafted pours, and a
                table that makes ordinary evenings feel cinematic.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Magnetic>
                  <Link href="/reservations" className="btn-ink font-label-caps text-label-caps px-7 py-4 inline-block text-center">
                    Reserve your evening
                  </Link>
                </Magnetic>
                <Link href="/contact" className="btn-primary font-label-caps text-label-caps px-7 py-4 inline-block text-center">
                  Plan a private toast
                </Link>
              </div>
            </div>
          </Reveal>
        </StickyMediaBg>

        {/* ---------- Horizontal gallery — slow scroll-driven strip ---------- */}
        <section className="relative z-10 bg-surface-container-lowest overflow-x-clip">
          <HorizontalScroll
            className="pt-section-gap-mobile md:pt-section-gap-desktop pb-10 md:pb-14"
            trackClassName="px-margin-mobile md:px-gutter"
            header={
              <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-8 md:mb-10">
                <div className="max-w-2xl">
                  <h2 className="font-headline-lg text-[26px] md:text-[40px] uppercase tracking-[0.04em]">
                    A night in frames
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-3">
                    Keep scrolling — the night drifts past: cocktails, jazz, candlelight, and the
                    table waiting for you.
                  </p>
                </div>
              </div>
            }
            footer={
              <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter mt-8 md:mt-10 flex flex-wrap gap-3">
                <Link
                  href="/live-events"
                  className="btn-ink font-label-caps text-label-caps px-6 py-3"
                >
                  See what&apos;s on
                </Link>
                <Link href="/menus" className="btn-primary font-label-caps text-label-caps px-6 py-3">
                  Explore the menu
                </Link>
              </div>
            }
          >
            {STRIP.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={`lux-card relative aspect-[4/5] w-[82vw] sm:w-[52vw] md:w-[360px] lg:w-[400px] shrink-0 overflow-hidden ${
                  i % 2 === 0 ? "md:translate-y-4" : "md:-translate-y-3"
                }`}
              >
                <StripPhoto src={src} />
              </div>
            ))}
          </HorizontalScroll>
        </section>

        {/* ---------- Experiences gallery (staggered editorial layout) ---------- */}
        <section className="relative z-10 bg-surface-container-lowest py-section-gap-mobile md:py-section-gap-desktop overflow-x-clip">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <Reveal className="text-center mb-12 md:mb-16">
              <SplitReveal
                as="h2"
                text="Where every flavour elevated by elegance"
                accentWord="elegance"
                className="font-headline-lg text-[28px] leading-[1.15] sm:text-[40px] md:text-[52px] md:leading-[1.12] uppercase tracking-[0.04em] max-w-4xl mx-auto text-on-background"
              />
            </Reveal>

            <div className="experience-gallery flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap justify-center md:justify-between gap-10 sm:gap-6 md:gap-4 lg:gap-5 md:pt-10 md:pb-16">
              {EXPERIENCES.map((item, i) => {
                const motion = [
                  item.tilt === "left" ? "gallery-tilt-left" : "",
                  item.tilt === "right" ? "gallery-tilt-right" : "",
                  item.level === "high" ? "gallery-level-high" : "gallery-level-low",
                ]
                  .filter(Boolean)
                  .join(" ");

                const label = (
                  <span className="block text-center font-headline-md text-[13px] md:text-[15px] leading-snug tracking-wide text-on-background group-hover:text-primary transition-colors duration-400 px-1">
                    {item.label}
                  </span>
                );

                return (
                  <Reveal
                    key={item.label}
                    delay={i * 100}
                    variant="up"
                    className="w-full sm:w-[calc(50%-12px)] md:w-[18.5%] md:shrink-0"
                  >
                    {/* Inner wrapper holds tilt/stagger so Reveal's transform doesn't wipe them */}
                    <div className={motion}>
                      <Link href={item.href} className="group flex flex-col gap-3 md:gap-4">
                        {item.caption === "above" && (
                          <span className="lux-caption order-1 min-h-[2.5rem] flex items-end justify-center">
                            {label}
                          </span>
                        )}
                        <div className="lux-card order-2 relative aspect-[3/4] w-full overflow-hidden shadow-[0_18px_40px_-24px_rgba(58,31,34,0.45)]">
                          <ImageHover className="absolute inset-0" strength={8}>
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url('${item.image}')` }}
                            />
                          </ImageHover>
                        </div>
                        {item.caption === "below" && (
                          <span className="lux-caption order-3 min-h-[2.5rem] flex items-start justify-center">
                            {label}
                          </span>
                        )}
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal
              delay={280}
              className="mt-6 md:mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Magnetic>
                <Link href="/reservations" className="btn-ink font-label-caps text-label-caps px-8 py-4">
                  Reserve a table
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/contact" className="btn-primary font-label-caps text-label-caps px-8 py-4">
                  Start a conversation
                </Link>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* ---------- Booking banner — sticky photo only; copy scrolls over then off ---------- */}
        <StickyMediaBg image={IMG.bandB} align="center">
          <Reveal
            variant="blur"
            className="on-media max-w-3xl mx-auto text-center drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]"
          >
            <h2 className="font-headline-lg text-[26px] leading-snug md:text-[46px] md:leading-[1.2] uppercase tracking-[0.04em] mb-8 text-white">
              Book your table for a memorable
              <br className="hidden md:block" /> night of fine dining
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Magnetic>
                <Link
                  href="/reservations"
                  className="btn-ink font-label-caps text-label-caps px-8 py-4 !bg-[#f5efe8] !text-[#3a1f22]"
                >
                  Book your experience
                </Link>
              </Magnetic>
              <Link
                href="/contact"
                className="link-underline group inline-flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-widest text-white"
              >
                Or start a conversation
                <span className="material-symbols-outlined text-[18px] transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-1">
                  arrow_outward
                </span>
              </Link>
            </div>
          </Reveal>
        </StickyMediaBg>
        </div>

        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}

/** Underlined text link with a diagonal arrow, per the reference layouts. */
function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`link-underline group inline-flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-widest text-on-background hover:text-primary transition-colors duration-400 w-fit ${className}`}
    >
      {children}
      <span className="material-symbols-outlined text-[18px] transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-1">
        arrow_outward
      </span>
    </Link>
  );
}
