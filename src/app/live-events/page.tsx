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
import { GALLERY_STRIP, IMG } from "@/lib/images";

const STRIP = GALLERY_STRIP;

const FEATURED = [
  { image: IMG.featured1, act: "Blue Note Quintet", genre: "Modal jazz · Hard bop", meta: "Fri 15 Nov · Main Room · 20:30", price: "From £25" },
  { image: IMG.featured2, act: "Velvet Sessions", genre: "Soul · R&B", meta: "Sat 16 Nov · The Lounge · 21:00", price: "From £35" },
  { image: IMG.featured3, act: "Cellar Sessions", genre: "Acoustic · Tasting", meta: "Fri 13 Dec · The Cellar · 21:30", price: "From £30" },
  { image: IMG.featured4, act: "The Last Orders Trio", genre: "Standards", meta: "Fri 6 Dec · Main Room · 22:00", price: "From £25" },
];

const PERFORMERS = [
  { image: IMG.performer1, name: "Marcus Adeyemi", role: "Tenor saxophone", bio: "Leads the Friday quintet — never the same solo twice." },
  { image: IMG.performer2, name: "Nina Calloway", role: "Vocals", bio: "Soul standards at half tempo. Holds a room without raising her voice." },
  { image: IMG.performer3, name: "Tomas Brandt", role: "Piano", bio: "Classically trained, jazz-ruined. Tuesdays in the Alcove." },
  { image: IMG.performer4, name: "The Last Orders", role: "Trio", bio: "Standards until close — brass, brushes, and nowhere else to be." },
];

export default function LiveEventsPage() {
  return (
    <>
      <Nav active="/live-events" overlay />
      <main className="flex-grow">
        {/* Cinematic film scrub: hero → dolly → dinner resolve */}
        <CinematicScrollStage imageSrc={IMG.liveHero} />

        <div className="relative z-10 bg-background">
          {/* Marquee rhythm band */}
          <Reveal variant="up">
            <div className="border-y border-outline-variant/20 py-6 overflow-hidden bg-[#f5efe8]">
              <ScrollMarquee
                text="JAZZ · SOUL · LOUNGE · LATE SET · CABARET · RESIDENCIES ·"
                className="font-headline-lg text-[22px] md:text-[38px] uppercase tracking-[0.12em] text-[#2c1810]/15 whitespace-nowrap"
              />
            </div>
          </Reveal>

          {/* Headline act — editorial split */}
          <section className="relative py-section-gap-mobile md:py-section-gap-desktop bg-background">
            <DrawLine
              className="absolute left-[12%] top-0 hidden h-full w-px text-primary/40 md:block"
              orientation="vertical"
            />
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <Reveal variant="left" className="order-2 md:order-1">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-5">
                  Fri 15 Nov · The Main Room
                </span>
                <SplitReveal
                  as="h2"
                  text="Blue Note Quintet"
                  accentWord="Quintet"
                  className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em] mb-6"
                />
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-9">
                  Modal jazz and hard bop from leading session musicians. Doors at 20:00, first set
                  at 20:30 — intimate, precise, and gone before you want it to be.
                </p>
                <Magnetic>
                  <ArrowLink href="/reservations">Book the first set</ArrowLink>
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

          {/* Second act — cream band */}
          <section className="relative bg-[#f5efe8] py-section-gap-mobile md:py-section-gap-desktop">
            <DrawLine
              className="absolute right-[12%] top-0 hidden h-full w-px text-[#2c1810]/25 md:block"
              orientation="vertical"
            />
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <Reveal variant="left">
                <MaskReveal>
                  <ImageHover className="relative aspect-[4/5] md:aspect-square hairline-gold">
                    <Parallax className="h-full w-full" speed={0.12}>
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${IMG.liveBar}')` }}
                      />
                    </Parallax>
                  </ImageHover>
                </MaskReveal>
              </Reveal>
              <Reveal variant="right" delay={120}>
                <span className="font-label-caps text-label-caps text-[#2c1810]/70 uppercase tracking-widest block mb-5">
                  Sat 16 Nov · The Lounge
                </span>
                <SplitReveal
                  as="h2"
                  text="Velvet Sessions"
                  accentWord="Sessions"
                  className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em] mb-6 text-[#2c1810]"
                />
                <p className="font-body-lg text-body-lg text-[#2c1810]/75 max-w-md mb-9">
                  Reimagined soul and R&amp;B at a slower tempo, played to a room lit for lingering.
                  The perfect companion to a late dinner and a second bottle.
                </p>
                <Magnetic>
                  <ArrowLink href="/reservations" className="text-[#2c1810]">
                    Reserve under the music
                  </ArrowLink>
                </Magnetic>
              </Reveal>
            </div>
          </section>

          {/* Featured sets — arrow carousel on chocolate band */}
          <section className="bg-[#2c1810] py-section-gap-mobile md:py-section-gap-desktop overflow-x-clip">
            <Reveal variant="up">
              <ArrowCarousel
                variant="chocolate"
                title="Ticketed nights"
                subtitle="Advance booking recommended — the room is small on purpose."
                trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
              >
                {FEATURED.map((item, i) => (
                  <Reveal
                    key={item.act}
                    delay={i * 90}
                    variant="up"
                    className="shrink-0 w-[78vw] sm:w-[340px] md:w-[320px]"
                  >
                    <Link
                      href="/reservations"
                      className="events-feature-card arrow-carousel__card group flex h-full flex-col overflow-hidden hairline-gold"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <ImageHover className="absolute inset-0" strength={8}>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${item.image}')` }}
                          />
                        </ImageHover>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a100c]/80 via-transparent to-transparent" />
                        <span className="absolute bottom-4 left-4 right-4">
                          <span className="font-headline-md text-[22px] uppercase tracking-wide text-[#f5efe8] block leading-tight group-hover:text-[#d4a574] transition-colors">
                            {item.act}
                          </span>
                          <span className="font-label-caps text-[10px] uppercase tracking-[0.22em] text-white/65 mt-1 block">
                            {item.genre}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#1a100c] border-t border-white/10">
                        <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-white/60">
                          {item.meta}
                        </span>
                        <span className="numeral font-price-display text-[17px] text-[#d4a574]">
                          {item.price}
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </ArrowCarousel>
            </Reveal>
          </section>

          {/* Atmosphere strip — cream with arrows */}
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

          {/* Residents carousel */}
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

          {/* Sticky parallax booking band — scrolls under footer */}
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
