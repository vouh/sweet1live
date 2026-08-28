"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import SplitReveal from "@/components/motion/SplitReveal";
import ConversionBand from "@/components/ConversionBand";
import { useAuthModal } from "@/components/AuthModalProvider";
import { createReservation, type ActionState } from "@/lib/api";
import { IMG } from "@/lib/images";

const TIMES = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const UNAVAILABLE = new Set(["18:00"]);
const HERO = IMG.reservations;

const NOTES = [
  { icon: "schedule", text: "Tables held for 15 minutes past reservation time." },
  { icon: "groups", text: "Parties of six or more — ask for a tailored seating plan." },
  { icon: "music_note", text: "Live sets fill the room. Book early Fri & Sat." },
];

const initialState: ActionState = { success: false, message: "" };

export default function ReservationsPage() {
  const [state, formAction, pending] = useActionState(createReservation, initialState);
  const [time, setTime] = useState("20:00");
  const { open: openAuth } = useAuthModal();

  return (
    <>
      <Nav active="/reservations" />
      <main className="flex-grow">
        <section className="relative">
          {/* Sticky room — booking card scrolls over */}
          <div className="sticky top-0 z-0 h-[100svh] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${HERO}')` }}
            />
            <div className="absolute inset-0 bg-[#1a100c]/40" />
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-margin-mobile">
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.4em] block mb-6">
                Bookings
              </span>
              <h1 className="font-display-lg text-[48px] sm:text-[80px] md:text-[110px] leading-[0.9] uppercase tracking-[0.01em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
                Reserve a table
              </h1>
              <p className="font-headline-md text-[17px] md:text-[20px] text-white/85 mt-6 max-w-lg">
                Peak sets fill first — lock in your evening before the room sells out.
              </p>
            </div>
          </div>

          <div className="relative z-10 -mt-[28vh] md:-mt-[22vh] px-margin-mobile md:px-gutter pb-20">
            <Reveal variant="up">
              <div className="max-w-3xl mx-auto bg-background p-6 md:p-12 hairline-gold shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]">
                {state.success ? (
                  <div className="text-center flex flex-col items-center gap-5 py-8">
                    <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                    <h2 className="font-headline-md text-headline-md">Reservation confirmed</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                      We&apos;ve emailed your confirmation. We look forward to welcoming you.
                    </p>
                    <Magnetic>
                      <Link href="/" className="btn-ink font-label-caps text-label-caps px-7 py-4 mt-2">
                        Back to home
                      </Link>
                    </Magnetic>
                  </div>
                ) : (
                  <form action={formAction} className="flex flex-col gap-9">
                    <SplitReveal
                      as="h2"
                      text="Your evening"
                      accentWord="evening"
                      className="font-headline-md text-headline-md uppercase tracking-[0.03em]"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field
                        label="Full name"
                        name="name"
                        type="text"
                        placeholder="e.g. Miles Davis"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label
                          className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                          htmlFor="partySize"
                        >
                          Party size
                        </label>
                        <select
                          id="partySize"
                          name="partySize"
                          defaultValue="2"
                          className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
                        >
                          <option value="2">2 Guests</option>
                          <option value="3">3 Guests</option>
                          <option value="4">4 Guests</option>
                          <option value="5">5 Guests</option>
                          <option value="6">6+ Guests</option>
                        </select>
                      </div>
                      <Field label="Date" name="date" type="date" error={state.fieldErrors?.date} />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-end">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]">
                          Available times
                        </span>
                        <span className="font-body-md text-sm text-on-surface-variant">
                          Main Room · Jazz Trio
                        </span>
                      </div>
                      <input type="hidden" name="time" value={time} />
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {TIMES.map((t) => {
                          const unavailable = UNAVAILABLE.has(t);
                          const selected = t === time;
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={unavailable}
                              onClick={() => setTime(t)}
                              className={`numeral py-3 font-label-caps text-label-caps transition-all duration-300 ${
                                unavailable
                                  ? "border border-outline-variant/30 text-on-surface-variant/30 cursor-not-allowed line-through"
                                  : selected
                                    ? "bg-primary-container text-on-primary-container border border-primary-container"
                                    : "border border-outline-variant text-on-background hover:border-primary hover:text-primary"
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!state.success && state.message && (
                      <p className="text-error text-sm">{state.message}</p>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-outline-variant/25">
                      <Link
                        href="/"
                        className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-background transition-colors"
                      >
                        Cancel
                      </Link>
                      <Magnetic>
                        <button
                          type="submit"
                          disabled={pending}
                          className="btn-ink font-label-caps text-label-caps px-8 py-4 uppercase tracking-wider disabled:opacity-60"
                        >
                          {pending ? "Booking…" : "Confirm reservation"}
                        </button>
                      </Magnetic>
                    </div>
                  </form>
                )}
              </div>
            </Reveal>

            <div className="max-w-3xl mx-auto mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              {NOTES.map((note, i) => (
                <Reveal key={note.icon} delay={i * 100}>
                  <div className="bg-background/95 p-5 hairline-gold">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-3 block">
                      {note.icon}
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">{note.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="text-center mt-12">
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="link-underline font-label-caps text-label-caps uppercase tracking-[0.25em] inline-flex hover:text-primary transition-colors"
              >
                Create an account for faster booking
              </button>
            </p>
          </div>
        </section>

        <ConversionBand
          eyebrow="Still deciding?"
          title="Concierge can shape the evening"
          body="Celebrations, dietary notes, or the perfect booth for the first set — start a conversation."
          primaryHref="/contact"
          primaryLabel="Message concierge"
          secondaryHref="/live-events"
          secondaryLabel="See what's on"
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
        required
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
      />
      {error && <p className="text-error text-sm">{error[0]}</p>}
    </div>
  );
}
