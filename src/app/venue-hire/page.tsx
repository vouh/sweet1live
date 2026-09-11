import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import ArrowCarousel from "@/components/motion/ArrowCarousel";
import SplitReveal from "@/components/motion/SplitReveal";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import ConversionBand from "@/components/ConversionBand";
import VenueEnquiryForm from "@/components/VenueEnquiryForm";
import BrandTagline from "@/components/BrandTagline";
import LazyBackground from "@/components/LazyBackground";
import { IMG } from "@/lib/images";

const CELEBRATIONS = [
  {
    no: "01",
    tag: "Your birthday, your people",
    title: "Birthday Parties",
    body: "Bring your favourite people together for a birthday at Sweet1ne. Tell us your guest numbers and the kind of evening you have in mind, and we will talk through the restaurant booking options.",
    capacity: "Plan your party",
    icon: "groups",
    image: IMG.venueSpace1,
  },
  {
    no: "02",
    tag: "Around the table",
    title: "Celebration Dinners",
    body: "An anniversary, a family occasion, or simply a reason to get everyone together. Celebrate over dinner and drinks in the restaurant with the people who matter.",
    capacity: "Dine together",
    icon: "restaurant",
    image: IMG.venueSpace2,
  },
  {
    no: "03",
    tag: "Make it an occasion",
    title: "Private Celebrations",
    body: "Planning a bigger gathering? Enquire about hiring the restaurant for your celebration. We will confirm availability, the right arrangement for your group, and what is possible on your date.",
    capacity: "Restaurant hire",
    icon: "local_bar",
    image: IMG.venueSpace3,
  },
];

const FACILITIES = [
  {
    icon: "restaurant",
    title: "A focused Sweet1ne menu",
    text: "Live serves a smaller menu from the Sweet1ne kitchen — talk to us about dishes, dietary needs and how you want to dine.",
  },
  {
    icon: "music_note",
    title: "Live music & atmosphere",
    text: "Cosy, vibrant and adult-friendly — performances and a lively night out when the occasion calls for it.",
  },
  {
    icon: "vpn_key",
    title: "Private hire support",
    text: "Available for private hire. We confirm date, guest numbers, seating and special requests before you book.",
  },
];

const STATS = [
  { value: "Dine", label: "Bring everyone together" },
  { value: "Toast", label: "Mark the occasion" },
  { value: "Enjoy", label: "Make it your night" },
];

export default function VenueHirePage() {
  return (
    <>
      <Nav active="/venue-hire" />
      <main className="bg-surface-container-lowest">
        <header className="contact-arch-hero">
          <LazyBackground src={IMG.venue} priority className="contact-arch-hero__image" />
          <div className="contact-arch-hero__veil" />
          <div className="relative z-10 text-center px-margin-mobile md:px-gutter max-w-4xl mx-auto pt-24 pb-28">
            <Reveal variant="blur">
              <BrandTagline variant="eyebrow" onMedia className="mb-5" />
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.45em] block mb-6">
                Parties & celebrations
              </span>
              <h1 className="font-display-lg text-[40px] sm:text-[68px] md:text-[96px] leading-[0.92] uppercase tracking-[0.02em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
                Celebrate with us
              </h1>
              <p className="font-headline-md text-[16px] md:text-[19px] leading-relaxed text-white/85 mt-6 max-w-xl mx-auto">
                Birthdays, brunches, Sunday roasts and private hire — plan a cosy, vibrant evening with
                live energy at Sweet1ne Live.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Magnetic>
                  <a
                    href="#enquire"
                    className="btn-ink inline-flex items-center gap-2 font-label-caps text-label-caps px-7 py-4"
                  >
                    Plan your celebration
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </a>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 font-headline-md text-[17px] md:text-[20px] text-white underline underline-offset-[10px] decoration-white/45 hover:decoration-white transition-colors"
                  >
                    Talk to us
                    <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
                  </Link>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </header>

        <section className="relative z-10 px-margin-mobile md:px-gutter -mt-16 md:-mt-20 pb-12">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3 md:gap-5">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="venue-stat-pill">
                  <span className="font-display-lg text-[28px] md:text-[40px] leading-none text-primary">
                    {s.value}
                  </span>
                  <span className="font-label-caps text-[9px] md:text-[10px] tracking-[0.22em] uppercase text-on-surface-variant mt-2">
                    {s.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="border-y border-outline-variant/25 py-6 overflow-hidden bg-background mb-4">
          <ScrollMarquee
            text="BIRTHDAY PARTIES / CELEBRATION DINNERS / ANNIVERSARIES / FAMILY & FRIENDS / RESTAURANT HIRE"
            className="font-headline-lg text-[22px] md:text-[36px] uppercase tracking-[0.1em] text-on-surface-variant/20 whitespace-nowrap"
          />
        </div>

        <section className="relative z-10 bg-[#f5efe8] py-section-gap-mobile md:py-section-gap-desktop overflow-x-clip">
          <ArrowCarousel
            variant="chocolate"
            title="Your reason to celebrate"
            subtitle="A birthday dinner, a family get-together, or a private party. Tell us what you are celebrating and we will help you plan your restaurant booking."
            trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
          >
            {CELEBRATIONS.map((space, i) => (
              <Reveal
                key={space.no}
                delay={i * 90}
                variant="up"
                className="shrink-0 w-[85vw] sm:w-[380px] md:w-[360px]"
              >
                <article className="venue-room-card arrow-carousel__card flex flex-col overflow-hidden hairline-gold h-full w-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <LazyBackground
                      src={space.image}
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="venue-room-card__veil absolute inset-0" />
                    <span className="absolute top-4 left-4 font-label-caps text-[10px] uppercase tracking-[0.28em] text-[#d4a574] bg-[#1a100c]/85 px-3 py-1.5">
                      {space.tag}
                    </span>
                    <span className="absolute bottom-3 right-4 font-display-lg text-[56px] leading-none text-white/10 select-none">
                      {space.no}
                    </span>
                  </div>
                  <div className="venue-room-card__body flex flex-col flex-grow p-6 md:p-7">
                    <h3 className="font-headline-md text-[22px] md:text-[26px] uppercase tracking-[0.04em] mb-3">
                      {space.title}
                    </h3>
                    <p className="font-body-md text-body-md opacity-80 mb-5 flex-grow">{space.body}</p>
                  </div>
                  <div className="venue-room-card__footer flex items-center justify-between gap-4 px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#d4a574] text-[20px]">
                        {space.icon}
                      </span>
                      <span className="font-label-caps text-[10px] tracking-[0.22em] uppercase text-white/80">
                        {space.capacity}
                      </span>
                    </div>
                    <a
                      href="#enquire"
                      className="inline-flex items-center gap-1.5 font-label-caps text-[10px] uppercase tracking-[0.22em] text-[#f5efe8] hover:text-[#d4a574] transition-colors"
                    >
                      Enquire
                      <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </ArrowCarousel>
        </section>

        <section className="band-mustard relative z-10 py-section-gap-mobile md:py-section-gap-desktop px-margin-mobile md:px-gutter">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SplitReveal
                as="h2"
                text="Plan your night with us"
                accentWord="night"
                className="band-mustard__title font-headline-lg text-[28px] md:text-[44px] uppercase tracking-[0.04em] mb-10"
              />
              <ul className="space-y-8">
                {FACILITIES.map((f, i) => (
                  <Reveal key={f.icon} delay={i * 100}>
                    <li className="flex gap-5">
                      <span className="material-symbols-outlined band-mustard__icon text-[28px] shrink-0">
                        {f.icon}
                      </span>
                      <div>
                        <h4 className="font-headline-md text-[18px] uppercase tracking-[0.06em] mb-2 band-mustard__title">
                          {f.title}
                        </h4>
                        <p className="font-body-md text-body-md band-mustard__muted">{f.text}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <LazyBackground
                src={IMG.collageA}
                className="aspect-[3/4] bg-cover bg-center col-span-1"
              />
              <LazyBackground
                src={IMG.collageB}
                className="aspect-[3/4] bg-cover bg-center col-span-1 mt-8"
              />
            </div>
          </div>
        </section>

        <section id="enquire" className="relative z-10 px-margin-mobile md:px-gutter py-16 md:py-24">
          <VenueEnquiryForm />
        </section>

        <ConversionBand
          image={IMG.toast}
          eyebrow="Need a table instead?"
          title="Book for tonight"
          body="Just joining us for dinner? Reserve a table and enjoy an evening at Sweet1ne."
          primaryHref="/reservations"
          primaryLabel="Reserve a table"
          secondaryHref="/contact"
          secondaryLabel="Talk to us"
        />
        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
