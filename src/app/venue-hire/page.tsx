"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import ArrowCarousel from "@/components/motion/ArrowCarousel";
import SplitReveal from "@/components/motion/SplitReveal";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import ConversionBand from "@/components/ConversionBand";
import { createVenueEnquiry, type ActionState } from "@/lib/api";
import FormSecurityFields from "@/components/FormSecurityFields";
import { trackEvent } from "@/lib/analytics";
import BrandTagline from "@/components/BrandTagline";
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
    reverse: false,
  },
  {
    no: "02",
    tag: "Around the table",
    title: "Celebration Dinners",
    body: "An anniversary, a family occasion, or simply a reason to get everyone together. Celebrate over dinner and drinks in the restaurant with the people who matter.",
    capacity: "Dine together",
    icon: "restaurant",
    image: IMG.venueSpace2,
    reverse: true,
  },
  {
    no: "03",
    tag: "Make it an occasion",
    title: "Private Celebrations",
    body: "Planning a bigger gathering? Enquire about hiring the restaurant for your celebration. We will confirm availability, the right arrangement for your group, and what is possible on your date.",
    capacity: "Restaurant hire",
    icon: "local_bar",
    image: IMG.venueSpace3,
    reverse: false,
  },
];

const FACILITIES = [
  {
    icon: "restaurant",
    title: "Food for your gathering",
    text: "Talk to us about menu options, dietary requirements, and how you would like to dine together.",
  },
  {
    icon: "room_service",
    title: "Drinks & atmosphere",
    text: "From a toast over dinner to a birthday night out, tell us the mood you have in mind.",
  },
  {
    icon: "vpn_key",
    title: "Help with the details",
    text: "Our team will discuss your date, guest numbers, seating, and any special requests before you book.",
  },
];

const STATS = [
  { value: "Dine", label: "Bring everyone together" },
  { value: "Toast", label: "Mark the occasion" },
  { value: "Enjoy", label: "Make it your night" },
];

const initialState: ActionState = { success: false, message: "" };

export default function VenueHirePage() {
  const [state, formAction, pending] = useActionState(createVenueEnquiry, initialState);

  useEffect(() => {
    if (state.success) trackEvent("venue_enquiry_submitted");
  }, [state.success]);

  return (
    <>
      <Nav active="/venue-hire" />
      <main className="bg-surface-container-lowest">
        {/* Arched sticky hero */}
        <header className="contact-arch-hero">
          <div className="contact-arch-hero__image" style={{ backgroundImage: `url('${IMG.venue}')` }} />
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
                Birthdays, anniversaries, and get-togethers with your favourite people.
                Book the restaurant for your celebration and make a night of it at Sweet1ne.
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

        {/* Stats — float over arch */}
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

        {/* Marquee */}
        <div className="border-y border-outline-variant/25 py-6 overflow-hidden bg-background mb-4">
          <ScrollMarquee
            text="BIRTHDAY PARTIES / CELEBRATION DINNERS / ANNIVERSARIES / FAMILY & FRIENDS / RESTAURANT HIRE"
            className="font-headline-lg text-[22px] md:text-[36px] uppercase tracking-[0.1em] text-on-surface-variant/20 whitespace-nowrap"
          />
        </div>

        {/* Choose your room — horizontal cards with arrows */}
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
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${space.image}')` }}
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
                    <Link
                      href="#enquire"
                      className="inline-flex items-center gap-1.5 font-label-caps text-[10px] uppercase tracking-[0.22em] text-[#f5efe8] hover:text-[#d4a574] transition-colors"
                    >
                      Enquire
                      <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </ArrowCarousel>
        </section>

        {/* What's included — mustard gold accent band */}
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
              <div
                className="aspect-[3/4] bg-cover bg-center col-span-1"
                style={{ backgroundImage: `url('${IMG.collageA}')` }}
              />
              <div
                className="aspect-[3/4] bg-cover bg-center col-span-1 mt-8"
                style={{ backgroundImage: `url('${IMG.collageB}')` }}
              />
            </div>
          </div>
        </section>

        {/* Enquiry form — private hire is concierge-led, not self-serve checkout */}
        <section id="enquire" className="relative z-10 px-margin-mobile md:px-gutter py-16 md:py-24">
          <Reveal variant="up">
            <div className="contact-float-card max-w-5xl mx-auto hairline-gold !mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div
                  className="hidden lg:block lg:col-span-2 bg-cover bg-center min-h-[320px]"
                  style={{ backgroundImage: `url('${IMG.collageC}')` }}
                />
                <div className="lg:col-span-3 p-8 md:p-12 lg:p-14">
                  {state.success ? (
                    <div className="text-center flex flex-col items-center gap-5 py-10">
                      <span className="material-symbols-outlined text-primary text-5xl">
                        check_circle
                      </span>
                      <h2 className="font-headline-md text-headline-md">Enquiry received</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                        Thank you. Our team will be in touch to discuss your celebration and availability.
                      </p>
                      <Magnetic>
                        <Link href="/" className="btn-ink font-label-caps text-label-caps px-7 py-4 mt-2">
                          Back to home
                        </Link>
                      </Magnetic>
                    </div>
                  ) : (
                    <>
                      <SplitReveal
                        as="h2"
                        text="Begin your enquiry"
                        accentWord="enquiry"
                        className="font-headline-lg text-[26px] md:text-[34px] uppercase tracking-[0.04em] mb-2"
                      />
                      <p className="font-body-md text-body-md text-on-surface-variant mb-10">
                        Tell us the occasion, your preferred date, and how many people are coming.
                        Our team will follow up with availability, dining options, and pricing.
                        Sending an enquiry does not confirm a booking.
                      </p>
                      <form action={formAction} className="flex flex-col gap-6 relative">
                        <FormSecurityFields />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <Field
                            label="Full name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            error={state.fieldErrors?.name}
                          />
                          <Field
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="you@email.com"
                            error={state.fieldErrors?.email}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label
                              className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                              htmlFor="eventType"
                            >
                              What are you celebrating?
                            </label>
                            <select
                              id="eventType"
                              name="eventType"
                              defaultValue=""
                              required
                              className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
                            >
                              <option disabled value="">
                                Choose an occasion
                              </option>
                              <option value="birthday">Birthday party</option>
                              <option value="private-dinner">Celebration dinner</option>
                              <option value="other">Anniversary or other celebration</option>
                            </select>
                            {state.fieldErrors?.event_type && (
                              <p className="text-error text-sm">{state.fieldErrors.event_type[0]}</p>
                            )}
                          </div>
                          <Field
                            label="Estimated guests"
                            name="guests"
                            type="number"
                            placeholder="e.g. 50"
                            error={state.fieldErrors?.guests}
                          />
                        </div>
                        <Field
                          label="Preferred date"
                          name="date"
                          type="date"
                          error={state.fieldErrors?.date}
                        />
                        <div className="flex flex-col gap-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                            htmlFor="details"
                          >
                            Additional details
                          </label>
                          <textarea
                            id="details"
                            name="details"
                            rows={4}
                            placeholder="Tell us about the occasion, preferred time, dining plans, and any special requests"
                            className="w-full bg-surface-container-lowest border border-outline-variant text-on-background p-4 focus:ring-0 focus:border-primary transition-colors resize-none"
                          />
                        </div>
                        {!state.success && state.message && (
                          <p className="text-error text-sm">{state.message}</p>
                        )}
                        <Magnetic>
                          <button
                            type="submit"
                            disabled={pending}
                            className="btn-ink font-label-caps text-label-caps uppercase tracking-widest px-10 py-4 disabled:opacity-60"
                          >
                            {pending ? "Submitting…" : "Submit enquiry"}
                          </button>
                        </Magnetic>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
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

function Field({
  label,
  name,
  type,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={type !== "number" ? true : undefined}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
      />
      {error && <p className="text-error text-sm">{error[0]}</p>}
    </div>
  );
}
