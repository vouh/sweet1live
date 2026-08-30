"use client";

import Link from "next/link";
import { useActionState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import SplitReveal from "@/components/motion/SplitReveal";
import ConversionBand from "@/components/ConversionBand";
import { createContactMessage, type ActionState } from "@/lib/api";
import BrandTagline from "@/components/BrandTagline";
import FormSecurityFields from "@/components/FormSecurityFields";
import { IMG } from "@/lib/images";
import { SITE_CONTACT_DETAILS } from "@/lib/brand";

const HERO = IMG.contact;
const LIFESTYLE = IMG.guests;

const initialState: ActionState = { success: false, message: "" };

export default function ContactPage() {
  const [state, formAction, pending] = useActionState(createContactMessage, initialState);

  return (
    <>
      <Nav active="/contact" />
      <main className="flex-grow w-full bg-surface-container-lowest">
        {/* Arched sticky hero — content flies over */}
        <header className="contact-arch-hero">
          <div className="contact-arch-hero__image" style={{ backgroundImage: `url('${HERO}')` }} />
          <div className="contact-arch-hero__veil" />
          <div className="relative z-10 text-center px-margin-mobile md:px-gutter max-w-3xl mx-auto pt-24 pb-32">
            <Reveal variant="blur">
              <BrandTagline variant="eyebrow" onMedia className="mb-5" />
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.45em] block mb-6">
                Concierge
              </span>
              <h1 className="font-display-lg text-[40px] sm:text-[64px] md:text-[88px] leading-[0.95] uppercase tracking-[0.02em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
                Have a question?
              </h1>
              <p className="font-headline-md text-[16px] md:text-[19px] leading-relaxed text-white/85 mt-6 max-w-lg mx-auto">
                Private dining, celebrations, press — tell us the brief and we&apos;ll shape the
                evening around it.
              </p>
            </Reveal>
          </div>
        </header>

        {/* Floating card — overlaps arch + cream band */}
        <section className="relative z-10 px-margin-mobile md:px-gutter pb-16 md:pb-24">
          <Reveal variant="up">
            <div className="contact-float-card max-w-5xl mx-auto hairline-gold">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Form column */}
                <div className="p-8 md:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-outline-variant/25">
                  {state.success ? (
                    <div className="text-center flex flex-col items-center gap-5 py-12">
                      <span className="material-symbols-outlined text-primary text-5xl">
                        mark_email_read
                      </span>
                      <h2 className="font-headline-md text-headline-md">Message received</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                        Thank you — our team will continue the conversation shortly.
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
                        text="Send a message"
                        accentWord="message"
                        className="font-headline-lg text-[26px] md:text-[34px] uppercase tracking-[0.04em] mb-2"
                      />
                      <p className="font-body-md text-body-md text-on-surface-variant mb-10">
                        Every detail helps us prepare before we reply.
                      </p>
                      <form action={formAction} className="flex flex-col gap-6 relative">
                        <FormSecurityFields />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <Field label="Full name" name="name" type="text" placeholder="Your name" />
                          <Field label="Email" name="email" type="email" placeholder="you@email.com" />
                        </div>
                        <Field
                          label="Subject"
                          name="subject"
                          type="text"
                          placeholder="e.g. Private dining for 12"
                        />
                        <div className="flex flex-col gap-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                            htmlFor="message"
                          >
                            Message
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            required
                            rows={4}
                            placeholder="Tell us about the evening you have in mind…"
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
                            className="btn-ink w-full sm:w-auto font-label-caps text-label-caps uppercase tracking-widest px-10 py-4 disabled:opacity-60"
                          >
                            {pending ? "Sending…" : "Send message"}
                          </button>
                        </Magnetic>
                        <p className="font-body-md text-[12px] text-on-surface-variant/70 leading-relaxed">
                          By sending, you agree we may contact you about your enquiry. We never
                          share your details.
                        </p>
                      </form>
                    </>
                  )}
                </div>

                {/* Visual + get in touch */}
                <div className="flex flex-col">
                  <div
                    className="contact-side-image flex-1 bg-cover bg-center min-h-[220px]"
                    style={{ backgroundImage: `url('${LIFESTYLE}')` }}
                  />
                  <div className="p-8 md:p-10 bg-primary-container text-on-primary-container">
                    <h3 className="font-headline-md text-[22px] uppercase tracking-[0.06em] mb-8">
                      Get in touch
                    </h3>
                    <ul className="space-y-6">
                      {SITE_CONTACT_DETAILS.map((d) => (
                        <li key={d.icon} className="contact-detail-row">
                          <span className="contact-detail-row__icon">
                            <span className="material-symbols-outlined text-[20px]">{d.icon}</span>
                          </span>
                          <div>
                            <span className="font-label-caps text-[10px] tracking-[0.28em] uppercase opacity-70 block mb-1">
                              {d.label}
                            </span>
                            {"href" in d && d.href ? (
                              <a href={d.href} className="font-body-md text-body-md hover:text-[#f5efe8] transition-colors">
                                {d.value}
                              </a>
                            ) : (
                              <span className="font-body-md text-body-md">{d.value}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/reservations"
                      className="inline-flex items-center gap-2 mt-10 font-label-caps text-label-caps uppercase tracking-[0.25em] text-[#d4a574] hover:text-[#f5efe8] transition-colors"
                    >
                      Or reserve a table
                      <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <ConversionBand
          eyebrow="Prefer a table tonight?"
          title="Skip the wait — reserve now"
          body="Already know your night? Book directly and we'll have the room ready."
          primaryHref="/reservations"
          primaryLabel="Reserve a table"
          secondaryHref="/venue-hire"
          secondaryLabel="Enquire about venue hire"
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
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
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
        required
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
      />
    </div>
  );
}
