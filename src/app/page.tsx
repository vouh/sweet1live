import HomeLiveNights from "@/components/HomeLiveNights";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import ImageHover from "@/components/motion/ImageHover";
import HorizontalScroll from "@/components/motion/HorizontalScroll";
import SplitReveal from "@/components/motion/SplitReveal";
import MaskReveal from "@/components/motion/MaskReveal";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import StickyMediaBg from "@/components/StickyMediaBg";
import StripPhoto from "@/components/StripPhoto";
import HeroVideo from "@/components/HeroVideo";
import HomeEventsSwap from "@/components/HomeEventsSwap";
import MustardCtaBand from "@/components/MustardCtaBand";
import { HeroBookPanel } from "@/components/BrandTagline";
import { DEMO_EVENTS } from "@/lib/demoEvents";
import { pickTopEvent, lineupWithoutTop } from "@/lib/eventLineup";
import { GALLERY_STRIP, HERO_VIDEO, IMG } from "@/lib/images";
import { getEvents } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

const BEST_SELLERS = [
  { image: IMG.cellar, name: "Château Margaux", meta: "2015 · Bordeaux", price: "£240" },
  { image: IMG.wagyu, name: "Dry-Aged Ribeye", meta: "35-day · 300g", price: "£55" },
  { image: IMG.alcove, name: "Black Truffle Tagliatelle", meta: "Hand-rolled", price: "£28" },
];

const STRIP = GALLERY_STRIP;

const EXPERIENCES = [
  { image: IMG.jazz, label: "Live Lounge Sets", href: "/live-events", caption: "below" as const, tilt: "left" as const, level: "low" as const },
  { image: IMG.liveJazz, label: "Ticketed Jazz Nights", href: "/live-events", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.bar, label: "Late Night Atmosphere", href: "/live-events", caption: "below" as const, tilt: "none" as const, level: "low" as const },
  { image: IMG.alcove, label: "Private Dining Rooms", href: "/venue-hire", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.bandA, label: "Brass & Soul Lineups", href: "/live-events", caption: "below" as const, tilt: "right" as const, level: "low" as const },
  { image: IMG.experience5, label: "After-Dark Energy", href: "/live-events", caption: "above" as const, tilt: "none" as const, level: "high" as const },
  { image: IMG.experience6, label: "Celebrations & Toasts", href: "/reservations", caption: "below" as const, tilt: "left" as const, level: "low" as const },
];

export default async function HomePage() {
  const fromApi = (await getEvents()).filter((event) => event.slug !== "ticket-demo");
  const pool = fromApi.length > 0 ? fromApi.slice(0, 6) : DEMO_EVENTS;
  const top = pickTopEvent(pool);
  const rest = lineupWithoutTop(pool, top);
  const homeEvents = top ? [top, ...rest] : rest;

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
        {/* ---------- Upcoming events — wipe carousel (replaces signature dish) ---------- */}
        {homeEvents.length > 0 && <HomeEventsSwap events={homeEvents} />}

        <div className="relative z-10 border-y border-outline-variant/20 py-5 overflow-hidden bg-surface-container-lowest">
          <ScrollMarquee
            text="LIVE JAZZ · LATE SETS · BRASS · SOUL · TICKETS · THE ROOM FILLS FAST ·"
            className="font-headline-lg text-[20px] md:text-[34px] uppercase tracking-[0.12em] text-on-surface-variant/20 whitespace-nowrap"
          />
        </div>

        <HomeLiveNights />

        {/* ---------- Best sellers ---------- */}
        <section className="relative z-10 py-section-gap-mobile md:py-section-gap-desktop bg-background">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-gutter items-stretch">
              <Reveal variant="up" className="flex flex-col justify-center">
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.04em] leading-tight mb-5">
                  Before
                  <br />
                  the set
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                  Dishes and pours guests order while the room warms up — then the lights drop and
                  the night begins.
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
                The stage, the set, the night
              </span>
              <h2 className="font-headline-lg text-[28px] md:text-[44px] leading-tight uppercase tracking-[0.03em] mb-5">
                Nights worth dressing up for
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                Live acts, candlelit tables, and a room that knows how to hold a crowd. Come for the
                music — stay because the evening still has somewhere to go.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Magnetic>
                  <Link href="/live-events" className="btn-ink font-label-caps text-label-caps px-7 py-4 inline-block text-center">
                    See what&apos;s on
                  </Link>
                </Magnetic>
                <Link href="/reservations" className="btn-primary font-label-caps text-label-caps px-7 py-4 inline-block text-center">
                  Reserve a table
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
                    Keep scrolling — the band, the booths, the hush before the first note, and the
                    glow after the last.
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
                <Link href="/reservations" className="btn-primary font-label-caps text-label-caps px-6 py-3">
                  Book a table
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
                text="Where the night turns live"
                accentWord="live"
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
                    className="w-full sm:w-[calc(50%-12px)] md:w-[calc((100%-6*1rem)/7)] lg:w-[calc((100%-6*1.25rem)/7)] md:shrink-0"
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

        <MustardCtaBand
          eyebrow="Book the night"
          title="Table, tickets, or both"
          accentWord="tickets"
          body="Lock in your evening — dining, live sets, or a celebration built around the room."
          primaryHref="/reservations"
          primaryLabel="Book your experience"
          secondaryHref="/contact"
          secondaryLabel="Start a conversation"
        />
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
