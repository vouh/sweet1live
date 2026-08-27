"use client";

import Link from "next/link";
import { useActionState } from "react";
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

const IMG = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-J7OKNApbhSMjylLXw8z58YzjUzEwkwj9oLsQBNrNRYwbvz0mM0JMlB5KeOY777TSO7OOZ43y9Dg73hgN6dAS0TOCONmoKW1_sYYZq2cYuEwfOS2rHyQcElS5JUDvmriPHbTmI2Nlg1GnNLivFDTDb5YtUO1aM9egmqqWmGNuIPdld2ELO5FsuSvRHRID2oCCH1qY9hhkQTDK7bmeOUMIo1v8_gAMD0Ld6G8z70YDYnQOVV-dWqA",
  alcove:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBmrCFAAPqoEJhX1LeNwItEkRJZ69ElcMZ0lmBbY6GCqask3tTZ8hxguYb5tiEkzzEOeEKTVkd74qYqk6eZTVn391_bKqArIZQqrbalvDeMhd54rAzdOxt0yiFiERAGqehBRVpexx13nv5ofCIBCjnmPYCZTFpk2K2x2iYcOE-r1Io_z4-QXEe7CAhD5y493hWcFtFXvP8yWb3WzLZZsSLNfJWwfpUqY763JWxSEebzK1rP3aaGJ-c",
  lounge:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCfxwU2V6zl1pvyDXYC16de0MgoBIcocj5kQ4fSxc0YXiAOBj27T0SqIVVLpaBfnDPglkAAtMEgaXj_0uYoG95cGQLc3jpE411877G2F4Z8OMRy3JhP2HzJ9zxN04QBz8fx3B6SSf3A8Z4_d0UxbRwzQKpyBoyQUV1h1XR9MANU3_7g2VS7NRuQpLzI00ysEOKjHkt5N5jWmr6f7T_HJFFuGqfEsLOyDFYRB8AsnbFAqLB1hTY2_nY",
  pour: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNmwW-zXR6NIL6kJPw5-SIR_HoLp9u2UqU_39h5p66jdzG2UOCdLBSVMrczxjol5gdWDwDUFHRN-2xdLHtII-KAAH-09lUkHmsNFYmYLkWuzRfFD__A-YzsCa_YYJnm634PDJjvHiAbauNrLk5QpSvvDzLRWpCdC4GRftnIvK_o2Kfj-En5a_Nb6wKeRxILQ6nvoBN5NOxW5jF-3InrRB0IPgIsxwar2pSEgmI2xf7LvUMsgG2Nuk",
  toast: "/images/guests-toast.png",
};

const SPACES = [
  {
    no: "01",
    tag: "Full takeover",
    title: "Corporate Events",
    body: "Impress clients with cinematic atmosphere, state-of-the-art AV, and bespoke catering for high-end gatherings.",
    capacity: "Up to 250 guests",
    icon: "groups",
    image: IMG.hero,
    reverse: false,
  },
  {
    no: "02",
    tag: "The Alcove",
    title: "Private Dinners",
    body: "Secluded elegance for intimate tasting menus, milestone toasts, and conversations that deserve the room.",
    capacity: "Up to 24 guests",
    icon: "restaurant",
    image: IMG.alcove,
    reverse: true,
  },
  {
    no: "03",
    tag: "Lounge reserve",
    title: "Milestone Birthdays",
    body: "Curated bottle service, premium booths, and live rhythm — celebrate with sophistication and energy.",
    capacity: "Up to 80 guests",
    icon: "local_bar",
    image: IMG.lounge,
    reverse: false,
  },
];

const FACILITIES = [
  {
    icon: "mic_external_on",
    title: "Stage & AV",
    text: "Industry sound, dynamic lighting, and a dedicated stage for speeches, jazz, or DJ sets.",
  },
  {
    icon: "room_service",
    title: "Bespoke catering",
    text: "Canapés to multi-course tasting menus — shaped to the tone of your evening.",
  },
  {
    icon: "vpn_key",
    title: "Concierge & security",
    text: "Private entry, dedicated host, and a door team for a seamless arrival.",
  },
];

const STATS = [
  { value: "250", label: "Max capacity" },
  { value: "3", label: "Distinct spaces" },
  { value: "24/7", label: "Event concierge" },
];

const initialState: ActionState = { success: false, message: "" };

export default function VenueHirePage() {
  const [state, formAction, pending] = useActionState(createVenueEnquiry, initialState);

  return (
    <>
      <Nav active="/venue-hire" />
      <main className="bg-surface-container-lowest">
        {/* Arched sticky hero */}
        <header className="contact-arch-hero">
          <div className="contact-arch-hero__image" style={{ backgroundImage: `url('${IMG.hero}')` }} />
          <div className="contact-arch-hero__veil" />
          <div className="relative z-10 text-center px-margin-mobile md:px-gutter max-w-4xl mx-auto pt-24 pb-28">
            <Reveal variant="blur">
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.45em] block mb-6">
                Private events
              </span>
              <h1 className="font-display-lg text-[40px] sm:text-[68px] md:text-[96px] leading-[0.92] uppercase tracking-[0.02em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
                Make it yours
              </h1>
              <p className="font-headline-md text-[16px] md:text-[19px] leading-relaxed text-white/85 mt-6 max-w-xl mx-auto">
                From intimate private dinners to full venue takeovers — a cinematic backdrop for
                nights your guests never forget.
              </p>
              <Magnetic>
                <a
                  href="#enquire"
                  className="inline-flex items-center gap-2 mt-10 font-headline-md text-[17px] md:text-[20px] text-white underline underline-offset-[10px] decoration-white/45 hover:decoration-white transition-colors"
                >
                  Start an enquiry
                  <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
                </a>
              </Magnetic>
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
            text="FULL TAKEOVER · PRIVATE DINING · LOUNGE RESERVE · BESPOKE MENUS · LIVE MUSIC ·"
            className="font-headline-lg text-[22px] md:text-[36px] uppercase tracking-[0.1em] text-on-surface-variant/20 whitespace-nowrap"
          />
        </div>

        {/* Choose your room — horizontal cards with arrows */}
        <section className="relative z-10 bg-[#f5efe8] py-section-gap-mobile md:py-section-gap-desktop overflow-x-clip">
          <ArrowCarousel
            variant="chocolate"
            title="Choose your room"
            subtitle="Three distinct spaces — from full takeover to an intimate alcove for twenty-four."
            trackClassName="max-w-container-max mx-auto px-margin-mobile md:px-gutter"
          >
            {SPACES.map((space, i) => (
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

        {/* What's included — chocolate band */}
        <section className="relative z-10 bg-primary-container text-on-primary-container py-section-gap-mobile md:py-section-gap-desktop px-margin-mobile md:px-gutter">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SplitReveal
                as="h2"
                text="What's included"
                accentWord="included"
                className="font-headline-lg text-[28px] md:text-[44px] uppercase tracking-[0.04em] mb-10 text-[#f5efe8]"
              />
              <ul className="space-y-8">
                {FACILITIES.map((f, i) => (
                  <Reveal key={f.icon} delay={i * 100}>
                    <li className="flex gap-5">
                      <span className="material-symbols-outlined text-[#d4a574] text-[28px] shrink-0">
                        {f.icon}
                      </span>
                      <div>
                        <h4 className="font-headline-md text-[18px] uppercase tracking-[0.06em] mb-2 text-[#f5efe8]">
                          {f.title}
                        </h4>
                        <p className="font-body-md text-body-md text-white/70">{f.text}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="aspect-[3/4] bg-cover bg-center col-span-1"
                style={{ backgroundImage: `url('${IMG.pour}')` }}
              />
              <div
                className="aspect-[3/4] bg-cover bg-center col-span-1 mt-8"
                style={{ backgroundImage: `url('${IMG.toast}')` }}
              />
            </div>
          </div>
        </section>

        {/* Floating enquiry card */}
        <section id="enquire" className="relative z-10 px-margin-mobile md:px-gutter py-16 md:py-24">
          <Reveal variant="up">
            <div className="contact-float-card max-w-5xl mx-auto hairline-gold !mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div
                  className="hidden lg:block lg:col-span-2 bg-cover bg-center min-h-[320px]"
                  style={{ backgroundImage: `url('${IMG.alcove}')` }}
                />
                <div className="lg:col-span-3 p-8 md:p-12 lg:p-14">
                  {state.success ? (
                    <div className="text-center flex flex-col items-center gap-5 py-10">
                      <span className="material-symbols-outlined text-primary text-5xl">
                        check_circle
                      </span>
                      <h2 className="font-headline-md text-headline-md">Enquiry received</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                        Thank you — our Events Concierge will be in touch shortly.
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
                        Share the brief — we&apos;ll curate the room, menu, and rhythm around it.
                      </p>
                      <form action={formAction} className="flex flex-col gap-6">
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
                              Event type
                            </label>
                            <select
                              id="eventType"
                              name="eventType"
                              defaultValue=""
                              required
                              className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
                            >
                              <option disabled value="">
                                Select type
                              </option>
                              <option value="corporate">Corporate event</option>
                              <option value="birthday">Milestone birthday</option>
                              <option value="private-dinner">Private dinner</option>
                              <option value="other">Other</option>
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
                            placeholder="Catering preferences, AV needs, timing…"
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
          body="Not hiring the full room? Reserve a table under the music."
          primaryHref="/reservations"
          primaryLabel="Reserve a table"
          secondaryHref="/contact"
          secondaryLabel="Message concierge"
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
