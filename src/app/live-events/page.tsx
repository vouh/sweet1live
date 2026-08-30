import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Parallax from "@/components/Parallax";
import ConversionBand from "@/components/ConversionBand";
import CinematicScrollStage from "@/components/motion/CinematicScrollStage";
import ArrowCarousel from "@/components/motion/ArrowCarousel";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import SplitReveal from "@/components/motion/SplitReveal";
import MaskReveal from "@/components/motion/MaskReveal";
import ImageHover from "@/components/motion/ImageHover";
import DrawLine from "@/components/motion/DrawLine";
import Magnetic from "@/components/motion/Magnetic";
import StripPhoto from "@/components/StripPhoto";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
  getEvents,
  type VenueEvent,
} from "@/lib/ticketing";
import { GALLERY_STRIP, IMG } from "@/lib/images";

export const dynamic = "force-dynamic";

const STRIP = GALLERY_STRIP;
const FEATURED_IMAGES = [IMG.featured1, IMG.featured2, IMG.featured3, IMG.featured4];

const PERFORMERS = [
  { image: IMG.performer1, name: "Marcus Adeyemi", role: "Tenor saxophone", bio: "Leads the Friday quintet — never the same solo twice." },
  { image: IMG.performer2, name: "Nina Calloway", role: "Vocals", bio: "Soul standards at half tempo. Holds a room without raising her voice." },
  { image: IMG.performer3, name: "Tomas Brandt", role: "Piano", bio: "Classically trained, jazz-ruined. Tuesdays in the Alcove." },
  { image: IMG.performer4, name: "The Last Orders", role: "Trio", bio: "Standards until close — brass, brushes, and nowhere else to be." },
];

function eventMeta(event: VenueEvent): string {
  return `${formatEventDate(event.starts_at)} · ${event.room_name} · ${formatEventTime(event.starts_at)}`;
}

function eventPrice(event: VenueEvent): string {
  if (event.sold_out) return "Sold out";
  if (event.from_price_pence != null) return `From ${formatPrice(event.from_price_pence, event.currency)}`;
  return "Tickets soon";
}

export default async function LiveEventsPage() {
  const events = await getEvents();
  const featured = events.filter((event) => event.slug !== "ticket-demo").slice(0, 4);
  const headline = featured[0];

  return (
    <>
      <Nav active="/live-events" overlay />
      <main className="flex-grow">
        <CinematicScrollStage imageSrc={IMG.liveHero} />

        <div className="relative z-10 bg-background">
          <Reveal variant="up">
            <div className="border-y border-outline-variant/20 py-6 overflow-hidden bg-[#f5efe8]">
              <ScrollMarquee
                text="JAZZ · SOUL · LOUNGE · LATE SET · CABARET · RESIDENCIES ·"
                className="font-headline-lg text-[22px] md:text-[38px] uppercase tracking-[0.12em] text-[#2c1810]/15 whitespace-nowrap"
              />
            </div>
          </Reveal>

          {headline && (
            <section className="relative py-section-gap-mobile md:py-section-gap-desktop bg-background">
              <DrawLine
                className="absolute left-[12%] top-0 hidden h-full w-px text-primary/40 md:block"
                orientation="vertical"
              />
              <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                <Reveal variant="left" className="order-2 md:order-1">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-5">
                    {eventMeta(headline)}
                  </span>
                  <SplitReveal
                    as="h2"
                    text={headline.title}
                    accentWord={headline.title.split(" ").slice(-1)[0] ?? headline.title}
                    className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em] mb-6"
                  />
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-9">
                    {headline.description}
                  </p>
                  <Magnetic>
                    <ArrowLink href={`/live-events/${headline.slug}`}>Get tickets</ArrowLink>
                  </Magnetic>
                </Reveal>
                <Reveal variant="right" delay={120} className="order-1 md:order-2">
                  <MaskReveal>
                    <ImageHover className="relative aspect-[4/5] md:aspect-square hairline-gold">
                      <Parallax className="h-full w-full" speed={0.12}>
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${IMG.liveJazz}')` }}
                        />
                      </Parallax>
                    </ImageHover>
                  </MaskReveal>
                </Reveal>
              </div>
            </section>
          )}

          <section className="bg-[#2c1810] py-section-gap-mobile md:py-section-gap-desktop overflow-x-clip">
            <Reveal variant="up">
              <ArrowCarousel
                variant="chocolate"
                title="Ticketed nights"
                subtitle="Advance booking recommended — the room is small on purpose."
                trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
              >
                {featured.map((item, i) => (
                  <Reveal
                    key={item.slug}
                    delay={i * 90}
                    variant="up"
                    className="shrink-0 w-[78vw] sm:w-[340px] md:w-[320px]"
                  >
                    <Link
                      href={`/live-events/${item.slug}`}
                      className="events-feature-card arrow-carousel__card group flex h-full flex-col overflow-hidden hairline-gold"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <ImageHover className="absolute inset-0" strength={8}>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage: `url('${FEATURED_IMAGES[i % FEATURED_IMAGES.length]}')`,
                            }}
                          />
                        </ImageHover>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a100c]/80 via-transparent to-transparent" />
                        <span className="absolute bottom-4 left-4 right-4">
                          <span className="font-headline-md text-[22px] uppercase tracking-wide text-[#f5efe8] block leading-tight group-hover:text-[#d4a574] transition-colors">
                            {item.title}
                          </span>
                          <span className="font-label-caps text-[10px] uppercase tracking-[0.22em] text-white/65 mt-1 block">
                            {item.subtitle}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#1a100c] border-t border-white/10">
                        <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-white/60">
                          {eventMeta(item)}
                        </span>
                        <span className="numeral font-price-display text-[17px] text-[#d4a574]">
                          {eventPrice(item)}
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </ArrowCarousel>
            </Reveal>
          </section>

          <section className="py-section-gap-mobile md:py-section-gap-desktop bg-[#f5efe8] overflow-x-clip">
            <Reveal variant="up">
              <ArrowCarousel
                title="The room, mid-set"
                subtitle="Brass, candlelight, and the pause between two songs."
                trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
              >
                {STRIP.map((src, i) => (
                  <Reveal
                    key={`${src}-${i}`}
                    delay={i * 70}
                    variant="up"
                    className={`shrink-0 ${i % 2 === 0 ? "md:translate-y-6" : "md:-translate-y-4"}`}
                  >
                    <div className="lux-card relative aspect-square w-[70vw] sm:w-[280px] md:w-[260px] overflow-hidden">
                      <StripPhoto src={src} />
                    </div>
                  </Reveal>
                ))}
              </ArrowCarousel>
            </Reveal>
          </section>

          <section className="py-section-gap-mobile md:py-section-gap-desktop bg-background overflow-x-clip">
            <Reveal variant="up">
              <ArrowCarousel
                title="Who you'll hear"
                subtitle="Residents and regulars — the voices that define the room."
                trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
              >
                {PERFORMERS.map((p, i) => (
                  <Reveal
                    key={p.name}
                    delay={i * 90}
                    variant="up"
                    className="shrink-0 w-[78vw] sm:w-[300px] md:w-[280px]"
                  >
                    <article className="arrow-carousel__card flex h-full flex-col">
                      <div className="lux-card relative aspect-[4/5] overflow-hidden mb-5">
                        <ImageHover className="absolute inset-0" strength={8}>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${p.image}')` }}
                          />
                        </ImageHover>
                      </div>
                      <h3 className="font-headline-md text-[22px] leading-tight">{p.name}</h3>
                      <p className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em] mt-2 mb-3">
                        {p.role}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant">{p.bio}</p>
                    </article>
                  </Reveal>
                ))}
              </ArrowCarousel>
            </Reveal>
          </section>

          <ConversionBand
            eyebrow="Dinner and a set"
            title="The best seats are at the table"
            body="Book for a performance night and keep your table through the last song — no queue, no rush."
            image={IMG.room}
            primaryHref="/reservations"
            primaryLabel="Book for the show"
            secondaryHref="/contact"
            secondaryLabel="Private lounge enquiry"
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
      className={`link-underline group inline-flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-widest hover:text-primary transition-colors duration-400 w-fit ${className}`}
    >
      {children}
      <span className="material-symbols-outlined text-[18px] transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-1">
        arrow_outward
      </span>
    </Link>
  );
}
